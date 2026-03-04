const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { sm2 } = require('../services/sm2');
const { chat } = require('../services/claude');

// GET due cards for spaced repetition
router.get('/due', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.id, f.front, f.back, f.topic_id, t.name AS topic_name,
              cr.easiness, cr.interval, cr.repetitions, cr.next_review
       FROM flashcards f
       JOIN card_reviews cr ON cr.card_id = f.id
       JOIN topics t ON t.id = f.topic_id
       WHERE cr.next_review <= NOW()
       ORDER BY cr.next_review ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST review a card (SM-2)
router.post('/review/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;
    const { quality } = req.body; // 0-5

    if (quality === undefined || quality < 0 || quality > 5) {
      return res.status(400).json({ error: 'quality must be 0-5' });
    }

    const reviewResult = await pool.query(
      'SELECT * FROM card_reviews WHERE card_id = $1',
      [cardId]
    );

    if (!reviewResult.rows.length) {
      return res.status(404).json({ error: 'Card review record not found' });
    }

    const current = reviewResult.rows[0];
    const updated = sm2(
      parseInt(quality),
      current.repetitions,
      current.easiness,
      current.interval
    );

    await pool.query(
      `UPDATE card_reviews
       SET easiness = $1, interval = $2, repetitions = $3, next_review = $4, last_reviewed = NOW()
       WHERE card_id = $5`,
      [updated.easiness, updated.interval, updated.repetitions, updated.nextReview, cardId]
    );

    res.json({ ...updated, cardId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET flashcards for a topic
router.get('/flashcards/:topicId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.*, cr.easiness, cr.interval, cr.repetitions, cr.next_review
       FROM flashcards f
       LEFT JOIN card_reviews cr ON cr.card_id = f.id
       WHERE f.topic_id = $1
       ORDER BY f.created_at`,
      [req.params.topicId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET quiz questions for a topic (shuffled)
router.get('/quiz/:topicId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM quiz_questions WHERE topic_id = $1 ORDER BY RANDOM() LIMIT 10',
      [req.params.topicId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST chat message for a topic
router.post('/discuss/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { message } = req.body;

    if (!message) return res.status(400).json({ error: 'message required' });

    // Get topic and document content
    const topicResult = await pool.query('SELECT * FROM topics WHERE id = $1', [topicId]);
    if (!topicResult.rows.length) return res.status(404).json({ error: 'Topic not found' });
    const topic = topicResult.rows[0];

    const docsResult = await pool.query('SELECT content FROM documents WHERE topic_id = $1', [topicId]);
    const content = docsResult.rows.map((r) => r.content).join('\n\n---\n\n');

    // Get conversation history (last 10 messages)
    const historyResult = await pool.query(
      'SELECT role, content FROM discussion_messages WHERE topic_id = $1 ORDER BY created_at DESC LIMIT 10',
      [topicId]
    );
    const history = historyResult.rows.reverse();

    // Save user message
    await pool.query(
      'INSERT INTO discussion_messages (topic_id, role, content) VALUES ($1, $2, $3)',
      [topicId, 'user', message]
    );

    // Get AI response
    const reply = await chat(topic.name, content, history, message);

    // Save assistant message
    await pool.query(
      'INSERT INTO discussion_messages (topic_id, role, content) VALUES ($1, $2, $3)',
      [topicId, 'assistant', reply]
    );

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET discussion history for a topic
router.get('/discuss/:topicId/history', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM discussion_messages WHERE topic_id = $1 ORDER BY created_at',
      [req.params.topicId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE discussion history
router.delete('/discuss/:topicId/history', async (req, res) => {
  try {
    await pool.query('DELETE FROM discussion_messages WHERE topic_id = $1', [req.params.topicId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
