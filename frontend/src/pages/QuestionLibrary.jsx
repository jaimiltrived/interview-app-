import React, { useState, useEffect } from 'react';

// Reference guide data compiler based on category & title
const getReferenceGuide = (q) => {
  const category = q.category?.toUpperCase() || 'TECHNICAL';
  if (category === 'BEHAVIORAL') {
    return {
      strategy: 'STAR Method (Situation, Task, Action, Result)',
      points: [
        'Briefly outline the context/challenge you faced.',
        'Define your responsibility and the goal you set.',
        'Describe the exact actions you took to resolve it.',
        'Highlight the quantifiable positive outcome and your learnings.'
      ],
      sample: 'e.g. "In my previous project, we faced a tight deadline. I aligned the team by introducing daily check-ins, resulting in delivering the feature 2 days early."'
    };
  } else if (category === 'TECHNICAL') {
    return {
      strategy: 'Structure: Define -> Explain Mechanics -> Give Tradeoffs/Use Case',
      points: [
        'Clearly define the technology, pattern, or concept.',
        'Explain the core mechanism (how it executes, memory footprint, etc.).',
        'Mention alternatives and when to choose this approach over others.',
        'Cite a real-world scenario where you implemented it.'
      ],
      sample: 'e.g. "Explain the event loop model, callbacks queue, microtasks vs macrotasks, and how promises mitigate callback hell."'
    };
  } else if (category === 'CASE STUDY') {
    return {
      strategy: 'High-Level Design -> Low-Level Components -> Scalability Bottlenecks',
      points: [
        'Define the requirements, scale (QPS), and data constraints.',
        'Sketch the overall block architecture (API Gateway, services, database).',
        'Deep dive into specific components (e.g. indexing, caching, queues).',
        'Discuss replication, load balancing, sharding, and latency optimization.'
      ],
      sample: 'e.g. "Use WebSockets for real-time updates, Redis geospatial indexes for location tracking, and horizontal database sharding."'
    };
  } else {
    return {
      strategy: 'People-First Leadership & Collaborative Problem Solving',
      points: [
        'Emphasize empathy, active listening, and open communication channels.',
        'Describe how you align individual motivations with team business objectives.',
        'Provide clear, measurable performance indicators (KPIs) and continuous feedback.',
        'Detail your approach to mentoring and conflict resolution frameworks.'
      ],
      sample: 'e.g. "Focus on constructive coaching, setting clear timelines, and checking in weekly to support progress."'
    };
  }
};

