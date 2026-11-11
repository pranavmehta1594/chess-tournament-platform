import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/chess_db';

  console.log('Connecting to database for migrations...');
  const isSsl =
    connectionString.includes('sslmode=require') ||
    connectionString.includes('neon.tech');

  const sql = postgres(connectionString, {
    max: 1,
    ssl: isSsl ? 'require' : false,
  });
  const db = drizzle(sql);

  console.log('Running Drizzle migrations from ./drizzle ...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations applied successfully!');

  await sql.end();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
