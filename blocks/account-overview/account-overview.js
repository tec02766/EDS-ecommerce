import {
  getAccountData,
  formatCurrency,
  formatDate,
} from '../../scripts/account.js';

function renderOverview(block) {
  const { profile, orders } = getAccountData();
  const firstName = profile.name.split(' ')[0];
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const lastOrder = orders.at(-1) || null;

  block.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'account-page account-overview';

  const header = document.createElement('div');
  header.className = 'account-overview-header';
  header.innerHTML = `
    <div>
      <p class="account-overview-kicker">My Account</p>
      <h4>Welcome back, ${firstName}.</h4>
    </div>
  `;

  const grid = document.createElement('div');
  grid.className = 'account-overview-grid';

  const profileCard = document.createElement('article');
  profileCard.className = 'account-card';
  profileCard.innerHTML = `
    <h5>Profile</h5>
    <div class="account-profile-row">
      <span>Name</span>
      <strong>${profile.name}</strong>
    </div>
    <div class="account-profile-row">
      <span>Email</span>
      <strong>${profile.email}</strong>
    </div>
    <div class="account-profile-row">
      <span>Phone</span>
      <strong>${profile.phone}</strong>
    </div>
    <div class="account-profile-row">
      <span>Member since</span>
      <strong>${formatDate(profile.memberSince)}</strong>
    </div>
  `;

  const summaryCard = document.createElement('article');
  summaryCard.className = 'account-card';
  summaryCard.innerHTML = `
    <h5>Overview</h5>
    <div class="account-summary-grid">
      <div>
        <span>Total orders</span>
        <strong>${orders.length}</strong>
      </div>
      <div>
        <span>Total spent</span>
        <strong>${formatCurrency(totalSpent)}</strong>
      </div>
      <div>
        <span>Last order</span>
        <strong>${lastOrder ? lastOrder.orderId : 'No orders yet'}</strong>
      </div>
      <div>
        <span>Status</span>
        <strong>${lastOrder ? lastOrder.status : 'No order'}</strong>
      </div>
    </div>
  `;

  const actions = document.createElement('div');
  actions.className = 'account-overview-actions';
  actions.innerHTML = `
    <a href="/account-orders" class="button secondary">View order history</a>
    <a href="/shop" class="button secondary">Continue shopping</a>
  `;

  grid.append(profileCard, summaryCard);
  wrapper.append(header, grid, actions);
  block.append(wrapper);
}

function renderOrders(block) {
  const { orders } = getAccountData();
  block.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'account-page account-orders';

  const header = document.createElement('div');
  header.className = 'account-orders-header';
  header.innerHTML = `
    <div>
      <p class="account-orders-kicker">Order history</p>
      <h1>My orders</h1>
    </div>
    <a href="/account" class="button secondary">Back to account</a>
  `;

  const list = document.createElement('div');
  list.className = 'account-orders-list';

  orders.forEach((order) => {
    const card = document.createElement('article');
    card.className = 'account-order-card';

    const summary = document.createElement('div');
    summary.className = 'account-order-summary';
    summary.innerHTML = `
      <div class="account-order-main">
        <p class="account-order-id">${order.orderId}</p>
        <p class="account-order-date">${formatDate(order.date)}</p>
      </div>
      <div class="account-order-meta">
        <span>${order.itemsCount} items</span>
        <strong>${formatCurrency(order.total)}</strong>
      </div>
    `;

    const status = document.createElement('span');
    status.className = 'account-order-status';
    status.textContent = order.status;
    summary.append(status);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'account-order-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'View items';

    const details = document.createElement('div');
    details.className = 'account-order-items';
    details.hidden = true;

    order.items.forEach((item) => {
      const line = document.createElement('div');
      line.className = 'account-order-item';
      line.innerHTML = `
        <span>${item.name}</span>
        <span>Qty: ${item.quantity}</span>
        <strong>${formatCurrency(item.price * item.quantity)}</strong>
      `;
      details.append(line);
    });

    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isExpanded));
      details.hidden = isExpanded;
      toggle.textContent = isExpanded ? 'View items' : 'Hide items';
    });

    card.append(summary, toggle, details);
    list.append(card);
  });

  wrapper.append(header, list);
  block.append(wrapper);
}

export default function decorate(block) {
  const variant = block.dataset.variant || (window.location.pathname.includes('/account-orders') ? 'orders' : 'overview');

  if (variant === 'orders') {
    renderOrders(block);
    return;
  }

  renderOverview(block);
}
