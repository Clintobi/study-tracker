import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Trophy } from 'lucide-react';
import { studyAPI } from '../api/client';

export default function QuizPage() {
  const { id } = useParams();
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadQuiz = () => {
    setLoading(true);
    studyAPI.getQuiz(id)
      .then(setQuestions)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadQuiz(); }, [id]);

  const q = questions[index];

  const handleSelect = (optionIndex) => {
    if (submitted) return;
    setSelected(optionIndex);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    if (selected === q.correct_answer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setSubmitted(false);
    }
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setSubmitted(false);
    setScore(0);
    setDone(false);
    loadQuiz();
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading quiz...</div>;

  if (questions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">No quiz questions for this topic yet.</p>
        <Link to={`/topics/${id}`} className="text-blue-600 hover:underline flex items-center justify-center gap-1">
          <ArrowLeft size={15} /> Back to topic
        </Link>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <Trophy className={`mx-auto mb-4 ${pct >= 70 ? 'text-amber-400' : 'text-gray-400'}`} size={56} />
        <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
        <p className="text-5xl font-extrabold text-blue-600 mb-2">{pct}%</p>
        <p className="text-gray-500 mb-6">
          {score} / {questions.length} correct
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={restart} className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
            <RotateCcw size={15} /> New Quiz
          </button>
          <Link to={`/topics/${id}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Back to Topic
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to={`/topics/${id}`} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft size={15} /> Back
        </Link>
        <span className="text-sm text-gray-500">Question {index + 1} of {questions.length}</span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
        <div
          className="bg-purple-500 h-1.5 rounded-full transition-all"
          style={{ width: `${((index) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <p className="font-semibold text-gray-900 text-lg mb-5 leading-relaxed">{q.question}</p>

        <div className="space-y-2">
          {q.options.map((option, i) => {
            let className = 'w-full text-left px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm ';
            if (!submitted) {
              className += selected === i
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50';
            } else {
              if (i === q.correct_answer) {
                className += 'border-green-500 bg-green-50 text-green-700';
              } else if (i === selected && i !== q.correct_answer) {
                className += 'border-red-400 bg-red-50 text-red-700';
              } else {
                className += 'border-gray-100 text-gray-400';
              }
            }
            return (
              <button key={i} className={className} onClick={() => handleSelect(i)}>
                <span className="inline-flex items-center gap-2">
                  {submitted && i === q.correct_answer && <CheckCircle size={15} className="text-green-500" />}
                  {submitted && i === selected && i !== q.correct_answer && <XCircle size={15} className="text-red-500" />}
                  <span className="font-bold text-gray-400 mr-1">{String.fromCharCode(65 + i)}.</span>
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        {submitted && q.explanation && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-sm text-blue-800">
            <strong>Explanation:</strong> {q.explanation}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={selected === null}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-40"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700"
            >
              {index + 1 >= questions.length ? 'See Results' : 'Next Question'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
