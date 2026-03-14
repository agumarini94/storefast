import app from './app.js';
import { env } from './config/env.js';
import { initDatabase } from './config/database.js';

async function start() {
  await initDatabase();
  app.listen(env.port, () => {
    console.log(`🚀 API corriendo en http://localhost:${env.port}`);
  });
}

start().catch(console.error);
