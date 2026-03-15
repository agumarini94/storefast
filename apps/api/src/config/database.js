import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseUrl?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'store_owner' CHECK (role IN ('superadmin', 'store_owner')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS stores (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        slug VARCHAR(100) UNIQUE NOT NULL,
        owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        theme JSONB DEFAULT '{}',
        contact JSONB DEFAULT '{}',
        plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        image_url VARCHAR(500),
        category VARCHAR(100),
        in_stock BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
      CREATE INDEX IF NOT EXISTS idx_products_category  ON products(store_id, category);
      CREATE INDEX IF NOT EXISTS idx_stores_slug        ON stores(slug);

      ALTER TABLE products ADD COLUMN IF NOT EXISTS images       JSONB DEFAULT '[]';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_styles JSONB DEFAULT '{}';
    `);
    console.log('✅ Database initialized');
  } finally {
    client.release();
  }
}
