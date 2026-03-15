import { pool } from '../config/database.js';

export async function resolveTenant(req, res, next) {
  const slug = req.params.slug || req.headers['x-store-slug'];

  if (!slug) return res.status(400).json({ error: 'Store slug requerido' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM stores WHERE LOWER(slug) = LOWER($1) AND is_active = true',
      [slug]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Tienda no encontrada' });

    req.store = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}
