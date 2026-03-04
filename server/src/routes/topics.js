const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET all topics
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*,
        COUNT(DISTINCT f.id) AS flashcard_count,
        COUNT(DISTINCT q.id) AS quiz_count,
        COUNT(DISTINCT d.id) AS document_count
       FROM topics t
       LEFT JOIN flashcards f ON f.topic_id = t.id
       LEFT JOIN quiz_questions q ON q.topic_id = t.id
       LEFT JOIN documents d ON d.topic_id = t.id
       GROUP BY t.id
       ORDER BY t.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single topic with details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const topicResult = await pool.query('SELECT * FROM topics WHERE id = $1', [id]);
    if (!topicResult.rows.length) return res.status(404).json({ error: 'Topic not found' });

    const [flashcards, quizQuestions, gamePlan, pastQuestions, documents] = await Promise.all([
      pool.query(
        `SELECT f.*, cr.easiness, cr.interval, cr.repetitions, cr.next_review
         FROM flashcards f
         LEFT JOIN card_reviews cr ON cr.card_id = f.id
         WHERE f.topic_id = $1`,
        [id]
      ),
      pool.query('SELECT * FROM quiz_questions WHERE topic_id = $1', [id]),
      pool.query('SELECT * FROM game_plans WHERE topic_id = $1', [id]),
      pool.query('SELECT * FROM past_questions WHERE topic_id = $1 ORDER BY created_at DESC', [id]),
      pool.query('SELECT id, filename, file_type, created_at FROM documents WHERE topic_id = $1', [id]),
    ]);

    res.json({
      ...topicResult.rows[0],
      flashcards: flashcards.rows,
      quiz_questions: quizQuestions.rows,
      game_plan: gamePlan.rows[0]?.plan_data || null,
      past_questions: pastQuestions.rows,
      documents: documents.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE topic
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM topics WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
