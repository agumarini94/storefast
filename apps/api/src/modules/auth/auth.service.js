import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../../config/database.js';
import { env } from '../../config/env.js';

/** Converts a store name into a URL-safe slug: "Mi Tienda!" → "mi-tienda" */
function slugify(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 60) || 'tienda';
}

export async function register({ email, password, firstName, lastName, phone, storeName, role = 'store_owner' }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check email uniqueness
    const { rows: emailRows } = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailRows[0]) throw Object.assign(new Error('Este email ya está registrado'), { status: 409 });

    // Generate a unique slug
    const baseSlug = slugify(storeName);
    let slug = baseSlug;
    let suffix = 1;
    while (true) {
      const { rows: slugRows } = await client.query('SELECT id FROM stores WHERE slug = $1', [slug]);
      if (!slugRows[0]) break;
      slug = `${baseSlug}-${suffix++}`;
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const { rows: userRows } = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role, first_name, last_name, phone, created_at`,
      [email, password_hash, role, firstName || null, lastName || null, phone || null]
    );
    const user = userRows[0];

    // Create store automatically
    const contact = phone ? JSON.stringify({ whatsapp: phone.replace(/\D/g, '') }) : '{}';
    await client.query(
      `INSERT INTO stores (slug, owner_id, name, contact) VALUES ($1, $2, $3, $4)`,
      [slug, user.id, storeName, contact]
    );

    await client.query('COMMIT');

    const token = jwt.sign({ userId: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
    return { user, token };

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function login({ email, password }) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  const user = rows[0];
  if (!user) throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });

  const token = jwt.sign({ userId: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token };
}

export async function requestPasswordReset({ email }) {
  // Always return success to prevent email enumeration
  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (!rows[0]) return;

  const userId = rows[0].id;
  const token  = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Invalidate previous tokens for this user
  await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);

  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );

  const resetUrl = `${env.appUrl || 'http://localhost:5173'}/reset-password?token=${token}`;
  console.log('\n🔑 PASSWORD RESET LINK (dev — enviar por email en producción):');
  console.log(resetUrl);
  console.log('');
}

export async function resetPassword({ token, newPassword }) {
  const { rows } = await pool.query(
    `SELECT * FROM password_reset_tokens
     WHERE token = $1 AND used = false AND expires_at > NOW()`,
    [token]
  );

  const record = rows[0];
  if (!record) throw Object.assign(new Error('Token inválido o expirado'), { status: 400 });

  const password_hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [password_hash, record.user_id]);
  await pool.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [record.id]);
}

export async function updateProfile(userId, { firstName, lastName, phone }) {
  const { rows } = await pool.query(
    `UPDATE users
     SET first_name = $1, last_name = $2, phone = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING id, email, role, first_name, last_name, phone, created_at`,
    [firstName ?? null, lastName ?? null, phone ?? null, userId]
  );
  if (!rows[0]) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });
  return rows[0];
}

export async function changePassword({ userId, currentPassword, newPassword }) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  const user = rows[0];
  if (!user) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw Object.assign(new Error('Contraseña actual incorrecta'), { status: 400 });

  const password_hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [password_hash, userId]);
}