export default function QuestionLibrary({ userProfile, startInterviewWithQuestions }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [expandedId, setExpandedId] = useState(null); // Accordion state for references
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([
    {
      id: 'q1',
      category: 'TECHNICAL',
      duration: '15 mins',
      title: 'Explain how asynchronous programming works in JavaScript.',
      level: 'Medium',
      levelColor: '#16a34a'
    },
    {
      id: 'q2',
      category: 'BEHAVIORAL',
      duration: '10 mins',
      title: 'Tell me about a time you had a conflict with a teammate.',
      level: 'Easy',
      levelColor: '#2563eb'
    },
    {
      id: 'q3',
      category: 'LEADERSHIP',
      duration: '10 mins',
      title: 'How do you handle underperforming team members in a fast-paced environment?',
      level: 'Hard',
      levelColor: '#dc2626'
    },
    {
      id: 'q4',
      category: 'CASE STUDY',
      duration: '45 mins',
      title: 'Design a scalable ride-sharing system architecture for a global market.',
      level: 'Hard',
      levelColor: '#dc2626'
    },
    {
      id: 'q5',
      category: 'TECHNICAL',
      duration: '12 mins',
      title: 'Describe the differences between REST and GraphQL in depth.',
      level: 'Medium',
      levelColor: '#16a34a'
    },
    {
      id: 'q6',
      category: 'BEHAVIORAL',
      duration: '8 mins',
      title: 'What is your greatest professional achievement and why?',
      level: 'Easy',
      levelColor: '#2563eb'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('TECHNICAL');
  const [newAnswer, setNewAnswer] = useState('');
  const [newLevel, setNewLevel] = useState('Medium');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTopic, selectedLevel]);

  const topics = ['All Topics', 'Technical', 'Behavioral', 'Leadership', 'Case Study'];
  const levels = ['All Levels', 'Easy', 'Medium', 'Hard'];

  // Dynamically load tailored questions using Qwen 2.5 on mount
  useEffect(() => {
    const generateCustomLibrary = async () => {
      // 1. Check local cache first to prevent load times on subsequent page loads
      try {
        const cachedQ = localStorage.getItem('coach_cached_library_questions');
        const cachedRole = localStorage.getItem('coach_cached_library_role');
        const cachedSkills = localStorage.getItem('coach_cached_library_skills');

        const currentRole = userProfile.role || 'Software Engineer';
        const currentSkills = JSON.stringify(userProfile.skills || []);

        if (cachedQ && cachedRole === currentRole && cachedSkills === currentSkills) {
          const parsed = JSON.parse(cachedQ);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQuestions(parsed);
            return;
          }
        }
      } catch (e) {
        console.warn('Cache error:', e);
      }

      setLoading(true);
      try {
        const token = localStorage.getItem('coach_jwt_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch('/api/interview/generate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: userProfile.name,
            roleTarget: userProfile.role || 'Software Engineer',
            skills: userProfile.skills || []
          })
        });

        const data = await res.json();
        if (data.success && data.questions) {
          const flatList = [];
          let idx = 1;
          
          if (data.questions.hr) {
            data.questions.hr.forEach(q => {
              flatList.push({
                id: `gen_hr_${idx++}`,
                category: 'BEHAVIORAL',
                duration: '10 mins',
                title: q,
                level: 'Easy',
                levelColor: '#2563eb'
              });
            });
          }
          if (data.questions.technical) {
            data.questions.technical.forEach(q => {
              flatList.push({
                id: `gen_tech_${idx++}`,
                category: 'TECHNICAL',
                duration: '15 mins',
                title: q,
                level: 'Medium',
                levelColor: '#16a34a'
              });
            });
          }
          if (data.questions.project) {
            data.questions.project.forEach(q => {
              flatList.push({
                id: `gen_proj_${idx++}`,
                category: 'CASE STUDY',
                duration: '20 mins',
                title: q,
                level: 'Hard',
                levelColor: '#dc2626'
              });
            });
          }
          if (data.questions.behavioral) {
            data.questions.behavioral.forEach(q => {
              flatList.push({
                id: `gen_beh_${idx++}`,
                category: 'LEADERSHIP',
                duration: '12 mins',
                title: q,
                level: 'Medium',
                levelColor: '#16a34a'
              });
            });
          }

          if (flatList.length > 0) {
            setQuestions(flatList);
            // Save to cache
            try {
              localStorage.setItem('coach_cached_library_questions', JSON.stringify(flatList));
              localStorage.setItem('coach_cached_library_role', userProfile.role || 'Software Engineer');
              localStorage.setItem('coach_cached_library_skills', JSON.stringify(userProfile.skills || []));
            } catch (cacheErr) {
              console.warn('Failed to save to local cache:', cacheErr);
            }
          }
        }
      } catch (err) {
        console.warn('Could not generate dynamic questions, using presets:', err);
      } finally {
        setLoading(false);
      }
    };

    generateCustomLibrary();
  }, [userProfile.role, userProfile.skills]);

  // Handle filtering
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === 'All Topics' || 
                         q.category.toLowerCase() === selectedTopic.toLowerCase();
    const matchesLevel = selectedLevel === 'All Levels' || 
                         (q.level && q.level.toLowerCase() === selectedLevel.toLowerCase());
    return matchesSearch && matchesTopic && matchesLevel;
  });

  const totalItems = filteredQuestions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  
  const indexOfLastItem = activePage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstItem, indexOfLastItem);

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'TECHNICAL': return 'tag-technical';
      case 'BEHAVIORAL': return 'tag-behavioral';
      case 'LEADERSHIP': return 'tag-leadership';
      case 'CASE STUDY': return 'tag-casestudy';
      default: return '';
    }
  };

  const handleAddQuestionSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let levelColor = '#16a34a'; // Green for Medium
    if (newLevel === 'Easy') levelColor = '#2563eb'; // Blue
    if (newLevel === 'Hard') levelColor = '#dc2626'; // Red

    const newQ = {
      id: 'q_' + Date.now(),
      category: newCategory.toUpperCase(),
      title: newTitle,
      level: newLevel,
      levelColor: levelColor,
      answer: newAnswer
    };

    const updatedQuestions = [newQ, ...questions];
    setQuestions(updatedQuestions);
    try {
      localStorage.setItem('coach_cached_library_questions', JSON.stringify(updatedQuestions));
      localStorage.setItem('coach_cached_library_role', userProfile.role || 'Software Engineer');
      localStorage.setItem('coach_cached_library_skills', JSON.stringify(userProfile.skills || []));
    } catch (cacheErr) {
      console.warn('Failed to save to local cache:', cacheErr);
    }

    setNewTitle('');
    setNewAnswer('');
    setShowAddModal(false);
  };

  const startPractice = (questionText) => {
    startInterviewWithQuestions([questionText]);
  };

  if (loading) {
    return (
      <div className="page text-center" style={{ padding: '60px' }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '48px', color: '#0b4fcd', marginBottom: '20px' }}></i>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: '800' }}>Customizing Your Question Library...</h2>
        <p style={{ color: '#64748b', fontSize: '14.5px', marginTop: '8px' }}>Using local model qwen2.5:0.5b to compile expert interview questions.</p>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: '40px' }}>
      {/* Title */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1 className="page-title" style={{ fontSize: '36px', color: '#0f172a', fontWeight: '800' }}>Question Library</h1>
        <p className="page-desc" style={{ color: '#64748b' }}>Master curated interview questions compiled specifically for your profile.</p>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '16px' }}></i>
        <input
          type="text"
          placeholder="Search questions, keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '16px 16px 16px 48px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            fontSize: '15px',
            fontWeight: '500',
            outline: 'none',
            boxShadow: '0 2px 10px rgba(0,0,0,0.01)',
            background: '#ffffff',
            color: '#0f172a'
          }}
        />
      </div>

      {/* Dropdown Filters Row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {/* Topic Dropdown */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <i className="fa-solid fa-filter" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#0b4fcd', fontSize: '14px' }}></i>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 40px 14px 44px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              fontWeight: '700',
              color: '#334155',
              backgroundColor: '#ffffff',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              boxShadow: '0 2px 10px rgba(0,0,0,0.01)'
            }}
          >
            {topics.map(t => (
              <option key={t} value={t}>{t === 'All Topics' ? 'All Topics' : `${t} Questions`}</option>
            ))}
          </select>
          <i className="fa-solid fa-chevron-down" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px', pointerEvents: 'none' }}></i>
        </div>

        {/* Level Dropdown */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <i className="fa-solid fa-signal" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', fontSize: '14px' }}></i>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 40px 14px 44px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              fontWeight: '700',
              color: '#334155',
              backgroundColor: '#ffffff',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              boxShadow: '0 2px 10px rgba(0,0,0,0.01)'
            }}
          >
            {levels.map(l => (
              <option key={l} value={l}>{l === 'All Levels' ? 'All Difficulty Levels' : `${l} Difficulty`}</option>
            ))}
          </select>
          <i className="fa-solid fa-chevron-down" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px', pointerEvents: 'none' }}></i>
        </div>
      </div>

      {/* Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {currentQuestions.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
            No questions found matching your criteria.
          </div>
        ) : (
          currentQuestions.map((q) => {
            const isExpanded = expandedId === q.id;
            return (
              <div
                key={q.id}
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '24px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span className={`badge ${getCategoryBadgeClass(q.category)}`}>
                    {q.category}
                  </span>
                  {q.duration && (
                    <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                      <i className="fa-regular fa-clock" style={{ fontSize: '13px' }}></i> {q.duration}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '20px', color: '#0f172a', fontWeight: '800', lineHeight: '1.4', marginBottom: '24px', paddingRight: '40px' }}>
                  {q.title}
                </h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', fontWeight: '700' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: q.levelColor, display: 'inline-block' }}></span>
                    {q.level}
                  </span>

                  <button
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: isExpanded ? '#eff6ff' : '#f1f5f9',
                      border: 'none',
                      color: isExpanded ? '#0b4fcd' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(isExpanded ? null : q.id);
                    }}
                  >
                    <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                  </button>
                </div>

                {isExpanded && (
                  <div 
                    style={{ 
                      marginTop: '20px', 
                      padding: '20px', 
                      borderRadius: '16px', 
                      background: '#f8fafc', 
                      border: '1px solid #e2e8f0',
                      fontSize: '13.5px',
                      lineHeight: '1.6',
                      color: '#334155',
                      animation: 'slideDown 0.25s ease-out'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <i className="fa-solid fa-book" style={{ color: '#0b4fcd', fontSize: '14px' }}></i>
                      <strong style={{ color: '#0f172a', fontSize: '14.5px', fontFamily: 'Outfit' }}>
                        {q.answer ? 'Expected Answer / Reference Guide' : 'Interviewer Reference Guide'}
                      </strong>
                    </div>
                    
                    {q.answer ? (
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Expected Answer</span>
                        <span style={{ color: '#0f172a', fontWeight: '500', whiteSpace: 'pre-wrap', display: 'block' }}>{q.answer}</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Recommended Strategy</span>
                          <span style={{ color: '#0f172a', fontWeight: '600' }}>{getReferenceGuide(q).strategy}</span>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Key Focus Points</span>
                          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {getReferenceGuide(q).points.map((pt, idx) => (
                              <li key={idx}>{pt}</li>
                            ))}
                          </ul>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Sample Response Lead</span>
                          <span style={{ fontStyle: 'italic', color: '#475569' }}>{getReferenceGuide(q).sample}</span>
                        </div>
                      </>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '30px' }}>
          <button 
            disabled={activePage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            style={{ width: '36px', height: '36px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#ffffff', color: activePage === 1 ? '#cbd5e1' : '#64748b', cursor: activePage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className="fa-solid fa-chevron-left" style={{ fontSize: '11px' }}></i>
          </button>
          
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => {
            const isActive = activePage === pg;
            return (
              <button
                key={pg}
                onClick={() => setCurrentPage(pg)}
                style={{
                  width: '36px',
                  height: '36px',
                  border: isActive ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  background: isActive ? '#0b4fcd' : '#ffffff',
                  color: isActive ? '#ffffff' : '#64748b',
                  fontWeight: isActive ? '700' : '600',
                  cursor: 'pointer'
                }}
              >
                {pg}
              </button>
            );
          })}
          
          <button 
            disabled={activePage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            style={{ width: '36px', height: '36px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#ffffff', color: activePage === totalPages ? '#cbd5e1' : '#64748b', cursor: activePage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px' }}></i>
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#0b4fcd',
          border: 'none',
          color: '#ffffff',
          fontSize: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(11, 79, 205, 0.4)',
          zIndex: 98,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <i className="fa-solid fa-plus"></i>
      </button>

      {/* Add Custom Question Modal */}
      {showAddModal && (
        <div className="setup-overlay" style={{ display: 'flex', zIndex: 999 }}>
          <div className="glass-card setup-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '30px', maxWidth: '450px', width: '100%' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '10px', color: '#0f172a' }}>Add Custom Question</h2>
            <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>Create a personalized interview question for practice.</p>
            <form onSubmit={handleAddQuestionSubmit} style={{ textALign: 'left', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label className="detail-label" style={{ marginBottom: '6px', display: 'block' }}>Question Title</label>
                <textarea
                  required
                  rows="3"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Explain how virtual DOM reconciliation works in React."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    outline: 'none',
                    fontSize: '14px',
                    color: '#0f172a',
                    fontFamily: 'inherit',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="detail-label" style={{ marginBottom: '6px', display: 'block' }}>Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                  >
                    <option value="TECHNICAL">Technical</option>
                    <option value="BEHAVIORAL">Behavioral</option>
                    <option value="LEADERSHIP">Leadership</option>
                    <option value="CASE STUDY">Case Study</option>
                  </select>
                </div>

                <div>
                  <label className="detail-label" style={{ marginBottom: '6px', display: 'block' }}>Difficulty</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="detail-label" style={{ marginBottom: '6px', display: 'block' }}>Expected Answer</label>
                <textarea
                  required
                  rows="4"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Provide the key answer points or sample response..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    outline: 'none',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    fontFamily: 'inherit',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flexGrow: 1 }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flexGrow: 1 }}
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Keyframe Animations */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
