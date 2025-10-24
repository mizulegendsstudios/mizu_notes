import { config } from 'dotenv';
config();
import { runMigrations } from './scripts/db/migrate.js';

runMigrations().catch(console.error);