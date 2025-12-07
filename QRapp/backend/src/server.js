const app = require('./app');
const { PORT } = require('./config/env');
const pool = require('./config/db');

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('MySQL connected');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to DB', err);
    process.exit(1);
  }
})();
