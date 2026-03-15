import { pool } from '../../config/database.js';

export async function findByStore(storeId, { category, search } = {}) {
  let query = 'SELECT * FROM products WHERE store_id = $1';
  const params = [storeId];

  if (category) {
    params.push(category);
    query += ` AND category = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
  }

  query += ' ORDER BY sort_order ASC, created_at DESC';

  const { rows } = await pool.query(query, params);
  return rows;
}

export async function create(storeId, data) {
  const { name, description, price, image_url, images, category, in_stock, metadata, custom_styles } = data;
  const { rows } = await pool.query(
    `INSERT INTO products (store_id, name, description, price, image_url, images, category, in_stock, metadata, custom_styles)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [storeId, name, description, price, image_url, JSON.stringify(images ?? []), category, in_stock ?? true, JSON.stringify(metadata ?? {}), JSON.stringify(custom_styles ?? {})]
  );
  return rows[0];
}

export async function update(productId, storeId, data) {
  const fields = [];
  const params = [];

  const JSONB_KEYS = new Set(['images', 'metadata', 'custom_styles']);

  Object.entries(data).forEach(([key, value]) => {
    if (['name','description','price','image_url','images','category','in_stock','sort_order','metadata','custom_styles'].includes(key)) {
      // Explicit stringify for JSONB fields — pg does not auto-serialize in all versions
      const serialized = JSONB_KEYS.has(key) && value !== null && typeof value !== 'string'
        ? JSON.stringify(value)
        : value;
      params.push(serialized);
      fields.push(`${key} = $${params.length}`);
    }
  });

  if (!fields.length) throw new Error('Nada para actualizar');

  params.push(productId, storeId);
  const { rows } = await pool.query(
    `UPDATE products SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${params.length - 1} AND store_id = $${params.length}
     RETURNING *`,
    params
  );
  return rows[0];
}

export async function remove(productId, storeId) {
  const { rows } = await pool.query(
    'DELETE FROM products WHERE id = $1 AND store_id = $2 RETURNING id',
    [productId, storeId]
  );
  return rows[0];
}
