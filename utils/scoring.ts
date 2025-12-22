export const calculatePoints = (
  predHome: number, 
  predAway: number, 
  realHome: number, 
  realAway: number
): number => {
  // 1. Check for Exact Match (3 pts)
  if (predHome === realHome && predAway === realAway) {
    return 3;
  }

  // Determine Winner (or Draw)
  const predWinner = predHome > predAway ? 'HOME' : predHome < predAway ? 'AWAY' : 'DRAW';
  const realWinner = realHome > realAway ? 'HOME' : realHome < realAway ? 'AWAY' : 'DRAW';

  // If winner is wrong, 0 points
  if (predWinner !== realWinner) {
    return 0;
  }

  // If winner is correct, check if at least one score is exact (2 pts)
  if (predHome === realHome || predAway === realAway) {
    return 2;
  }

  // If only winner is correct (1 pt)
  return 1;
};