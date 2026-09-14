/**
 * Safe Caption Presentation Policy
 * In accordance with Build Plan rd03 §6.2 and Task P6b.1
 */

export function evaluateCaptionPolicy(context = {}) {
  const {
    activity = 'focus', // 'focus' | 'retrieval' | 'transfer' | 'review' | 'overview'
    attemptStatus = 'none', // 'none' | 'attempted' | 'completed'
    speakerRole = 'tutor', // 'tutor' | 'learner'
    vietnameseRevealed = false
  } = context;

  // Invariant §6.2: During assessed retrieval/transfer, suppress answer-bearing tutor captions
  // and learner transcripts until the attempt closes.
  const isAssessedActivity = activity === 'retrieval' || activity === 'transfer';
  const isAttemptOpen = attemptStatus === 'none';

  if (isAssessedActivity && isAttemptOpen && !vietnameseRevealed) {
    return {
      allowed: false,
      suppressed: true,
      reason: 'Suppressed to protect independent retrieval attempt against answer spoiling',
      renderMode: 'hidden',
      ariaHidden: true
    };
  }

  return {
    allowed: true,
    suppressed: false,
    reason: 'Approved for display under current activity policy',
    renderMode: 'visible',
    ariaHidden: false
  };
}
