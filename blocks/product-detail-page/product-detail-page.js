import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  const currentPath = window.location.pathname;
  block.innerHTML = '<p class="loading">Loading product details...</p>';

  try {
    const response = await fetch('/products.json');
    if (!response.ok) throw new Error('Catalog database offline');
    const json = await response.json();

    // Match spreadsheet data row with current browser URL path
    const product = json.data.find((item) => item.urlPath === currentPath);
    if (!product) {
      block.innerHTML = '<p class="error">Product configuration not found in spreadsheet matching this URL.</p>';
      return;
    }

    block.innerHTML = '';

    // Container Build
    const pdpWrapper = document.createElement('div');
    pdpWrapper.className = 'pdp-container';

    // 1. Image Section (Main + Gallery)
    const mediaSide = document.createElement('div');
    mediaSide.className = 'pdp-media-side';

    const mainImg = createOptimizedPicture(product.image, product.title, true, [{ width: '600' }]);
    mediaSide.innerHTML = `<div class="pdp-main-image">${mainImg.outerHTML}</div>`;

    if (product.gallery) {
      const galleryWrapper = document.createElement('div');
      galleryWrapper.className = 'pdp-gallery-thumbs';
      // Split comma separated list from excel cells
      product.gallery.split(',').forEach((imgUrl) => {
        const thumb = createOptimizedPicture(imgUrl.trim(), product.title, false, [{ width: '100' }]);
        galleryWrapper.appendChild(thumb);
      });
      mediaSide.appendChild(galleryWrapper);
    }

    // 2. Info & Meta Section
    const infoSide = document.createElement('div');
    infoSide.className = 'pdp-info-side';
    infoSide.innerHTML = `
      <h1 class="pdp-title">${product.title}</h1>
      <p class="pdp-sku">SKU: <span>${product.sku}</span></p>
      <p class="pdp-price">$${parseFloat(product.price).toFixed(2)}</p>
      <div class="pdp-short-desc"><p>${product.shortDescription || ''}</p></div>
      <button class="pdp-add-btn">Add to Bag</button>
      <div class="pdp-long-desc">
        <h3>Description</h3>
        <p>${product.longDescription || ''}</p>
      </div>
    `;

    // 3. Render Features List
    if (product.features) {
      const featuresDiv = document.createElement('div');
      featuresDiv.className = 'pdp-features';
      featuresDiv.innerHTML = '<h3>Key Features</h3><ul></ul>';
      const ul = featuresDiv.querySelector('ul');
      product.features.split(',').forEach((feat) => {
        const li = document.createElement('li');
        li.textContent = feat.trim();
        ul.appendChild(li);
      });
      infoSide.appendChild(featuresDiv);
    }

    // 4. Render Attributes/Specs Table
    if (product.specs) {
      const specsDiv = document.createElement('div');
      specsDiv.className = 'pdp-specs';
      specsDiv.innerHTML = '<h3>Specifications</h3><table class="specs-table"></table>';
      const table = specsDiv.querySelector('table');

      // Assumes format "Size: Med | Color: Red" or comma separated "Size: Med, Color: Red"
      const separator = product.specs.includes('|') ? '|' : ',';
      product.specs.split(separator).forEach((pair) => {
        const [key, val] = pair.split(':');
        if (key && val) {
          const row = document.createElement('tr');
          row.innerHTML = `<td><strong>${key.trim()}</strong></td><td>${val.trim()}</td>`;
          table.appendChild(row);
        }
      });
      infoSide.appendChild(specsDiv);
    }

    pdpWrapper.appendChild(mediaSide);
    pdpWrapper.appendChild(infoSide);
    block.appendChild(pdpWrapper);
  } catch (err) {
    block.innerHTML = `<p class="error">Failed loading specifications: ${err.message}</p>`;
  }
}
