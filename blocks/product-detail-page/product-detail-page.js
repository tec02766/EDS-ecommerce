import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  const currentPath = window.location.pathname;
  block.innerHTML = '<p class="loading">Loading product details...</p>';

  try {
    const response = await fetch('/products.json');
    if (!response.ok) throw new Error('Catalog database offline');
    const json = await response.json();

    const product = json.data.find((item) => item.urlPath === currentPath);
    if (!product) {
      block.innerHTML = '<p class="error">Product configuration not found in spreadsheet matching this URL.</p>';
      return;
    }

    const stockAvailable = parseInt(product.quantity || 0, 10);
    const normalizeVariationList = (value) => (value ? String(value)
      .split(/[|,;]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .join(', ') : '');
    const productColours = normalizeVariationList(product.color);
    const productSizes = normalizeVariationList(product.size);
    const productCategory = normalizeVariationList(product.category);
    const productSku = normalizeVariationList(product.sku);

    block.innerHTML = '';

    const pdpWrapper = document.createElement('div');
    pdpWrapper.className = 'pdp-container';

    // 1. Image Section
    const mediaSide = document.createElement('div');
    mediaSide.className = 'pdp-media-side';
    const mainImg = createOptimizedPicture(product.image, product.title, true, [{ width: '600' }]);
    mediaSide.innerHTML = `<div class="pdp-main-image">${mainImg.outerHTML}</div>`;

    if (product.gallery) {
      const galleryWrapper = document.createElement('div');
      galleryWrapper.className = 'pdp-gallery-thumbs';
      product.gallery.split(',').forEach((imgUrl) => {
        const thumb = createOptimizedPicture(imgUrl.trim(), product.title, false, [{ width: '100' }]);
        galleryWrapper.appendChild(thumb);
      });
      mediaSide.appendChild(galleryWrapper);
    }

    // 2. Info Section & Stock-Aware Quantity Selector
    const infoSide = document.createElement('div');
    infoSide.className = 'pdp-info-side';

    // Check if item is completely out of stock initially
    const isInitiallyOos = stockAvailable <= 0;
    const maxQty = Math.min(stockAvailable || 1, 10);

    infoSide.innerHTML = `
      <h1 class="pdp-title">${product.title}</h1>
      <p class="pdp-short-desc">${product.short_description}</p>
      <p class="pdp-price">$${parseFloat(product.price).toFixed(2)}</p>

      <div class="pdp-qty-wrapper" ${isInitiallyOos ? 'style="display:none;"' : ''}>
        <label class="pdp-qty-label">Qty:</label>
        <div class="pdp-qty-stepper" aria-label="Quantity selector">
          <button type="button" class="pdp-qty-btn pdp-qty-minus" aria-label="Decrease quantity">-</button>
          <span class="pdp-qty-value" aria-live="polite">1</span>
          <button type="button" class="pdp-qty-btn pdp-qty-plus" aria-label="Increase quantity">+</button>
        </div>
      </div>

      <button class="pdp-add-btn" ${isInitiallyOos ? 'disabled' : ''}>
        ${isInitiallyOos ? 'Out of Stock' : 'Add to Bag'}
      </button>
      <p class="stock-error-msg" style="color: red; display: none; margin-top: 5px; font-size: 0.9em;"></p>

      <div class="pdp-long-desc">
        <h6>Product details</h6>
        <p>${product.description}</p>
        <div class="pdp-meta-details">
        ${productColours ? `<p class="pdp-colours"><strong>Available colours:</strong> ${productColours}</p>` : ''}
        ${productSizes ? `<p class="pdp-sizes"><strong>Available sizes:</strong> ${productSizes}</p>` : ''}
        ${productCategory ? `<p class="pdp-category"><strong>Category:</strong> ${productCategory}</p>` : ''}
        ${productSku ? `<p class="pdp-sku"><strong>SKU:</strong> ${productSku}</p>` : ''}
        </div>
      </div>
    `;

    const relatedProducts = json.data.filter((item) => item.category
      && item.category.toLowerCase() === product.category?.toLowerCase()
      && item.urlPath !== currentPath)
      .slice(0, 4);

    const addToBagBtn = infoSide.querySelector('.pdp-add-btn');
    const qtyValueEl = infoSide.querySelector('.pdp-qty-value');
    const minusBtn = infoSide.querySelector('.pdp-qty-minus');
    const plusBtn = infoSide.querySelector('.pdp-qty-plus');
    const errorMsg = infoSide.querySelector('.stock-error-msg');
    let selectedQty = 1;

    const syncQtyValue = () => {
      qtyValueEl.textContent = selectedQty;
      minusBtn.disabled = selectedQty <= 1;
      plusBtn.disabled = selectedQty >= maxQty;
    };

    minusBtn.addEventListener('click', () => {
      if (selectedQty > 1) {
        selectedQty -= 1;
        syncQtyValue();
      }
    });

    plusBtn.addEventListener('click', () => {
      if (selectedQty < maxQty) {
        selectedQty += 1;
        syncQtyValue();
      }
    });

    syncQtyValue();

    addToBagBtn.addEventListener('click', () => {
      errorMsg.style.display = 'none';
      const quantityToAdd = selectedQty;
      const cart = JSON.parse(localStorage.getItem('aem-cart')) || [];
      const existingProduct = cart.find((item) => item.sku === product.sku);

      const currentCartQty = existingProduct ? existingProduct.quantity : 0;
      const totalRequestedQty = currentCartQty + quantityToAdd;

      // Validate against the total stock from your Excel file
      if (totalRequestedQty > stockAvailable) {
        const remainingAllowed = stockAvailable - currentCartQty;
        if (remainingAllowed <= 0) {
          errorMsg.textContent = `Sorry, you already have the maximum available stock (${stockAvailable}) in your bag.`;
        } else {
          errorMsg.textContent = `Only ${stockAvailable} available. You can only add ${remainingAllowed} more.`;
        }
        errorMsg.style.display = 'block';
        return;
      }

      // Commit to LocalStorage
      if (existingProduct) {
        existingProduct.quantity = totalRequestedQty;
      } else {
        cart.push({
          sku: product.sku,
          title: product.title,
          image: product.image,
          price: parseFloat(product.price),
          quantity: quantityToAdd,
        });
      }

      localStorage.setItem('aem-cart', JSON.stringify(cart));

      // Global Custom Event to notify the Dynamic Header
      window.dispatchEvent(new CustomEvent('cart-updated'));

      addToBagBtn.textContent = 'Added!';
      setTimeout(() => { addToBagBtn.textContent = 'Add to Bag'; }, 2000);
    });

    pdpWrapper.appendChild(mediaSide);
    pdpWrapper.appendChild(infoSide);
    block.appendChild(pdpWrapper);

    if (relatedProducts.length) {
      const relatedSection = document.createElement('div');
      relatedSection.className = 'pdp-related-products';

      const relatedTitle = document.createElement('h4');
      relatedTitle.className = 'pdp-related-title';
      relatedTitle.textContent = 'Related products';

      const relatedGrid = document.createElement('div');
      relatedGrid.className = 'product-grid';

      relatedProducts.forEach((relatedItem) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const picture = createOptimizedPicture(relatedItem.image, relatedItem.title, false, [{ width: '400' }]);

        card.innerHTML = `
          <a href="${relatedItem.urlPath}" class="card-link">
            <div class="card-image">${picture.outerHTML}</div>
            <div class="card-info">
              <h4 class="product-title">${relatedItem.title}</h4>
              <p class="product-price">$${parseFloat(relatedItem.price).toFixed(2)}</p>
            </div>
          </a>
        `;

        relatedGrid.appendChild(card);
      });

      relatedSection.appendChild(relatedTitle);
      relatedSection.appendChild(relatedGrid);
      block.appendChild(relatedSection);
    }
  } catch (err) {
    block.innerHTML = `<p class="error">Failed loading specifications: ${err.message}</p>`;
  }
}
