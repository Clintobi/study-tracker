-- Study Tracker Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS topics (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  subject     VARCHAR(255),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id    UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  filename    VARCHAR(500) NOT NULL,
  file_type   VARCHAR(50) NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flashcards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id    UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  front       TEXT NOT NULL,
  back        TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS card_reviews (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id      UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  easiness     FLOAT DEFAULT 2.5,
  interval     INTEGER DEFAULT 1,
  repetitions  INTEGER DEFAULT 0,
  next_review  TIMESTAMP DEFAULT NOW(),
  last_reviewed TIMESTAMP DEFAULT NOW(),
  UNIQUE(card_id)
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id       UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  question       TEXT NOT NULL,
  options        JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation    TEXT,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_plans (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id    UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE UNIQUE,
  plan_data   JSONB NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS past_questions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id    UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  answer      TEXT,
  source      VARCHAR(500),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discussion_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id    UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
