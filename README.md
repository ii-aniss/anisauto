# AniissAuto

A complete premium automotive showroom platform with a public storefront, customer accounts, reservations, test-drive booking, vehicle reviews, and a responsive administration dashboard.

AniissAuto ships with a catalogue of **448 vehicles across 40 marques** and no fabricated showroom activity. Statistics, ratings, testimonials, reservations, and inbox counts are driven entirely by real data created through the application.

## Highlights

### Storefront

- Editorial home page with featured vehicles, live showroom statistics, brand marquee, and real customer reviews.
- Searchable, filterable inventory with category, fuel, condition, transmission, price, year, and stock filters.
- Vehicle detail pages with colour and lighting gallery views, full specifications, financing calculator, related vehicles, and owner reviews.
- Reservation and test-drive flows with confirmation feedback.
- Saved-vehicle garage, reservation history, test-drive history, and customer profile pages.
- Registration, sign-in, session persistence, and secure sign-out.
- Brand directory, showroom story, contact form, newsletter signup, and live showroom settings.
- Honest empty states: ratings show a dash and reviews show "No owner reviews yet" until customers submit one.
- Responsive layouts for desktop, tablet, and mobile, including an accessible slide-down navigation menu.

### Admin command centre

- Protected admin login and role-based API authorization.
- Executive overview with inventory value, confirmed pipeline, reservations, customers, and recent activity.
- Full vehicle management: create, edit, delete, search, filter, sort, and paginate.
- Marque management with vehicle-reference protection.
- Reservation and test-drive workflows with status updates and detail modals.
- Customer directory with administrator access controls.
- Message inbox with read/resolved states.
- Newsletter subscriber directory.
- Showroom settings for contact details, hours, announcement, and branding copy.
- Responsive off-canvas navigation with scrim, Escape support, and session-expiry handling.

## Technology

- **Runtime:** Node.js 22.13 or newer
- **Server:** built-in `node:http`
- **Production database:** Neon Postgres through `@neondatabase/serverless`
- **Local database:** PGlite (`@electric-sql/pglite`) persisted in `data/pglite`, used automatically when `DATABASE_URL` is absent
- **Frontend:** semantic HTML, CSS, and vanilla ES modules
- **Assets:** locally generated SVG artwork and icons
- **Security headers:** strict Content Security Policy, no framing, no MIME sniffing, and a restrictive permissions policy

## Quick Start

Requirements: Node.js 22.13+ and npm.

```powershell
npm install
npm start
```

Open:

- Storefront: http://127.0.0.1:3000
- Admin: http://127.0.0.1:3000/admin

With no `DATABASE_URL`, the server creates a local PGlite database under `data/pglite` and seeds the catalogue automatically on first start. Customer accounts and activity start empty.

To use Neon locally, create a `.env` file from `.env.example`, set `DATABASE_URL`, then run:

```powershell
npm install
npm run seed-db
npm start
```

### Admin credentials

The fallback administrator is created on first database initialization:

| Field | Default |
| --- | --- |
| Username | `aniissadmin` |
| Email | `admin@aniissauto.com` |
| Password | `anis123#123@` |

Set `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` in the environment **before the database is first initialized** to override these values. The password fallback is public; always override it for any deployment that is reachable by others.

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start the production-style HTTP server |
| `npm run dev` | Start with Node watch mode |
| `npm run seed-db` | Initialize the configured database and seed the catalogue if empty |
| `npm run reset-db` | Delete the local PGlite database so the next start reseeds it |
| `npm run build` | Build the static site into `dist/` for Vercel |
| `npm run vercel-build` | Alias used by Vercel |
| `npm run check` | Syntax-check server and frontend JavaScript |

Stop the server before resetting the local database. `npm run reset-db` only targets `data/pglite` and intentionally refuses to reset a remote Neon database. Reseeding removes every user-created account, reservation, test drive, message, subscriber, and review.

### Configuration

