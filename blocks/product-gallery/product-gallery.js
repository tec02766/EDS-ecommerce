import { createOptimizedPicture } from '../../scripts/aem.js';

const normalizeImageList = (images) => {
  if (!images) return [];

  const list = Array.isArray(images) ? images : String(images).split(/[|,;]/);

  return list
    .map((image) => (typeof image === 'string' ? image.trim() : image))
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
};

const preloadImage = (src, alt = 'Product image') => {
  const placeholderPicture = createOptimizedPicture(src, alt, true, [{ width: '900' }]);
  const previewImg = placeholderPicture.querySelector('img');

  if (!previewImg || !previewImg.src) return Promise.resolve();

  const img = new Image();
  img.decoding = 'async';
  img.src = previewImg.src;

  if (typeof img.decode === 'function') {
    return img.decode().catch(() => undefined);
  }

  return new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve;
  });
};

export function createProductGallery(images, title = 'Product image') {
  const galleryImages = normalizeImageList(images);
  const gallery = document.createElement('div');
  gallery.className = 'product-gallery';

  if (!galleryImages.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'product-gallery-empty';
    emptyState.textContent = 'No product images available';
    gallery.appendChild(emptyState);
    return gallery;
  }

  const thumbs = document.createElement('div');
  thumbs.className = 'product-gallery-thumbs';

  const viewer = document.createElement('div');
  viewer.className = 'product-gallery-viewer';

  const mainImage = document.createElement('div');
  mainImage.className = 'product-gallery-main-image';

  galleryImages.forEach((imageUrl) => {
    preloadImage(imageUrl, title);
  });

  const setActiveImage = (index) => {
    const selectedImage = galleryImages[index];
    if (!selectedImage) return;

    mainImage.innerHTML = '';
    const mainPicture = createOptimizedPicture(selectedImage, title, true, [{ width: '900' }]);
    mainPicture.classList.add('product-gallery-picture');
    mainImage.appendChild(mainPicture);

    [...thumbs.children].forEach((thumb, thumbIndex) => {
      const isActive = thumbIndex === index;
      thumb.classList.toggle('is-active', isActive);
      thumb.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  };

  galleryImages.forEach((imageUrl, index) => {
    const thumbButton = document.createElement('button');
    thumbButton.type = 'button';
    thumbButton.className = 'product-gallery-thumb';
    thumbButton.setAttribute('aria-label', `View image ${index + 1}`);
    thumbButton.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');

    const thumbPicture = createOptimizedPicture(imageUrl, `${title} thumbnail ${index + 1}`, false, [{ width: '120' }]);
    thumbPicture.classList.add('product-gallery-thumb-picture');
    thumbButton.appendChild(thumbPicture);
    thumbButton.addEventListener('click', () => setActiveImage(index));
    thumbs.appendChild(thumbButton);
  });

  setActiveImage(0);
  gallery.appendChild(thumbs);
  gallery.appendChild(viewer);
  viewer.appendChild(mainImage);

  return gallery;
}

export default function decorate(block) {
  const parsedImages = [];
  block.querySelectorAll('img, picture').forEach((element) => {
    const img = element.tagName === 'IMG' ? element : element.querySelector('img');
    if (img) {
      parsedImages.push(img.src || img.getAttribute('data-src'));
    }
  });

  const title = block.getAttribute('data-title') || block.dataset.title || 'Product image';
  const galleryImages = parsedImages.length ? parsedImages : normalizeImageList(block.dataset.images || block.getAttribute('data-images'));

  block.replaceChildren(createProductGallery(galleryImages, title));
}
