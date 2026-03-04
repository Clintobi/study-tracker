import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Check, BookOpen } from 'lucide-react';
import { studyAPI } from '../api/client';

const QUALITY_BUTTONS = [
  { label: 'Again', value: 0, color: 'bg-red-500 hover:bg-red-600' },
  { label: 'Hard', value: 2, color: 'bg-orange-400 hover:bg-orange-500' },
  { label: 'Good', value: 4, color: 'bg-green-400 hover:bg-green-500' },
  { label: 'Easy', value: 5, color: 'bg-green-600 hover:bg-green-700' },
];

export default function ReviewPage() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    studyAPI.getDueCards()
      .then(setCards)
      .finally(() => setLoading(false));
  }, []);

  const card = cards[index];

  const handleReview = async (quality) => {
    await studyAPI.reviewCard(card.id, quality);
    setReviewed((r) => r + 1);
    setFlipped(false);
    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading due cards...</div>;

  if (cards.length === 0) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <Check className="mx-auto text-green-500 mb-4" size={56} />
        <h2 className="text-2xl font-bold mb-2">All caught up!</h2>
        <p className="text-gray-500 mb-6">No cards are due for review right now. Come back later.</p>
        <Link to="/" className="text-blue-600 hover:underline flex items-center justify-center gap-1">
          <BookOpen size={15} /> Back to Topics
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <Check className="mx-auto text-green-500 mb-4" size={56} />
        <h2 className="text-2xl font-bold mb-2">Review Complete!</h2>
        <p className="text-gray-500 mb-6">You reviewed {reviewed} cards. Great work!</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setIndex(0); setDone(false); setFlipped(false); setLoading(true); studyAPI.getDueCards().then(setCards).finally(() => setLoading(false)); }}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <RotateCcw size={15} /> Check Again
          </button>
          <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Back to Topics
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold">Spaced Repetition Review</h1>
        <span className="text-sm text-gray-500">{index + 1} / {cards.length} due</span>
      </div>
      <p className="text-xs text-gray-400 mb-6">
        Topic: <span className="font-medium text-gray-600">{card.topic_name}</span>
        {card.next_review && (
          <span className="ml-3">
            Last interval: <strong>{card.interval} day{card.interval !== 1 ? 's' : ''}</strong>
          </span>
        )}
      </p>

      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
        <div
          className="bg-amber-400 h-1.5 rounded-full transition-all"
          style={{ width: `${(index / cards.length) * 100}%` }}
        />
      </div>

      <div
        className={`bg-white border-2 rounded-2xl p-8 min-h-52 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-sm hover:shadow-md ${
          flipped ? 'border-amber-300' : 'border-gray-200'
        }`}
        onClick={() => setFlipped(!flipped)}
      >
        <div className="text-xs uppercase font-semibold text-gray-400 mb-4">
          {flipped ? 'Answer' : 'Question — tap to reveal'}
        </div>
        <p className="text-lg font-medium text-gray-900 leading-relaxed">
          {flipped ? card.back : card.front}
        </p>
      </div>

      {flipped && (
        <div className="mt-6">
          <p className="text-center text-xs text-gray-400 mb-3">How well did you recall this?</p>
          <div className="grid grid-cols-4 gap-2">
            {QUALITY_BUTTONS.map((btn) => (
              <button
                key={btn.value}
                onClick={() => handleReview(btn.value)}
                className={`${btn.color} text-white rounded-xl py-3 text-sm font-semibold transition-colors`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
