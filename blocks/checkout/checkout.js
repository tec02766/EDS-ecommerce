import { createOptimizedPicture } from '../../scripts/aem.js';

const CART_KEY = 'aem-cart';
const ORDERS_KEY = 'aem-orders';
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (error) {
    return [];
  }
};

const getOrders = () => {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch (error) {
    return [];
  }
};

const saveOrders = (orders) => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

const formatPrice = (value) => currencyFormatter.format(Number(value || 0));

const getTotals = (items) => {
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)),
    0,
  );
  const shipping = 0;
  const total = subtotal + shipping;

  return { subtotal, shipping, total };
};

function renderConfirmationState(block) {
  const latestOrder = getOrders().at(-1);
  const orderId = latestOrder?.id || 'ORD-UNKNOWN';

  const wrapper = document.createElement('div');
  wrapper.className = 'checkout-summary checkout-summary-confirmed';
  wrapper.innerHTML = `
    <div class="checkout-summary-confirmation">
      <h3>Thank you for your order.</h3>
      <p>Your items are now being prepared for shipment. A confirmation email will be sent shortly.</p>
      <div class="checkout-summary-order-id">
        <span>Order ID</span>
        <strong>${orderId}</strong>
      </div>
      <a href="/shop" class="checkout-summary-cta">Continue shopping</a>
    </div>
  `;

  block.appendChild(wrapper);
}

function renderCheckoutSummary(block) {
  const cart = getCart();
  const params = new URLSearchParams(window.location.search);

  block.innerHTML = '';

  if (params.get('status') === 'confirmed') {
    renderConfirmationState(block);
    return;
  }

  if (!cart.length) {
    const wrapper = document.createElement('div');
    wrapper.className = 'checkout-summary';
    wrapper.innerHTML = `
      <div class="checkout-summary-empty">
        <h1>Your cart is empty</h1>
        <p>Add a few products before continuing to checkout.</p>
        <a href="/shop" class="checkout-summary-cta">Browse products</a>
      </div>
    `;
    block.appendChild(wrapper);
    return;
  }

  const { subtotal, shipping, total } = getTotals(cart);

  const wrapper = document.createElement('div');
  wrapper.className = 'checkout-summary';

  const reviewTitle = document.createElement('h4');
  reviewTitle.textContent = 'Review your cart';

  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'checkout-summary-column checkout-summary-items';

  cart.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'checkout-summary-item';

    const itemImage = item.image
      ? createOptimizedPicture(item.image, item.title || 'Product', false, [{ width: '200' }])
      : document.createElement('div');
    itemImage.classList.add('checkout-summary-image');

    const details = document.createElement('div');
    details.className = 'checkout-summary-details';
    details.innerHTML = `
      <h3>${item.title || 'Product'}</h3>
      <p>Qty: ${Number(item.quantity || 0)}</p>
      <span>${formatPrice(Number(item.price || 0))} each</span>
    `;

    const totalValue = document.createElement('div');
    totalValue.className = 'checkout-summary-item-total';
    totalValue.textContent = formatPrice(Number(item.price || 0) * Number(item.quantity || 0));

    row.append(itemImage, details, totalValue);
    itemsContainer.appendChild(row);
  });

  const summaryCard = document.createElement('aside');
  summaryCard.className = 'checkout-summary-column checkout-summary-summary';
  summaryCard.innerHTML = `
    <h4>Order summary</h4>
    <div class="checkout-summary-summary-row">
      <span>Subtotal</span>
      <strong>${formatPrice(subtotal)}</strong>
    </div>
    <div class="checkout-summary-summary-row">
      <span>Shipping</span>
      <strong>${shipping === 0 ? 'Free' : formatPrice(shipping)}</strong>
    </div>
    <div class="checkout-summary-summary-row total">
      <span>Total</span>
      <strong>${formatPrice(total)}</strong>
    </div>
    <button type="button" class="checkout-summary-place-order">Place order</button>
  `;

  wrapper.append(itemsContainer, summaryCard);
  block.appendChild(reviewTitle);
  block.appendChild(wrapper);

  const placeOrderButton = block.querySelector('.checkout-summary-place-order');
  if (placeOrderButton) {
    placeOrderButton.addEventListener('click', () => {
      const currentOrders = getOrders();
      const orderId = `ORD-${Date.now().toString().slice(-8)}`;
      currentOrders.push({
        id: orderId,
        createdAt: new Date().toISOString(),
        items: cart,
        total,
        status: 'confirmed',
      });

      saveOrders(currentOrders);
      localStorage.setItem(CART_KEY, JSON.stringify([]));
      window.dispatchEvent(new CustomEvent('cart-updated'));

      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('status', 'confirmed');
      window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}`);
      renderCheckoutSummary(block);
    });
  }
}

export default function decorate(block) {
  renderCheckoutSummary(block);
}
