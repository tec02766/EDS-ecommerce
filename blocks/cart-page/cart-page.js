import { createOptimizedPicture } from '../../scripts/aem.js';

const CART_KEY = 'aem-cart';
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const saveCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cart-updated'));
};

const formatPrice = (value) => currencyFormatter.format(Number(value || 0));

function renderCartPage(block) {
  const cart = getCart();
  block.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'cart-page';

  if (!cart.length) {
    wrapper.innerHTML = `
      <div class="cart-page-empty">
        <h4>Your cart is empty</h1>
        <p>Add a few products and come back here to complete your order.</p>
        <a href="/shop" class="cart-page-cta">Continue shopping</a>
      </div>
    `;
    block.appendChild(wrapper);
    return;
  }

  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'cart-page-items';

  let subtotal = 0;

  cart.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'cart-page-item';

    const unitPrice = Number(item.price || 0);
    const quantity = Number(item.quantity || 0);
    const itemTotal = unitPrice * quantity;
    subtotal += itemTotal;

    const productImage = item.image ? createOptimizedPicture(item.image, item.title || 'Product', false, [{ width: '200' }]) : document.createElement('div');
    productImage.classList.add('cart-page-image');

    const details = document.createElement('div');
    details.className = 'cart-page-details';
    details.innerHTML = `
      <h3>${item.title || 'Product'}</h3>
      <p class="cart-page-price">${formatPrice(unitPrice)}</p>
    `;

    const qtyWrap = document.createElement('div');
    qtyWrap.className = 'cart-page-qty';
    qtyWrap.innerHTML = `
      <button type="button" class="cart-page-qty-btn" data-sku="${item.sku}" data-change="-1" aria-label="Decrease quantity">-</button>
      <span class="cart-page-qty-value">${quantity}</span>
      <button type="button" class="cart-page-qty-btn" data-sku="${item.sku}" data-change="1" aria-label="Increase quantity">+</button>
    `;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'cart-page-remove';
    removeButton.dataset.sku = item.sku;
    removeButton.textContent = 'Remove';

    const summary = document.createElement('div');
    summary.className = 'cart-page-item-summary';
    summary.innerHTML = `<strong>${formatPrice(itemTotal)}</strong>`;

    row.appendChild(productImage);
    row.appendChild(details);
    row.appendChild(qtyWrap);
    row.appendChild(summary);
    row.appendChild(removeButton);
    itemsContainer.appendChild(row);
  });

  const summaryCard = document.createElement('aside');
  summaryCard.className = 'cart-page-summary';
  summaryCard.innerHTML = `
    <h2>Order summary</h2>
    <div class="cart-page-summary-row">
      <span>Subtotal</span>
      <strong>${formatPrice(subtotal)}</strong>
    </div>
    <div class="cart-page-summary-row">
      <span>Shipping</span>
      <strong>Free</strong>
    </div>
    <div class="cart-page-summary-row total">
      <span>Total</span>
      <strong>${formatPrice(subtotal)}</strong>
    </div>
    <button type="button" class="cart-page-checkout">Proceed to checkout</button>
  `;

  wrapper.appendChild(itemsContainer);
  wrapper.appendChild(summaryCard);
  block.appendChild(wrapper);

  block.querySelectorAll('.cart-page-qty-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const { sku, change } = button.dataset;
      const cartItems = getCart();
      const itemIndex = cartItems.findIndex((cartItem) => cartItem.sku === sku);
      if (itemIndex === -1) return;

      const nextQty = Number(cartItems[itemIndex].quantity || 0) + Number(change || 0);
      if (nextQty <= 0) {
        cartItems.splice(itemIndex, 1);
      } else {
        cartItems[itemIndex].quantity = nextQty;
      }

      saveCart(cartItems);
      renderCartPage(block);
    });
  });

  block.querySelectorAll('.cart-page-remove').forEach((button) => {
    button.addEventListener('click', () => {
      const { sku } = button.dataset;
      const cartItems = getCart().filter((item) => item.sku !== sku);
      saveCart(cartItems);
      renderCartPage(block);
    });
  });
}

export default function decorate(block) {
  renderCartPage(block);
}
