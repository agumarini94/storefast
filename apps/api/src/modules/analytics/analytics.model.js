import { pool } from '../../config/database.js';

export async function recordEvent(storeId, productId) {
  await pool.query(
    `INSERT INTO analytics_events (store_id, product_id) VALUES ($1, $2)`,
    [storeId, productId]
  );
}

export async function getStoreStats(storeId) {
  // Daily counts last 7 days
  const { rows: daily } = await pool.query(
    `SELECT DATE(created_at) AS date, COUNT(*) AS count
     FROM analytics_events
     WHERE store_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [storeId]
  );

  // Top 5 products last 30 days
  const { rows: topProducts } = await pool.query(
    `SELECT p.id, p.name, p.image_url, p.category, COUNT(a.id) AS clicks
     FROM analytics_events a
     JOIN products p ON p.id = a.product_id
     WHERE a.store_id = $1 AND a.created_at >= NOW() - INTERVAL '30 days'
     GROUP BY p.id, p.name, p.image_url, p.category
     ORDER BY clicks DESC
     LIMIT 5`,
    [storeId]
  );

  // Top category last 30 days
  const { rows: topCategories } = await pool.query(
    `SELECT p.category, COUNT(a.id) AS clicks
     FROM analytics_events a
     JOIN products p ON p.id = a.product_id
     WHERE a.store_id = $1 AND a.created_at >= NOW() - INTERVAL '30 days'
       AND p.category IS NOT NULL AND p.category != ''
     GROUP BY p.category
     ORDER BY clicks DESC
     LIMIT 1`,
    [storeId]
  );

  // Total this week
  const { rows: [weekRow] } = await pool.query(
    `SELECT COUNT(*) AS total FROM analytics_events
     WHERE store_id = $1 AND created_at >= NOW() - INTERVAL '7 days'`,
    [storeId]
  );

  return {
    daily,
    topProduct:  topProducts[0]   || null,
    topCategory: topCategories[0] || null,
    topProducts,
    weekTotal:   Number(weekRow.total),
  };
}
