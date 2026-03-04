/**
 * SM-2 Spaced Repetition Algorithm
 * quality: 0-5
 *   0 = complete blackout
 *   1 = incorrect, remembered upon seeing answer
 *   2 = incorrect, easy recall
 *   3 = correct, significant difficulty
 *   4 = correct, after hesitation
 *   5 = perfect response
 */
function sm2(quality, repetitions, easiness, interval) {
  if (quality < 0 || quality > 5) throw new Error('Quality must be 0-5');

  let newRepetitions = repetitions;
  let newEasiness = easiness;
  let newInterval = interval;

  if (quality >= 3) {
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easiness);
    }
    newRepetitions = repetitions + 1;
  } else {
    newRepetitions = 0;
    newInterval = 1;
  }

  newEasiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEasiness < 1.3) newEasiness = 1.3;

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    repetitions: newRepetitions,
    easiness: Math.round(newEasiness * 1000) / 1000,
    interval: newInterval,
    nextReview,
  };
}

module.exports = { sm2 };
