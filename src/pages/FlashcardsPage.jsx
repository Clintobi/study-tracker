import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RotateCcw, ArrowLeft, Check } from 'lucide-react';
import { studyAPI } from '../api/client';

const QUALITY_BUTTONS = [
  { label: 'Blackout', value: 0, color: 'bg-red-600 hover:bg-red-700', desc: "Complete blank" },
  { label: 'Wrong', value: 1, color: 'bg-red-400 hover:bg-red-500', desc: "Wrong but recalled" },
  { label: 'Hard', value: 2, color: 'bg-orange-400 hover:bg-orange-500', desc: "Correct with difficulty" },
  { label: 'OK', value: 3, color: 'bg-yellow-400 hover:bg-yellow-500', desc: "Correct after hesitation" },
  { label: 'Good', value: 4, color: 'bg-green-400 hover:bg-green-500', desc: "Correct with hesitation" },
  { label: 'Easy', value: 5, color: 'bg-green-600 hover:bg-green-700', desc: "Perfect recall" },
];

export default function FlashcardsPage() {
  const { id } = useParams();
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    studyAPI.getFlashcards(id)
      .then(setCards)
      .finally(() => setLoading(false));
  }, [id]);

  const card = cards[index];

  const handleReview = async (quality) => {
    if (!card) return;
    setReviewing(true);
    await studyAPI.reviewCard(card.id, quality);
    setReviewing(false);
    setFlipped(false);
    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const restart = () => {
    setIndex(0);
    setFlipped(false);
    setDone(false);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading cards...</div>;

  if (cards.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">No flashcards for this topic yet.</p>
        <Link to={`/topics/${id}`} className="text-blue-600 hover:underline flex items-center justify-center gap-1">
          <ArrowLeft size={15} /> Back to topic
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <Check className="mx-auto text-green-500 mb-4" size={56} />
        <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
        <p className="text-gray-500 mb-6">You reviewed all {cards.length} cards. Reviews saved to spaced repetition schedule.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={restart} className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
            <RotateCcw size={15} /> Review Again
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
        <span className="text-sm text-gray-500">
          {index + 1} / {cards.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all"
          style={{ width: `${((index) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div
        className={`bg-white border-2 rounded-2xl p-8 min-h-56 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-sm hover:shadow-md ${
          flipped ? 'border-green-300' : 'border-gray-200'
        }`}
        onClick={() => setFlipped(!flipped)}
      >
        <div className="text-xs uppercase font-semibold text-gray-400 mb-4">
          {flipped ? 'Answer' : 'Question — tap to reveal'}
        </div>
        <p className="text-lg font-medium text-gray-900 leading-relaxed">
          {flipped ? card.back : card.front}
        </p>
        {!flipped && (
          <div className="mt-6 text-gray-300 flex items-center gap-1 text-sm">
            <RotateCcw size={13} /> tap to flip
          </div>
        )}
      </div>

      {/* Rating buttons — only show after flip */}
      {flipped && (
        <div className="mt-6">
          <p className="text-center text-xs text-gray-400 mb-3">How well did you know this?</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {QUALITY_BUTTONS.map((btn) => (
              <button
                key={btn.value}
                onClick={() => handleReview(btn.value)}
                disabled={reviewing}
                className={`${btn.color} text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50`}
                title={btn.desc}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            Rating affects when you'll see this card again (SM-2 algorithm)
          </p>
        </div>
      )}

      {/* Navigation (no review, just browse) */}
      {!flipped && (
        <div className="flex justify-between mt-6">
          <button
            onClick={() => { setIndex((i) => Math.max(0, i - 1)); setFlipped(false); }}
            disabled={index === 0}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronLeft size={15} /> Previous
          </button>
          <button
            onClick={() => { setIndex((i) => Math.min(cards.length - 1, i + 1)); setFlipped(false); }}
            disabled={index === cards.length - 1}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
