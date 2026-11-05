# EDS Ecommerce

A storefront built on Adobe Edge Delivery Services (EDS) using the AEM authoring model, lightweight vanilla JavaScript, and content-driven blocks. The project is designed to be content-first: pages and navigation are authored or generated from backend content, while storefront logic is implemented in a set of reusable blocks under `blocks/`.

## Project overview

This repo is an eCommerce site for a plant and home-goods store. The application includes:

- a landing page / home experience
- category listing pages
- product detail pages
- a cart flow
- checkout flow
- account and order history screens
- navigation and header/footer logic

The site uses a catalog-driven approach: product data is loaded from `/products.json`, and product/category URLs are derived from catalog fields such as `urlPath`, `category`, and `category_link`.

## Live and preview environments

- Preview: https://main--EDS-ecommerce--tec02766.aem.page/
- Live: https://main--EDS-ecommerce--tec02766.aem.live/

## Tech stack

- Adobe Edge Delivery Services / AEM authoring model
- Vanilla JavaScript for block logic
- CSS for block-scoped styling
- No build pipeline required for runtime behavior
- Linting via ESLint and Stylelint

## Key project structure

```text
.
├── blocks/                  # Page blocks and storefront features
│   ├── header/              # Header/nav and cart flyout logic
│   ├── footer/              # Footer layout
│   ├── hero/                # Hero content block
│   ├── cards/               # Card/grid layouts
│   ├── product-list-page/   # Category listing and product grid
│   ├── product-detail-page/ # Product detail page logic
│   ├── cart-page/           # Cart page logic
│   ├── checkout/            # Checkout summary flow
│   ├── account-overview/    # Account screen
│   ├── account-orders/      # Order history screen
│   ├── category-chips/      # Category navigation chips
│   └── fragment/            # Fragment loading utility
├── scripts/
│   ├── aem.js               # Vendored EDS helper library; do not edit
│   ├── scripts.js          # Page bootstrap / auto-blocking logic
│   ├── account.js          # Account/cart data helpers
│   └── consent-check.js    # Consent related behavior
├── styles/                  # Global styling and lazy styles
├── icons/                  # Icons and asset files
├── fonts/                  # Font files
├── head.html               # HTML head injection
├── 404.html                # Error page
├── package.json            # Scripts and devDependencies
├── README.md               # Project overview and developer 
```

### Product catalog

Product catalog data is loaded from `/products.json`. The product-detail and product-list blocks rely on fields such as:

- `title`
- `category`
- `category_link`
- `urlPath`
- `image`
- `price`
- `sku`
- `quantity`
- `description`

This makes it easy to extend by adding products to the catalog source.

### Navigation and structure

- Header/nav is built from the header block.
- Footer is loaded from a footer block.
- Product/category links depend on catalog values instead of hardcoded fixed pages.
- Cart state is stored in `localStorage` under the `aem-cart` key.

### Start the local AEM preview

This project uses the Adobe AEM CLI flow:

```sh
npx -y @adobe/aem-cli up
```

This starts the local preview and serves the site on localhost, usually at:

- http://localhost:3000

### Run linting

```sh
npm run lint
```

The repo uses:

- `eslint .`
- `stylelint "blocks/**/*.css" "styles/*.css"`

## Common tasks

### Add or modify a block

- Create or update a folder inside `blocks/`
- Add a matching `.js` file and usually a `.css` file
- Ensure block styling is scoped correctly
- Prefer defensive logic because authors can change table structure or omit cells

### Add a new product or category

- Update the catalog source used to generate `/products.json`
- Ensure the product has a valid `urlPath`
- Keep category values consistent so category chips and listings resolve correctly

### Work with nav/header

- The header uses a fragment-based nav structure
- Cart flyout behavior is managed in the header JS
- Use existing patterns rather than adding cross-block imports unnecessarily

## Typical workflow for a developer

1. Install dependencies.
2. Start the local AEM preview with `npx -y @adobe/aem-cli up`.
3. Inspect the page and raw HTML if a block is behaving unexpectedly.
4. Update the relevant block under `blocks/`.
5. Keep CSS scoped and author-safe.
6. Run linting before finishing work.
7. Push changes and validate in preview before merging.

## Final note

This repo is a content-first storefront built for Adobe Edge Delivery Services. The main principle is simple: make pages authorable, keep behavior lightweight, and let the catalog and fragment-driven content model do most of the heavy lifting.
