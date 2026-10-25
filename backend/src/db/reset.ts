import { pool } from './pool.js';
import { migrate } from './migrate.js';
import { seed } from './seed.js';

async function reset(): Promise<void> {
  await pool.query(`
    DROP TABLE IF EXISTS purchases CASCADE;
    DROP TABLE IF EXISTS stock_movements CASCADE;
    DROP TABLE IF EXISTS vehicles CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS schema_migrations CASCADE;
  `);
  await migrate();
  await seed();
  console.log('Database reset complete');
}

reset()
  .then(async () => {
    await pool.end();
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
