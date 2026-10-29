import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  // 1. Read configuration parameters from the document table (like urlPath)
  const config = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    const key = row.children[0]?.textContent.trim();
    const val = row.children[1]?.textContent.trim();
    if (key) config[key] = val;
  });

  const categoryFilter = config.urlPath || '';

  // 2. Clear out the authoring table skeleton to render custom product listings
  block.innerHTML = '';

  try {
    // Fetch the mock data compiled automatically from products.xlsx
    const response = await fetch('/products.json');
    if (!response.ok) throw new Error('Failed to load mock catalog');
    const json = await response.json();

    // 3. Filter items by the category property defined in the doc
    const products = json.data.filter((item) => categoryFilter === '' || item.category.toLowerCase() === categoryFilter.toLowerCase());

    if (products.length === 0) {
      block.innerHTML = '<p class="no-products">No items found in this collection.</p>';
      return;
    }

    // 4. Render product lists programmatically
    const gridContainer = document.createElement('div');
    gridContainer.className = 'product-grid';

    products.forEach((product) => {
      const card = document.createElement('div');
      card.className = 'product-card';

      // Create responsive picture elements using EDS utilities
      const picture = createOptimizedPicture(product.image, product.title, false, [{ width: '400' }]);

      card.innerHTML = `
        <a href="${product.urlPath}" class="card-link">
          <div class="card-image">${picture.outerHTML}</div>
          <div class="card-info">
            <h4 class="product-title">${product.title}</h4>
            <p class="product-price">$${parseFloat(product.price).toFixed(2)}</p>
          </div>
        </a>
      `;
      gridContainer.appendChild(card);
    });

    block.appendChild(gridContainer);
  } catch (err) {
    block.innerHTML = `<p class="error">Catalog could not load: ${err.message}</p>`;
  }
}
