import {
  getAccountData,
  formatCurrency,
  formatDate,
} from '../../scripts/account.js';

export default function decorate(block) {
  const { orders } = getAccountData();

  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'account-orders';

  const header = document.createElement('div');
  header.className = 'account-orders-header';
  header.innerHTML = `
    <div>
      <p class="account-orders-kicker">Order history</p>
      <h4>My orders</h4>
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
        <div class="account-order-details">
            <p class="account-order-id">${order.orderId}</p>
            <span class="account-order-status">${order.status}</span>
        </div>
        <div class="account-order-meta">
            <p class="account-order-date">${formatDate(order.date)}</p>
            <span>${order.itemsCount} items</span>
            <strong>${formatCurrency(order.total)}</strong>
        </div>
      </div>
     
    `;

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
