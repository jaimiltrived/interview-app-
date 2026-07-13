export const calculateStreakStats = (sessionHistory) => {
  if (!sessionHistory || sessionHistory.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalSessions: 0 };
  }

  // Get unique dates (normalized to midnight)
  const uniqueDates = [...new Set(sessionHistory.map(s => {
    const d = new Date(s.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }))].sort((a, b) => b - a); // sort descending (newest first)

  if (uniqueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalSessions: 0 };
  }

  // Current Streak Calculation
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayTime = today.getTime();
  const yesterdayTime = yesterday.getTime();

  // If the user hasn't practiced today or yesterday, streak is broken
  const latestTime = uniqueDates[0];
  let streakActive = (latestTime === todayTime || latestTime === yesterdayTime);

  if (streakActive) {
    let checkTime = latestTime;
    for (let i = 0; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === checkTime) {
        currentStreak++;
        // Move checkTime to the previous day
        const prev = new Date(checkTime);
        prev.setDate(prev.getDate() - 1);
        checkTime = prev.getTime();
      } else {
        break; // Streak broken
      }
    }
  }

  // Longest Streak Calculation
  let longestStreak = 0;
  let currentRun = 1;
  
  // Sort ascending for longest streak logic
  const ascendingDates = [...uniqueDates].reverse();
  
  for (let i = 1; i < ascendingDates.length; i++) {
    const prevDate = new Date(ascendingDates[i - 1]);
    const currDate = new Date(ascendingDates[i]);
    
    // Check if currDate is exactly 1 day after prevDate
    const expectedNextDay = new Date(prevDate);
    expectedNextDay.setDate(expectedNextDay.getDate() + 1);
    
    if (currDate.getTime() === expectedNextDay.getTime()) {
      currentRun++;
    } else {
      longestStreak = Math.max(longestStreak, currentRun);
      currentRun = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentRun);
  if (ascendingDates.length === 0) longestStreak = 0;

  return {
    currentStreak,
    longestStreak,
    totalSessions: sessionHistory.length
  };
};
