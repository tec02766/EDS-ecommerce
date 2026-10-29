export default async function decorate(block) {
  const authoredText = block.textContent.trim();
  block.innerHTML = '<p class="loading">Loading categories...</p>';

  try {
    const response = await fetch('/products.json');
    if (!response.ok) throw new Error('Catalog data unavailable');

    const json = await response.json();
    const categoryLinks = new Map();

    (json.data || []).forEach((item) => {
      const category = String(item.category || '').trim();
      if (!category) return;

      const categoryLink = String(
        item.category_link || '',
      ).trim();

      if (!categoryLinks.has(category) || !categoryLinks.get(category)) {
        categoryLinks.set(category, categoryLink);
      }
    });

    const categories = [...categoryLinks.keys()].sort((a, b) => a.localeCompare(b));

    block.innerHTML = '';

    if (authoredText) {
      const title = document.createElement('h5');
      title.className = 'category-chips-title';
      title.textContent = authoredText;
      block.appendChild(title);
    }

    if (!categories.length) {
      block.innerHTML = '<p class="no-categories">No categories found.</p>';
      return;
    }

    const currentPath = window.location.pathname.replace(/\/$/, '').toLowerCase();
    const chipsWrapper = document.createElement('div');
    chipsWrapper.className = 'category-chips';

    const slugify = (value) => String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    categories.forEach((category) => {
      const categorySlug = slugify(category);
      const categoryLink = categoryLinks.get(category) || '';
      const link = document.createElement('a');
      link.href = categoryLink || `/category/${categorySlug}`;
      link.className = 'category-chip';
      link.textContent = category;

      const normalizedLinkPath = new URL(link.href, window.location.origin).pathname
        .replace(/\/$/, '')
        .toLowerCase();

      if (normalizedLinkPath === currentPath) {
        link.classList.add('is-active');
      }

      chipsWrapper.appendChild(link);
    });

    block.appendChild(chipsWrapper);
  } catch (err) {
    block.innerHTML = `<p class="error">Failed loading categories: ${err.message}</p>`;
  }
}