The server reads these environment variables:

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | unset | Neon Postgres connection string. When unset, local PGlite is used |
| `PORT` | `3000` | Local HTTP port |
| `HOST` | `127.0.0.1` | Local bind address |
| `ADMIN_USERNAME` | `aniissadmin` | Initial administrator username |
| `ADMIN_EMAIL` | `admin@aniissauto.com` | Initial administrator email |
| `ADMIN_NAME` | `Aniiss Admin` | Initial administrator display name |
| `ADMIN_PASSWORD` | fallback value | Initial administrator password |
| `COOKIE_SECURE` | unset | Set to `1` to mark the session cookie `Secure` when not on Vercel |

On Vercel, `DATABASE_URL` is required because the serverless filesystem is ephemeral. The session cookie is automatically marked `Secure` on Vercel.

Example local Neon configuration:

```powershell
$env:DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
$env:ADMIN_PASSWORD="choose-a-strong-password"
npm run seed-db
npm start
```

To expose the local server on a network, set `HOST=0.0.0.0`.

## Deploying to Vercel

1. Create a Neon project and copy its pooled or direct Postgres connection string.
2. Optionally seed it locally with `DATABASE_URL` set and `npm run seed-db`. Otherwise the first API request seeds the catalogue automatically under a Postgres advisory lock.
3. Push this repository to GitHub and import it into Vercel.
4. Add `DATABASE_URL` and your `ADMIN_*` overrides as Vercel environment variables.
5. Deploy. `vercel.json` sets the build command, output directory, API function limits, security headers, and SPA rewrites.

`api/[...path].js` exposes the existing API through `handleApiRequest`; no Express or separate serverless framework is involved.

## Routes

### Storefront

- `#/` - home
- `#/inventory` - vehicle collection
- `#/vehicle/:id` - vehicle detail
- `#/brands` - marque directory
- `#/about` - showroom story
- `#/contact` - contact form and showroom information
- `#/login` - customer sign in
- `#/register` - account creation
- `#/account?tab=orders` - reservations
- `#/account?tab=drives` - test drives
- `#/account?tab=garage` - saved vehicles
- `#/account?tab=profile` - profile

Inventory filters are reflected in the hash URL, so filtered views can be shared.

### Admin

- `/admin` - login
- `#/overview` - executive overview
- `#/inventory` - vehicle management
- `#/brands` - marque management
- `#/orders` - reservations
- `#/drives` - test drives
- `#/customers` - customers and roles
- `#/messages` - message inbox
- `#/subscribers` - newsletter subscribers
- `#/settings` - showroom settings

## API Overview

All responses are JSON. Authenticated routes use the `aniiss_session` HttpOnly cookie.

### Public

```text
GET  /api/health
GET  /api/settings
GET  /api/brands
GET  /api/meta
GET  /api/stats
GET  /api/vehicles/options
GET  /api/vehicles
GET  /api/vehicles/:id
GET  /api/vehicles/:id/related
GET  /api/reviews/latest
POST /api/vehicles/:id/reviews
POST /api/newsletter
POST /api/contact
POST /api/test-drives
```

### Customer accounts

```text
POST   /api/register
POST   /api/login
POST   /api/logout
GET    /api/me
GET    /api/favorites
POST   /api/favorites
DELETE /api/favorites/:vehicleId
GET    /api/account/orders
GET    /api/account/test-drives
POST   /api/orders
```

### Administration

```text
POST   /api/admin/login
GET    /api/admin/overview

GET    /api/admin/vehicles
POST   /api/admin/vehicles
PUT    /api/admin/vehicles/:id
DELETE /api/admin/vehicles/:id

GET    /api/admin/brands
POST   /api/admin/brands
PUT    /api/admin/brands/:id
DELETE /api/admin/brands/:id

GET    /api/admin/orders
PATCH  /api/admin/orders/:id

GET    /api/admin/test-drives
PATCH  /api/admin/test-drives/:id

GET    /api/admin/users
PATCH  /api/admin/users/:id

GET    /api/admin/messages
PATCH  /api/admin/messages/:id

GET    /api/admin/newsletter
GET    /api/admin/settings
PUT    /api/admin/settings
```

