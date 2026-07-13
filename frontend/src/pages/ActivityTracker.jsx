import React, { useMemo, useState } from 'react';
import { calculateStreakStats } from '../utils/streakUtils';

export default function ActivityTracker({ sessionHistory }) {
  const { currentStreak, longestStreak, totalSessions } = calculateStreakStats(sessionHistory);
  const [hoveredDay, setHoveredDay] = useState(null);

  const availableYears = useMemo(() => {
    const years = new Set(sessionHistory.map(s => new Date(s.date).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [sessionHistory]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Build the heatmap for the selected year
  const heatmapData = useMemo(() => {
    const dateCounts = {};
    sessionHistory.forEach(s => {
      const d = new Date(s.date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
    });

    const days = [];
    const currentIterDate = new Date(selectedYear, 0, 1);
    currentIterDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (currentIterDate.getFullYear() === selectedYear) {
      const dateStr = `${currentIterDate.getFullYear()}-${String(currentIterDate.getMonth() + 1).padStart(2, '0')}-${String(currentIterDate.getDate()).padStart(2, '0')}`;
      const isFuture = currentIterDate > today;
      
      days.push({
        date: new Date(currentIterDate),
        dateStr,
        count: dateCounts[dateStr] || 0,
        isFuture
      });
      currentIterDate.setDate(currentIterDate.getDate() + 1);
    }

    const getColor = (count, isFuture) => {
      if (isFuture) return '#f8fafc'; // slightly lighter gray for future dates
      if (count === 0) return '#ebedf0';
      if (count === 1) return '#9be9a8';
      if (count === 2) return '#40c463';
      if (count === 3) return '#30a14e';
      return '#216e39';
    };

    return days.map(day => ({
      ...day,
      color: getColor(day.count, day.isFuture)
    }));
  }, [sessionHistory, selectedYear]);

  // Group into weeks for CSS grid columns
  const weeks = [];
  let currentWeek = [];
  
  // To align properly, we might need to pad the first week so Sunday is at the top
  // But for a simple heatmap, we can just group by 7 days.
  // Standard GitHub heatmap starts on a Sunday and ends on Saturday (or whatever today is).
  // Let's pad the start so that day.getDay() matches the row index (0=Sun, 1=Mon...).
  
  const heatmapPadded = [];
  if (heatmapData.length > 0) {
    const firstDay = heatmapData[0].date.getDay();
    for (let i = 0; i < firstDay; i++) {
      heatmapPadded.push(null); // padding cells
    }
    heatmapPadded.push(...heatmapData);
  }

  for (let i = 0; i < heatmapPadded.length; i += 7) {
    weeks.push(heatmapPadded.slice(i, i + 7));
  }

  const weeksWithLabels = weeks.map((week, wIdx) => {
    const firstValidDay = week.find(d => d !== null);
    let monthLabel = '';
    if (firstValidDay) {
      const currentMonth = firstValidDay.date.getMonth();
      let prevMonth = null;
      if (wIdx > 0) {
        const prevWeekValid = weeks[wIdx-1].find(d => d !== null);
        if (prevWeekValid) prevMonth = prevWeekValid.date.getMonth();
      }
      if (wIdx === 0 || currentMonth !== prevMonth) {
        monthLabel = firstValidDay.date.toLocaleString('default', { month: 'short' });
      }
    }
    return {
      days: week,
      monthLabel
    };
  });

  return (
    <div className="page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 className="page-title" style={{ fontSize: '32px', color: '#0f172a', fontWeight: '800' }}>
          Activity & Streaks
        </h1>
        <p className="page-desc" style={{ color: '#64748b', fontSize: '15px', marginTop: '6px', lineHeight: '1.5' }}>
          Track your mock interview consistency and visualize your progress over the past year.
        </p>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center', background: '#ffffff', borderRadius: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', transition: 'transform 0.3s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', color: '#ef4444', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px', boxShadow: '0 4px 14px rgba(239,68,68,0.15)' }}>
            <i className="fa-solid fa-fire-flame-curved"></i>
          </div>
          <div style={{ fontSize: '38px', fontWeight: '900', background: 'linear-gradient(135deg, #ef4444, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: '1.2' }}>{currentStreak}</div>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '700', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Streak</div>
        </div>

        <div className="glass-card" style={{ padding: '24px', textAlign: 'center', background: '#ffffff', borderRadius: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', transition: 'transform 0.3s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', color: '#d97706', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px', boxShadow: '0 4px 14px rgba(217,119,6,0.15)' }}>
            <i className="fa-solid fa-trophy"></i>
          </div>
          <div style={{ fontSize: '38px', fontWeight: '900', background: 'linear-gradient(135deg, #d97706, #eab308)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: '1.2' }}>{longestStreak}</div>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '700', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Longest Streak</div>
        </div>

        <div className="glass-card" style={{ padding: '24px', textAlign: 'center', background: '#ffffff', borderRadius: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', transition: 'transform 0.3s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', color: '#0b4fcd', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px', boxShadow: '0 4px 14px rgba(11,79,205,0.15)' }}>
            <i className="fa-solid fa-chart-pie"></i>
          </div>
          <div style={{ fontSize: '38px', fontWeight: '900', background: 'linear-gradient(135deg, #0b4fcd, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: '1.2' }}>{totalSessions}</div>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '700', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sessions</div>
        </div>
      </div>

      <div className="glass-card" style={{ background: '#ffffff', borderRadius: '24px', padding: '30px' }}>
        <div className="flex-between" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-calendar-days" style={{ color: '#0b4fcd' }}></i>
            Activity Overview
          </h3>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', color: '#0f172a', cursor: 'pointer', outline: 'none', background: '#f8fafc' }}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex' }}>
          {/* Y-axis Day Labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '22px', marginRight: '8px', fontSize: '11px', color: '#94a3b8' }}>
            <div style={{ height: '14px' }}></div>
            <div style={{ height: '14px', lineHeight: '14px' }}>Mon</div>
            <div style={{ height: '14px' }}></div>
            <div style={{ height: '14px', lineHeight: '14px' }}>Wed</div>
            <div style={{ height: '14px' }}></div>
            <div style={{ height: '14px', lineHeight: '14px' }}>Fri</div>
            <div style={{ height: '14px' }}></div>
          </div>

          <div style={{ overflowX: 'auto', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '4px', minWidth: 'max-content' }}>
              {weeksWithLabels.map((weekData, wIdx) => (
                <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ height: '18px', fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {weekData.monthLabel}
                  </div>
                  {weekData.days.map((day, dIdx) => (
                    <div 
                      key={dIdx}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      style={{ 
                        width: '14px', 
                        height: '14px', 
                        backgroundColor: day ? day.color : 'transparent',
                        borderRadius: '4px',
                        cursor: day && !day.isFuture ? 'pointer' : 'default',
                        position: 'relative',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: hoveredDay === day && day && !day.isFuture ? 'scale(1.4)' : 'scale(1)',
                        zIndex: hoveredDay === day && day && !day.isFuture ? 10 : 1,
                        boxShadow: hoveredDay === day && day && !day.isFuture ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend and Tooltip area */}
        <div className="flex-between" style={{ marginTop: '16px', alignItems: 'center' }}>
          <div style={{ height: '32px', fontSize: '13px', color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center' }}>
            {hoveredDay && !hoveredDay.isFuture ? (
              <span style={{ background: '#0f172a', color: '#ffffff', padding: '6px 14px', borderRadius: '20px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }}>
                <i className="fa-solid fa-calendar-check" style={{ color: hoveredDay.count > 0 ? '#40c463' : '#94a3b8' }}></i>
                <span><strong>{hoveredDay.count}</strong> {hoveredDay.count === 1 ? 'session' : 'sessions'} on {hoveredDay.date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </span>
            ) : (
              <span style={{ padding: '6px 14px', color: '#94a3b8', fontStyle: 'italic' }}>Hover over a valid square to see activity details.</span>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
            <span>Less</span>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#ebedf0', borderRadius: '2px' }}></div>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#9be9a8', borderRadius: '2px' }}></div>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#40c463', borderRadius: '2px' }}></div>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#30a14e', borderRadius: '2px' }}></div>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#216e39', borderRadius: '2px' }}></div>
            <span>More</span>
          </div>
        </div>

      </div>
    </div>
  );
}
