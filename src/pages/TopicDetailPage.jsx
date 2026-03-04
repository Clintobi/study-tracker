import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Brain, ClipboardList, MessageCircle, BookOpen, Target, Clock, Lightbulb, ChevronRight, FileText } from 'lucide-react';
import { topicsAPI } from '../api/client';

const PHASE_COLORS = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-green-100 text-green-700', 'bg-amber-100 text-amber-700'];
const DIFFICULTY_COLOR = { beginner: 'text-green-600', intermediate: 'text-amber-600', advanced: 'text-red-600' };

export default function TopicDetailPage() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPastQ, setShowPastQ] = useState(false);

  useEffect(() => {
    topicsAPI.getOne(id).then(setTopic).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!topic) return <div className="text-center py-20 text-red-500">Topic not found.</div>;

  const plan = topic.game_plan;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{topic.name}</h1>
        {topic.subject && <p className="text-gray-500">{topic.subject}</p>}
        {plan && (
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className={`font-medium capitalize ${DIFFICULTY_COLOR[plan.difficulty] || ''}`}>
              {plan.difficulty}
            </span>
            <span className="text-gray-400 flex items-center gap-1">
              <Clock size={13} />
              ~{plan.estimated_hours}h to master
            </span>
          </div>
        )}
      </div>

      {/* Study Mode Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Link
          to={`/topics/${id}/flashcards`}
          className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-5 text-center transition-colors"
        >
          <Brain className="mx-auto text-blue-500 mb-2" size={30} />
          <p className="font-semibold text-blue-700">Flashcards</p>
          <p className="text-xs text-blue-500 mt-0.5">{topic.flashcards?.length || 0} cards</p>
        </Link>
        <Link
          to={`/topics/${id}/quiz`}
          className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl p-5 text-center transition-colors"
        >
          <ClipboardList className="mx-auto text-purple-500 mb-2" size={30} />
          <p className="font-semibold text-purple-700">Quiz</p>
          <p className="text-xs text-purple-500 mt-0.5">{topic.quiz_questions?.length || 0} questions</p>
        </Link>
        <Link
          to={`/topics/${id}/discuss`}
          className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl p-5 text-center transition-colors"
        >
          <MessageCircle className="mx-auto text-green-500 mb-2" size={30} />
          <p className="font-semibold text-green-700">Discuss</p>
          <p className="text-xs text-green-500 mt-0.5">AI tutor</p>
        </Link>
      </div>

      {/* Game Plan */}
      {plan && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-blue-500" size={20} />
            <h2 className="text-lg font-bold">Game Plan</h2>
          </div>

          <p className="text-gray-600 mb-5">{plan.overview}</p>

          {/* Key Concepts */}
          {plan.key_concepts?.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Key Concepts</h3>
              <div className="flex flex-wrap gap-2">
                {plan.key_concepts.map((c, i) => (
                  <span key={i} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Phases */}
          <div className="space-y-4">
            {plan.phases?.map((phase, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PHASE_COLORS[i % PHASE_COLORS.length]}`}>
                    Phase {phase.phase}
                  </span>
                  <span className="font-semibold">{phase.title}</span>
                  <span className="ml-auto text-xs text-gray-400">{phase.duration_days} days</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{phase.goal}</p>
                <div className="space-y-1">
                  {phase.activities?.map((a, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-gray-500">
                      <ChevronRight size={12} className="shrink-0" />
                      <span className="capitalize font-medium text-gray-700">{a.type}</span>
                      <span>—</span>
                      <span>{a.description}</span>
                      <span className="ml-auto text-xs whitespace-nowrap">{a.duration_minutes}min</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          {plan.tips?.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <Lightbulb size={13} /> Study Tips
              </h3>
              <ul className="space-y-1">
                {plan.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-blue-400">•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Past Questions */}
      {topic.past_questions?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="text-amber-500" size={20} />
              <h2 className="text-lg font-bold">Past Exam Questions</h2>
            </div>
            <button
              onClick={() => setShowPastQ(!showPastQ)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showPastQ ? 'Hide' : `Show ${topic.past_questions.length}`}
            </button>
          </div>
          {showPastQ && (
            <div className="space-y-4">
              {topic.past_questions.map((pq, i) => (
                <div key={pq.id} className="border border-gray-100 rounded-lg p-4">
                  <p className="font-medium mb-1">Q{i + 1}. {pq.question}</p>
                  {pq.source && <p className="text-xs text-gray-400 mb-2">{pq.source}</p>}
                  <details className="text-sm text-gray-600">
                    <summary className="cursor-pointer text-blue-600 font-medium">Show answer</summary>
                    <p className="mt-2 pl-2 border-l-2 border-blue-200">{pq.answer}</p>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documents */}
      {topic.documents?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <FileText size={18} className="text-gray-400" /> Source Documents
          </h2>
          <div className="space-y-2">
            {topic.documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 text-sm text-gray-600">
                <FileText size={14} />
                <span>{doc.filename}</span>
                <span className="text-gray-400 uppercase text-xs">{doc.file_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
