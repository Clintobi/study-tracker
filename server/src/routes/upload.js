const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../db/pool');
const { parseFile } = require('../services/parser');
const { generateFlashcards, generateQuiz, generateGamePlan, generatePastQuestions } = require('../services/claude');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, DOC, DOCX, PPT, PPTX files are allowed'));
  },
});

// POST /api/upload - Upload document and process it
router.post('/', upload.single('file'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { topicName, topicId, subject, generatePastQuestionsFlag } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (!topicName && !topicId) return res.status(400).json({ error: 'topicName or topicId required' });

    await client.query('BEGIN');

    // Resolve or create topic
    let resolvedTopicId = topicId;
    if (!resolvedTopicId) {
      const topicResult = await client.query(
        'INSERT INTO topics (name, subject) VALUES ($1, $2) RETURNING id',
        [topicName, subject || null]
      );
      resolvedTopicId = topicResult.rows[0].id;
    }

    // Parse file content
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    const content = await parseFile(file.buffer, file.originalname);

    if (!content || content.trim().length < 100) {
      throw new Error('Could not extract meaningful text from the file');
    }

    // Save document
    await client.query(
      'INSERT INTO documents (topic_id, filename, file_type, content) VALUES ($1, $2, $3, $4)',
      [resolvedTopicId, file.originalname, ext, content]
    );

    // Get all content for this topic (including previous documents)
    const allDocsResult = await client.query(
      'SELECT content FROM documents WHERE topic_id = $1',
      [resolvedTopicId]
    );
    const allContent = allDocsResult.rows.map((r) => r.content).join('\n\n---\n\n');

    const topicResult = await client.query('SELECT name, subject FROM topics WHERE id = $1', [resolvedTopicId]);
    const topic = topicResult.rows[0];

    // Generate AI content in parallel
    const [flashcards, quizQuestions, gamePlan] = await Promise.all([
      generateFlashcards(allContent, topic.name),
      generateQuiz(allContent, topic.name),
      generateGamePlan(allContent, topic.name),
    ]);

    // Delete old AI-generated content for this topic and replace
    await client.query('DELETE FROM flashcards WHERE topic_id = $1', [resolvedTopicId]);
    await client.query('DELETE FROM quiz_questions WHERE topic_id = $1', [resolvedTopicId]);
    await client.query('DELETE FROM game_plans WHERE topic_id = $1', [resolvedTopicId]);

    // Insert flashcards
    for (const card of flashcards) {
      const cardResult = await client.query(
        'INSERT INTO flashcards (topic_id, front, back) VALUES ($1, $2, $3) RETURNING id',
        [resolvedTopicId, card.front, card.back]
      );
      await client.query(
        'INSERT INTO card_reviews (card_id) VALUES ($1)',
        [cardResult.rows[0].id]
      );
    }

    // Insert quiz questions
    for (const q of quizQuestions) {
      await client.query(
        'INSERT INTO quiz_questions (topic_id, question, options, correct_answer, explanation) VALUES ($1, $2, $3, $4, $5)',
        [resolvedTopicId, q.question, JSON.stringify(q.options), q.correct_answer, q.explanation]
      );
    }

    // Insert game plan
    await client.query(
      'INSERT INTO game_plans (topic_id, plan_data) VALUES ($1, $2)',
      [resolvedTopicId, JSON.stringify(gamePlan)]
    );

    // Optionally generate past questions
    if (generatePastQuestionsFlag === 'true') {
      const pastQs = await generatePastQuestions(topic.name, topic.subject);
      await client.query('DELETE FROM past_questions WHERE topic_id = $1', [resolvedTopicId]);
      for (const pq of pastQs) {
        await client.query(
          'INSERT INTO past_questions (topic_id, question, answer, source) VALUES ($1, $2, $3, $4)',
          [resolvedTopicId, pq.question, pq.answer, pq.source]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      topicId: resolvedTopicId,
      flashcardCount: flashcards.length,
      quizCount: quizQuestions.length,
      hasPastQuestions: generatePastQuestionsFlag === 'true',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
