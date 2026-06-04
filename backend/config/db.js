const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gs_intranet',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
    connectTimeout: 10000,       // 10s connect timeout (fail fast)
    enableKeepAlive: true,       // keep connections alive
    keepAliveInitialDelay: 10000, // start keepalive after 10s idle
    idleTimeout: 60000,          // close idle connections after 60s
    maxIdle: 5                   // keep at most 5 idle connections
});

module.exports = pool.promise();
