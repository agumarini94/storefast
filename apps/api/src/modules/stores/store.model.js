import { pool } from '../../config/database.js';

export async function findBySlug(slug) {
  const { rows } = await pool.query(
    'SELECT * FROM stores WHERE LOWER(slug) = LOWER($1) AND is_active = true',
    [slug]
  );
  return rows[0];
}

export async function findByOwnerId(ownerId) {
  const { rows } = await pool.query(
    'SELECT * FROM stores WHERE owner_id = $1',
    [ownerId]
  );
  return rows;
}

export async function create({ slug, name, ownerId }) {
  const { rows } = await pool.query(
    `INSERT INTO stores (slug, name, owner_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [slug, name, ownerId]
  );
  return rows[0];
}

export async function updateTheme(storeId, theme) {
  const { rows } = await pool.query(
    `UPDATE stores SET theme = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [JSON.stringify(theme), storeId]
  );
  return rows[0];
}

export async function updateContact(storeId, contact) {
  const { rows } = await pool.query(
    `UPDATE stores SET contact = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [JSON.stringify(contact), storeId]
  );
  return rows[0];
}

export async function updateAbout(storeId, about) {
  const { rows } = await pool.query(
    `UPDATE stores SET about = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [JSON.stringify(about), storeId]
  );
  return rows[0];
}

export async function updateInfo(storeId, { name, slug }) {
  const { rows } = await pool.query(
    `UPDATE stores SET name = $1, slug = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [name, slug, storeId]
  );
  return rows[0];
}
