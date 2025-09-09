// /workspaces/eGest_BackEnd/db.js

import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;

export const pool = new Pool({
    connectionString: process.env.DB_CONNECTION,
    ssl: { rejectUnauthorized: false } 
});
