import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Closes the open nav dropdown (desktop) or the nav menu (mobile) on Escape
 * @param {KeyboardEvent} e keydown event
 */
function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

/**
 * Closes the open nav dropdown (desktop) or the nav menu (mobile) when focus leaves the nav
 * @param {FocusEvent} e focusout event
 */
function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean|string} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-drop > button').forEach((button) => {
    button.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  // the desktop nav is always expanded, so aria-expanded only applies to the mobile menu
  if (isDesktop.matches) nav.removeAttribute('aria-expanded');
  else nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export function initCartManager(cartIconSelector, headerContainerSelector) {
  const vendorSelector = typeof cartIconSelector === 'string' ? cartIconSelector : '.icon-cart';
  const cartIcon = typeof cartIconSelector === 'string'
    ? document.querySelector(cartIconSelector)
    : cartIconSelector;
  const resolvedContainer = typeof headerContainerSelector === 'string'
    ? document.querySelector(headerContainerSelector)
    : headerContainerSelector;

  function updateMiniCart() {
    const cart = JSON.parse(localStorage.getItem('aem-cart')) || [];

    const activeCartIcon = cartIcon || document.querySelector(vendorSelector);
    if (activeCartIcon) {
      let badge = activeCartIcon.querySelector('.header-cart-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'header-cart-badge';
        activeCartIcon.appendChild(badge);
      }
      const totalQty = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      badge.textContent = totalQty;
      badge.style.display = totalQty > 0 ? 'inline-flex' : 'none';
    }

    if (!resolvedContainer) return;

    let flyoutContainer = resolvedContainer.querySelector('.header-cart-flyout');
    if (!flyoutContainer) {
      flyoutContainer = document.createElement('div');
      flyoutContainer.className = 'header-cart-flyout';
      flyoutContainer.style.display = 'none';
      resolvedContainer.appendChild(flyoutContainer);
    }

    if (cart.length === 0) {
      flyoutContainer.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
      return;
    }

    let cartHTML = '<div class="mini-cart-list">';
    cart.forEach((item) => {
      const unitPrice = Number(item.price || 0);
      const itemTotal = (unitPrice * Number(item.quantity || 0)).toFixed(2);
      cartHTML += `
        <div class="mini-cart-item">
          <img src="${item.image || ''}" alt="${item.title || 'Product'}" class="mini-cart-img" width="50" height="50">
          <div class="mini-cart-details">
            <p class="mini-cart-title">${item.title || 'Product'}</p>
            <p class="mini-cart-meta">Qty: ${item.quantity || 0} | $${itemTotal}</p>
          </div>
        </div>
      `;
    });

    cartHTML += `
      </div>
      <div class="mini-cart-actions">
        <a href="/cart" class="mini-cart-view-btn">View Cart</a>
        <a href="/checkout" class="mini-cart-checkout-btn">Proceed to Checkout</a>
      </div>
    `;

    flyoutContainer.innerHTML = cartHTML;
  }

  document.addEventListener('click', (e) => {
    const activeCartIcon = cartIcon || document.querySelector(vendorSelector);
    const flyout = resolvedContainer?.querySelector('.header-cart-flyout');
    if (!flyout || !resolvedContainer) return;

    if (activeCartIcon && activeCartIcon.contains(e.target)) {
      e.preventDefault();
      flyout.style.display = flyout.style.display === 'none' ? 'block' : 'none';
      return;
    }

    if (!flyout.contains(e.target)) {
      flyout.style.display = 'none';
    }
  });

  window.addEventListener('cart-updated', updateMiniCart);
  updateMiniCart();
}

export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      const subList = navSection.querySelector(':scope > ul');
      if (!subList) return;
      navSection.classList.add('nav-drop');
      // wrap the dropdown label in a button so it is announced as expandable
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-expanded', false);
      [...navSection.childNodes].forEach((node) => {
        if (node !== subList) button.append(node);
      });
      navSection.prepend(button);
      button.addEventListener('click', () => {
        const expanded = button.getAttribute('aria-expanded') === 'true';
        if (isDesktop.matches) {
          button.focus();
          toggleAllNavSections(navSections);
        }
        button.setAttribute('aria-expanded', !expanded);
      });
    });
  }

  const navTools = nav.querySelector('.nav-tools');
  if (navTools && !navTools.querySelector('.icon-cart')) {
    const authoredCart = document.querySelector('.icon-cart');
    if (authoredCart && navTools.contains(authoredCart)) {
      authoredCart.setAttribute('aria-label', 'Shopping cart');
      authoredCart.setAttribute('role', 'button');
    }
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  initCartManager('.icon-cart', block);
}
