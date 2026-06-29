# Despensa Rayana Client

Despensa Rayana Client is the React frontend for an ecommerce experience focused on local products from Extremadura and the Raya region between Spain and Portugal. The application presents a premium rural marketplace with a curated catalogue, product detail pages, cart and checkout flows, customer accounts, reviews, and an admin backoffice.

The visual direction combines contemporary ecommerce patterns with the identity of the project: rural landscapes, forest green and cream tones, local craft, Iberian products, cheeses, honey, wine, cork, and other products connected to Extremadura.

## Features

- Premium ecommerce homepage with editorial hero, category navigation, trust messages, and featured products carousel.
- Product catalogue with category navigation, filters, sorting, search, stock state, offers, and favourite products.
- Product detail page with image gallery, main product image, purchase controls, product information tabs, and customer reviews.
- Cart and checkout flow with item review, shipping details, payment step, and client-side form validation.
- Customer account area with access to personal reviews and review editing/deletion.
- Admin backoffice for managing clients, products, categories, orders, images, offers, and reviews.
- Offer support for percentage discounts, fixed amount discounts, bundle promotions, and date-based validity.
- Product image handling designed to use real product images, keeping category images generic and product images specific.
- Responsive layout with desktop navigation, mobile menu, and cart drawer.

## Tech Stack

- React 19
- Vite 7
- Lucide React icons
- CSS custom properties and responsive CSS
- REST API integration through `VITE_API_URL`

## Project Structure

```text
src/
  controllers/       Application state and business flow orchestration
  models/            API clients and domain helpers
  views/             React UI views and components
  styles.css         Global design system and layout styles
public/              Static visual assets
scripts/             Catalogue seeding helpers and product data
```

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Set the API URL:

```env
VITE_API_URL=http://localhost:3000/api
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Environment Variables

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Base URL for the Despensa Rayana backend API. |

Environment files such as `.env` and `.env.local` are intentionally ignored. Use `.env.example` as the public template.

## Admin Access

The frontend expects authentication and role management to be provided by the backend. Admin users are redirected to the backoffice area after login, while regular customers are redirected to the catalogue.

## Notes on Images

Product cards and product detail pages are designed to display images associated with the specific product. Category imagery can be generic and representative, but product imagery should use real product photos and avoid unrelated illustrations or placeholder catalogue content.

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run seed:extremadura
```

## Repository Hygiene

The repository excludes generated and local-only files:

- `node_modules/`
- `dist/`
- `.env`
- `.env.*`

Only `.env.example` is committed as a safe configuration template.
