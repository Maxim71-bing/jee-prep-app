import { useState, useEffect } from 'react';

/**
 * Calculates the time until retention hits 50% based on the Ebbinghaus Forgetting Curve.
 * @param lastRevisionDate ISO string of the last revision date
 * @param confidenceStars 1-5 stars
 * @returns A countdown string (e.g., '2d 14h') or 'Decayed' if past the threshold
 */
export function calculateTimeUntilDecay(lastRevisionDate: string, confidenceStars: number): string {
  if (!lastRevisionDate || !confidenceStars) return 'N/A';

  const lastRev = new Date(lastRevisionDate).getTime();
  const now = Date.now();

  // Map confidence stars to decay time in days (1 star = 1 day, 5 stars = 14 days)
  // Linear interpolation: t_decay = 1 + (confidenceStars - 1) * (13 / 4)
  const decayDays = 1 + (confidenceStars - 1) * 3.25;
  const decayMs = decayDays * 24 * 60 * 60 * 1000;
  
  const decayTime = lastRev + decayMs;
  const timeRemaining = decayTime - now;

  if (timeRemaining <= 0) {
    return 'Decayed';
  }

  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * React hook to get a live updating decay countdown string.
 */
export function useDecayTimer(lastRevisionDate?: string, confidenceStars?: number) {
  const [countdown, setCountdown] = useState(() => 
    lastRevisionDate && confidenceStars 
      ? calculateTimeUntilDecay(lastRevisionDate, confidenceStars) 
      : 'N/A'
  );

  useEffect(() => {
    if (!lastRevisionDate || !confidenceStars) {
      setCountdown('N/A');
      return;
    }

    // Initial calculation
    setCountdown(calculateTimeUntilDecay(lastRevisionDate, confidenceStars));

    // Update every minute
    const interval = setInterval(() => {
      setCountdown(calculateTimeUntilDecay(lastRevisionDate, confidenceStars));
    }, 60000);

    return () => clearInterval(interval);
  }, [lastRevisionDate, confidenceStars]);

  return countdown;
}
