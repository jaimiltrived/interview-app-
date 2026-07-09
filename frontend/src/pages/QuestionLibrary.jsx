import React, { useState, useEffect } from 'react';

export default function QuestionLibrary({ userProfile, startInterviewWithQuestions }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
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
  const [newDuration, setNewDuration] = useState('15 mins');
  const [newLevel, setNewLevel] = useState('Medium');

  const topics = ['All Topics', 'Technical', 'Behavioral', 'Leadership', 'Case Study'];

  // Dynamically load tailored questions using Qwen 2.5 on mount
  useEffect(() => {
    const generateCustomLibrary = async () => {
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
    return matchesSearch && matchesTopic;
  });

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
      duration: newDuration,
      title: newTitle,
      level: newLevel,
      levelColor: levelColor
    };

    setQuestions([newQ, ...questions]);
    setNewTitle('');
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

      {/* Topics Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
        {topics.map((topic) => {
          const isActive = selectedTopic === topic;
          return (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              style={{
                padding: '10px 20px',
                borderRadius: '30px',
                border: isActive ? 'none' : '1px solid #e2e8f0',
                background: isActive ? '#0b4fcd' : '#ffffff',
                color: isActive ? '#ffffff' : '#64748b',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 12px rgba(11, 79, 205, 0.25)' : 'none'
              }}
            >
              {topic}
            </button>
          );
        })}
      </div>

      {/* Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredQuestions.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
            No questions found matching your criteria.
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              onClick={() => startPractice(q.title)}
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
                <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <i className="fa-regular fa-clock" style={{ fontSize: '13px' }}></i> {q.duration}
                </span>
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
                    backgroundColor: '#eff6ff',
                    border: 'none',
                    color: '#0b4fcd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    startPractice(q.title);
                  }}
                >
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Bar */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '30px' }}>
        <button style={{ width: '36px', height: '36px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#ffffff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-solid fa-chevron-left" style={{ fontSize: '11px' }}></i>
        </button>
        <button style={{ width: '36px', height: '36px', border: 'none', borderRadius: '10px', background: '#0b4fcd', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}>1</button>
        <button style={{ width: '36px', height: '36px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#ffffff', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>2</button>
        <button style={{ width: '36px', height: '36px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#ffffff', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>3</button>
        <span style={{ color: '#94a3b8', padding: '0 4px' }}>...</span>
        <button style={{ width: '36px', height: '36px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#ffffff', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>12</button>
        <button style={{ width: '36px', height: '36px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#ffffff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px' }}></i>
        </button>
      </div>

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
                <label className="detail-label" style={{ marginBottom: '6px', display: 'block' }}>Duration</label>
                <input
                  type="text"
                  required
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  placeholder="e.g. 15 mins"
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', color: '#0f172a', fontSize: '13.5px' }}
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
    </div>
  );
}
