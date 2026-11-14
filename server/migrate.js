// Brings the PostgreSQL database up to date. Runs on every Vercel deploy, and locally with: npm run migrate
// Each file in database/migrations runs once, in name order, and is remembered in schema_migrations.
// If ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD are set and there is no admin yet, it creates the first admin.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, 'server.env') });

const dir = path.join(here, '..', 'database', 'migrations');

const run = async () => {
  if (!process.env.DATABASE_URL) {
    console.log('migrate: no DATABASE_URL, skipping database setup.');
    return;
  }

  const local = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: local ? false : { rejectUnauthorized: false } });

  try {
    await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, ran_at TIMESTAMPTZ NOT NULL DEFAULT now())');
    const done = new Set((await pool.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

    for (const f of files) {
      if (done.has(f)) continue;
      const c = await pool.connect();
      try {
        await c.query('BEGIN');
        await c.query(fs.readFileSync(path.join(dir, f), 'utf8'));
        await c.query('INSERT INTO schema_migrations (name) VALUES ($1)', [f]);
        await c.query('COMMIT');
        console.log(`migrate: ran ${f}`);
      } catch (e) {
        await c.query('ROLLBACK');
        throw new Error(`${f} failed: ${e.message}`);
      } finally {
        c.release();
      }
    }

    const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    const admins = (await pool.query('SELECT COUNT(*)::int AS n FROM admin_users')).rows[0].n;
    if (!admins && ADMIN_USERNAME && ADMIN_EMAIL && ADMIN_PASSWORD) {
      if (ADMIN_PASSWORD.length < 10) throw new Error('ADMIN_PASSWORD must be at least 10 characters.');
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      await pool.query('INSERT INTO admin_users (username, email, password_hash) VALUES ($1, $2, $3)',
        [ADMIN_USERNAME.toLowerCase(), ADMIN_EMAIL.toLowerCase(), hash]);
      console.log(`migrate: created admin ${ADMIN_USERNAME.toLowerCase()}`);
    } else if (!admins) {
      console.log('migrate: no admin yet. Set ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD, then run it again.');
    }
  } finally {
    await pool.end();
  }
};

run().catch((e) => { console.error('migrate:', e.message); process.exitCode = 1; });
