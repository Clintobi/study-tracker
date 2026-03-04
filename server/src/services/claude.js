const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';

async function generateFlashcards(content, topicName, count = 20) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are an expert educator. Based on the following study material about "${topicName}", generate ${count} high-quality flashcards.

Return ONLY a JSON array with this exact format:
[
  { "front": "Question or concept", "back": "Answer or explanation" }
]

Focus on key concepts, definitions, formulas, and important facts. Make questions clear and concise.

Study material:
${content.slice(0, 15000)}`,
      },
    ],
  });

  const text = message.content[0].text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Failed to parse flashcards from Claude response');
  return JSON.parse(jsonMatch[0]);
}

async function generateQuiz(content, topicName, count = 10) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are an expert educator. Based on the following study material about "${topicName}", generate ${count} multiple choice quiz questions.

Return ONLY a JSON array with this exact format:
[
  {
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Why this answer is correct"
  }
]

"correct_answer" is the 0-based index of the correct option. Make questions test deep understanding, not just memorization.

Study material:
${content.slice(0, 15000)}`,
      },
    ],
  });

  const text = message.content[0].text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Failed to parse quiz from Claude response');
  return JSON.parse(jsonMatch[0]);
}

async function generateGamePlan(content, topicName) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are an expert learning strategist. Based on the study material about "${topicName}", create a detailed game plan for mastering this topic using spaced repetition.

Return ONLY a JSON object with this exact format:
{
  "overview": "Brief summary of what will be learned",
  "difficulty": "beginner|intermediate|advanced",
  "estimated_hours": 10,
  "phases": [
    {
      "phase": 1,
      "title": "Phase title",
      "duration_days": 3,
      "goal": "What to achieve in this phase",
      "activities": [
        { "type": "flashcards|quiz|discussion|reading", "description": "Activity details", "duration_minutes": 20 }
      ]
    }
  ],
  "key_concepts": ["concept1", "concept2"],
  "mastery_milestones": ["milestone1", "milestone2"],
  "tips": ["Study tip 1", "Study tip 2"]
}

Study material:
${content.slice(0, 15000)}`,
      },
    ],
  });

  const text = message.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse game plan from Claude response');
  return JSON.parse(jsonMatch[0]);
}

async function generatePastQuestions(topicName, subject) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are an expert educator with knowledge of academic examinations. Generate 10 realistic past examination questions for the topic "${topicName}"${subject ? ` in ${subject}` : ''}.

These should resemble questions from university exams, professional certifications, or standardized tests.

Return ONLY a JSON array with this exact format:
[
  {
    "question": "The exam question",
    "answer": "Model answer or key points",
    "source": "Exam type or level (e.g., 'University Final Exam', 'Professional Certification')"
  }
]`,
      },
    ],
  });

  const text = message.content[0].text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Failed to parse past questions from Claude response');
  return JSON.parse(jsonMatch[0]);
}

async function chat(topicName, content, history, userMessage) {
  const systemPrompt = `You are an expert tutor specializing in "${topicName}". Your role is to help the student understand the material through Socratic questioning, clear explanations, and real-world examples.

You have access to the following study material:
---
${content.slice(0, 10000)}
---

Guide the student to deep understanding. Ask follow-up questions to check comprehension. Be encouraging but rigorous.`;

  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  });

  return response.content[0].text;
}

module.exports = { generateFlashcards, generateQuiz, generateGamePlan, generatePastQuestions, chat };
