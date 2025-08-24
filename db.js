const { Client } = require('pg');

export const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'webapp',
    password: 'dodder',
    port: 5432,
  });

module.exports = {
    query: (text, params) => pool.query(text, params)
};