## Project Structure

```text
aniissauto/
|-- package.json
|-- vercel.json
|-- api/
|   `-- [...path].js           # Vercel catch-all API function
|-- scripts/
|   |-- build.js               # Copies public/ into dist/
|   |-- load-env.js            # Minimal .env loader for scripts
|   |-- reset-db.js            # Removes the local PGlite database
|   `-- seed-db.js             # Initializes and seeds the configured database
|-- data/
|   `-- pglite/                # Local PGlite database (created on first start)
|-- server/
|   |-- index.js               # HTTP server, routing, validation, and APIs
|   |-- db.js                  # Neon/PGlite adapter, schema, seeding, bootstrap
|   |-- security.js            # Scrypt hashing and secure token generation
|   `-- seed-data.js           # 40-marque catalogue
`-- public/
    |-- index.html             # Storefront shell
    |-- admin.html             # Admin shell
    |-- favicon.svg
    |-- css/
    |   |-- base.css           # Design tokens and shared UI
    |   |-- home.css
    |   |-- inventory.css
    |   |-- detail.css
    |   |-- content.css
    |   |-- account.css
    |   |-- extras.css
    |   |-- admin.css
    |   `-- styles.css         # Storefront stylesheet entrypoint
    `-- js/
        |-- app.js             # Storefront boot, router, and global events
        |-- admin.js           # Admin dashboard application
        |-- utils.js           # API client, formatting, icons, modals, and art
        |-- pages.js           # Storefront page exports
        `-- pages/
            |-- home.js
            |-- inventory.js
            |-- vehicle.js
            |-- content.js
            |-- auth.js
            |-- account.js
            `-- shared.js
```

## Seeded Data

- 40 marques
- 448 vehicle listings
- 0 customers
- 0 reservations
- 0 test drives
- 0 inbox messages
- 0 newsletter subscribers
- 0 reviews and ratings

The catalogue is the only seeded content. Homepage statistics, average rating, vehicle ratings, reviews, and all admin activity lists read from real records. Creating the first review updates that vehicle's rating and review count within the same transaction.

## Verification

The finished build was checked with:

- 42 API integration checks covering authentication, accounts, favourites, reservations, test drives, reviews, contact, newsletter, admin CRUD, authorization, and static delivery.
- 46 desktop browser checks covering storefront navigation, account flows, every admin section, modals, filters, settings persistence, empty-state honesty, and console/network errors.
- 18 mobile checks at 390 x 844 covering responsive layout, navigation, admin off-canvas behaviour, and horizontal overflow.
- Syntax checks for every server and frontend JavaScript module.

## Customisation

- **Brand and credentials:** `server/db.js` (`ADMIN`, `DEFAULT_SETTINGS`)
- **Catalogue:** `server/seed-data.js` and the vehicle generator in `server/db.js`
- **Theme:** CSS custom properties in `public/css/base.css`
- **Storefront experience:** `public/js/pages/`
- **Admin experience:** `public/js/admin.js` and `public/css/admin.css`
- **Server behaviour and API routes:** `server/index.js`

## Security Notes

- Passwords are hashed with `scrypt` and a unique salt.
- Session tokens are 256-bit random values stored server-side in Postgres.
- Sessions expire after seven days; cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production on Vercel.
- Failed sign-in attempts are rate-limited per server instance and remote address.
- SQL values are parameterized; request bodies, field lengths, and numeric ranges are validated.
- Admin APIs return `401` for unauthenticated requests and `403` for non-admin accounts.
- The Content Security Policy disallows inline scripts and third-party sources.
- The included server is intended for controlled deployment. Before exposing it publicly, override the default admin password, review TLS/reverse-proxy settings, add CSRF protection if embedding the API in another origin, configure database backups, and review rate limiting for multi-instance deployments.
