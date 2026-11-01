'use strict';

require('./load-env');

const db = require('../server/db');

(async () => {
  const info = await db.initDb();
  const counts = await db.get(`
    SELECT
      (SELECT COUNT(*) FROM brands)::int AS brands,
      (SELECT COUNT(*) FROM vehicles)::int AS vehicles,
      (SELECT COUNT(*) FROM reviews)::int AS reviews,
      (SELECT COUNT(*) FROM users WHERE role = 'customer')::int AS customers,
      (SELECT COUNT(*) FROM orders)::int AS orders
  `);
  console.log(`Database: ${info.label}`);
  console.log(`Catalogue: ${counts.brands} brands, ${counts.vehicles} vehicles`);
  console.log(`Activity: ${counts.reviews} reviews, ${counts.customers} customers, ${counts.orders} reservations`);
  await db.closeDb();
})().catch((error) => {
  console.error('Database setup failed:', error);
  process.exit(1);
});
