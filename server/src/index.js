require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

// Routes
app.use('/api/topics', require('./routes/topics'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/study', require('./routes/study'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Initialize database
async function initDB() {
  const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
  try {
    await pool.query(schema);
    console.log('Database initialized');
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
