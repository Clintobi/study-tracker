import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, Brain, MessageCircle, Trash2, Plus, RotateCcw } from 'lucide-react';
import { topicsAPI, studyAPI } from '../api/client';

export default function TopicsPage() {
  const [topics, setTopics] = useState([]);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([topicsAPI.getAll(), studyAPI.getDueCards()])
      .then(([t, due]) => {
        setTopics(t);
        setDueCount(due.length);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (!window.confirm('Delete this topic and all its study materials?')) return;
    await topicsAPI.delete(id);
    setTopics((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">
        <BookOpen className="mx-auto mb-3 animate-pulse" size={40} />
        <p>Loading topics...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Topics</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {topics.length} topic{topics.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {dueCount > 0 && (
            <Link
              to="/review"
              className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600"
            >
              <RotateCcw size={15} />
              {dueCount} due for review
            </Link>
          )}
          <Link
            to="/upload"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus size={15} />
            Add Topic
          </Link>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
          <BookOpen className="mx-auto text-gray-300 mb-4" size={52} />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">No topics yet</h3>
          <p className="text-gray-400 mb-5">Upload a PDF, PPTX, or DOCX to get started.</p>
          <Link
            to="/upload"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Upload Study Material
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              to={`/topics/${topic.id}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {topic.name}
                  </h3>
                  {topic.subject && (
                    <span className="text-xs text-gray-400">{topic.subject}</span>
                  )}
                </div>
                <button
                  onClick={(e) => handleDelete(e, topic.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Brain size={13} />
                  {topic.flashcard_count} cards
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={13} />
                  {topic.quiz_count} quiz
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={13} />
                  discuss
                </span>
              </div>

              <p className="text-xs text-gray-400 mt-3">
                {new Date(topic.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
