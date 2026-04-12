import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  BookOpen, 
  Target, 
  TrendingUp,
  Clock,
  Award,
  Star,
  LogOut,
  User,
  Lock,
  Flame
} from 'lucide-react';

// --- Types ---
type Subject = 'Physics' | 'Chemistry' | 'Mathematics';

interface Chapter {
  id: string;
  name: string;
  subject: Subject;
  weightage: number; // 1 to 10 scale based on historical JEE importance
  difficulty: number; // 1 to 5 scale
  completed: boolean;
}

// --- Initial Data (Based on JEE Syllabus PDF) ---
const INITIAL_CHAPTERS: Chapter[] = [
  // Physics
  { id: 'p1', name: 'Mechanics (Kinematics, Laws of Motion, Work/Energy)', subject: 'Physics', weightage: 9, difficulty: 4, completed: false },
  { id: 'p2', name: 'Rotational Dynamics & Rigid Body', subject: 'Physics', weightage: 8, difficulty: 5, completed: false },
  { id: 'p3', name: 'Gravitation & Properties of Matter', subject: 'Physics', weightage: 6, difficulty: 3, completed: false },
  { id: 'p4', name: 'Thermal Physics (Thermodynamics, Heat Transfer)', subject: 'Physics', weightage: 7, difficulty: 3, completed: false },
  { id: 'p5', name: 'Electricity and Magnetism (Electrostatics, Current)', subject: 'Physics', weightage: 10, difficulty: 4, completed: false },
  { id: 'p6', name: 'Electromagnetic Induction & AC', subject: 'Physics', weightage: 8, difficulty: 4, completed: false },
  { id: 'p7', name: 'Optics (Ray & Wave Optics)', subject: 'Physics', weightage: 8, difficulty: 3, completed: false },
  { id: 'p8', name: 'Modern Physics (Dual Nature, Atoms, Nuclei)', subject: 'Physics', weightage: 9, difficulty: 2, completed: false },
  
  // Chemistry
  { id: 'c1', name: 'Atomic Structure & Chemical Bonding', subject: 'Chemistry', weightage: 8, difficulty: 3, completed: false },
  { id: 'c2', name: 'Chemical & Ionic Equilibrium', subject: 'Chemistry', weightage: 8, difficulty: 5, completed: false },
  { id: 'c3', name: 'Electrochemistry & Kinetics', subject: 'Chemistry', weightage: 9, difficulty: 4, completed: false },
  { id: 'c4', name: 'Coordination Compounds', subject: 'Chemistry', weightage: 9, difficulty: 4, completed: false },
  { id: 'c5', name: 'p-Block, d-Block & f-Block Elements', subject: 'Chemistry', weightage: 8, difficulty: 4, completed: false },
  { id: 'c6', name: 'General Organic Chemistry (GOC) & Isomerism', subject: 'Chemistry', weightage: 9, difficulty: 5, completed: false },
  { id: 'c7', name: 'Aldehydes, Ketones & Carboxylic Acids', subject: 'Chemistry', weightage: 10, difficulty: 4, completed: false },
  { id: 'c8', name: 'Alcohols, Phenols, Ethers & Amines', subject: 'Chemistry', weightage: 8, difficulty: 3, completed: false },

  // Mathematics
  { id: 'm1', name: 'Functions, Sets & Relations', subject: 'Mathematics', weightage: 6, difficulty: 3, completed: false },
  { id: 'm2', name: 'Complex Numbers & Quadratic Equations', subject: 'Mathematics', weightage: 7, difficulty: 4, completed: false },
  { id: 'm3', name: 'Matrices & Determinants', subject: 'Mathematics', weightage: 8, difficulty: 2, completed: false },
  { id: 'm4', name: 'Probability & Statistics', subject: 'Mathematics', weightage: 8, difficulty: 4, completed: false },
  { id: 'm5', name: 'Coordinate Geometry (Conic Sections)', subject: 'Mathematics', weightage: 9, difficulty: 4, completed: false },
  { id: 'm6', name: 'Differential Calculus (Limits, Continuity, AOD)', subject: 'Mathematics', weightage: 10, difficulty: 5, completed: false },
  { id: 'm7', name: 'Integral Calculus (Definite, Indefinite, Area)', subject: 'Mathematics', weightage: 9, difficulty: 5, completed: false },
  { id: 'm8', name: 'Vectors & 3D Geometry', subject: 'Mathematics', weightage: 9, difficulty: 3, completed: false },
];

export default function App() {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- App State ---
  const [chapters, setChapters] = useState<Chapter[]>(INITIAL_CHAPTERS);
  const [activeTab, setActiveTab] = useState<'plan' | 'syllabus'>('plan');
  const [dailyPlan, setDailyPlan] = useState<{date: string, chapterIds: string[]}>({ date: '', chapterIds: [] });
  const [streak, setStreak] = useState<{count: number, lastActivityDate: string}>({ count: 0, lastActivityDate: '' });

  // --- Persistence Effects ---
  
  // 1. Check for existing session on mount
  useEffect(() => {
    const session = localStorage.getItem('jee_current_session');
    if (session) {
      setCurrentUser(session);
      loadUserData(session);
    }
  }, []);

  // 2. Save user data whenever chapters change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`jee_data_${currentUser}`, JSON.stringify({ chapters, dailyPlan, streak }));
    }
  }, [chapters, dailyPlan, streak, currentUser]);

  const loadUserData = (user: string) => {
    const data = localStorage.getItem(`jee_data_${user}`);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          setChapters(parsed);
          setDailyPlan({ date: '', chapterIds: [] });
          setStreak({ count: 0, lastActivityDate: '' });
        } else {
          setChapters(parsed.chapters || INITIAL_CHAPTERS);
          setDailyPlan(parsed.dailyPlan || { date: '', chapterIds: [] });
          setStreak(parsed.streak || { count: 0, lastActivityDate: '' });
        }
      } catch (e) {
        setChapters(INITIAL_CHAPTERS);
      }
    } else {
      setChapters(INITIAL_CHAPTERS);
      setDailyPlan({ date: '', chapterIds: [] });
      setStreak({ count: 0, lastActivityDate: '' });
    }
  };

  // --- Auth Handlers ---
  const handleAuth = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (!username.trim() || !password.trim()) {
      setAuthError('Please enter both username and password.');
      return;
    }

    const usersStr = localStorage.getItem('jee_users');
    const users = usersStr ? JSON.parse(usersStr) : {};

    if (authMode === 'register') {
      if (users[username]) {
        setAuthError('Username already exists. Please log in.');
        return;
      }
      users[username] = password;
      localStorage.setItem('jee_users', JSON.stringify(users));
      loginUser(username);
    } else {
      if (users[username] !== password) {
        setAuthError('Invalid username or password.');
        return;
      }
      loginUser(username);
    }
  }, [username, password, authMode]);

  const loginUser = useCallback((user: string) => {
    setCurrentUser(user);
    localStorage.setItem('jee_current_session', user);
    loadUserData(user);
    setUsername('');
    setPassword('');
    setAuthError('');
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('jee_current_session');
    setChapters(INITIAL_CHAPTERS); // Reset to default state for next user
    setDailyPlan({ date: '', chapterIds: [] });
    setStreak({ count: 0, lastActivityDate: '' });
  }, []);

  // --- Dates ---
  const todayDateObj = new Date();
  const todayStr = todayDateObj.toISOString().split('T')[0];
  const targetDate = new Date('2026-05-03');
  const examDate = new Date('2026-05-17');

  const daysToTarget = Math.ceil((targetDate.getTime() - todayDateObj.getTime()) / (1000 * 3600 * 24));
  const daysToExam = Math.ceil((examDate.getTime() - todayDateObj.getTime()) / (1000 * 3600 * 24));

  // --- Derived State & Logic ---

  // 1. Identify the Top 20 Most Important Chapters overall
  const top20Chapters = useMemo(() => {
    return [...chapters]
      .sort((a, b) => b.weightage - a.weightage)
      .slice(0, 20);
  }, [chapters]);

  const top20CompletedCount = top20Chapters.filter(c => c.completed).length;

  // 2. Generate Daily Plan (Locks for the day, strictly capped at 10)
  useEffect(() => {
    if (!currentUser) return;
    
    if (dailyPlan.date !== todayStr) {
      const pending = chapters
        .filter(c => !c.completed)
        .sort((a, b) => {
          const scoreA = a.weightage * a.difficulty;
          const scoreB = b.weightage * b.difficulty;
          return scoreB - scoreA;
        });

      const planIds: string[] = [];
      let currentLoad = 0;
      const MAX_LOAD = 10; // Strictly cap at 10

      const subjects: Subject[] = ['Physics', 'Chemistry', 'Mathematics'];
      const remaining = [...pending];

      for (const sub of subjects) {
        const idx = remaining.findIndex(c => c.subject === sub);
        if (idx !== -1) {
          const ch = remaining[idx];
          if (currentLoad + ch.difficulty <= MAX_LOAD || planIds.length === 0) {
            planIds.push(ch.id);
            currentLoad += ch.difficulty;
            remaining.splice(idx, 1);
          }
        }
      }

      while (remaining.length > 0) {
        const ch = remaining[0];
        if (currentLoad + ch.difficulty <= MAX_LOAD) {
          planIds.push(ch.id);
          currentLoad += ch.difficulty;
        }
        remaining.shift();
      }

      setDailyPlan({ date: todayStr, chapterIds: planIds });
    }
  }, [currentUser, chapters, dailyPlan.date, todayStr]);

  const todaysPlanChapters = useMemo(() => {
    return dailyPlan.chapterIds
      .map(id => chapters.find(c => c.id === id))
      .filter(Boolean) as Chapter[];
  }, [dailyPlan.chapterIds, chapters]);

  const currentPlanLoad = todaysPlanChapters.reduce((acc, c) => acc + c.difficulty, 0);

  // Overall Progress
  const totalCompleted = chapters.filter(c => c.completed).length;
  const overallProgress = Math.round((totalCompleted / chapters.length) * 100);

  // --- Handlers ---
  const toggleChapter = useCallback((id: string) => {
    setChapters(prev => {
      const newChapters = prev.map(c => 
        c.id === id ? { ...c, completed: !c.completed } : c
      );
      
      const chapter = prev.find(c => c.id === id);
      if (chapter && !chapter.completed) {
        // Marking as completed
        setStreak(prevStreak => {
          if (prevStreak.lastActivityDate === todayStr) {
            return prevStreak;
          }
          
          const yesterday = new Date(todayDateObj);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (prevStreak.lastActivityDate === yesterdayStr) {
            return { count: prevStreak.count + 1, lastActivityDate: todayStr };
          } else {
            return { count: 1, lastActivityDate: todayStr };
          }
        });
      }
      
      return newChapters;
    });
  }, [todayStr, todayDateObj]);

  const setChapterDifficulty = useCallback((id: string, difficulty: number) => {
    setChapters(prev => prev.map(c => 
      c.id === id ? { ...c, difficulty } : c
    ));
  }, []);

  // --- Render Helpers ---
  const getSubjectColor = (subject: Subject) => {
    switch (subject) {
      case 'Physics': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Chemistry': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Mathematics': return 'text-purple-600 bg-purple-50 border-purple-200';
    }
  };

  // --- Auth Screen ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
              <Target className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">JEE Smart Planner</h1>
          <p className="text-slate-500 text-center mb-8">
            {authMode === 'login' ? 'Welcome back! Log in to continue.' : 'Create an account to save your progress.'}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {authError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium text-center">
                {authError}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2"
            >
              {authMode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError('');
              }}
              className="text-indigo-600 font-semibold hover:underline"
            >
              {authMode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main App Screen ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600 shrink-0" />
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">JEE Smart Planner</h1>
          </div>
          <div className="flex gap-2 sm:gap-4 text-sm font-medium items-center">
            {streak.count > 0 && (
              <div className="hidden md:flex items-center gap-1.5 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
                <Flame className="w-4 h-4" />
                <span>{streak.count} Day Streak</span>
              </div>
            )}
            <div className="hidden md:flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
              <Clock className="w-4 h-4" />
              <span>{daysToTarget} days to Target</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
              <Calendar className="w-4 h-4" />
              <span>{daysToExam} days to Exam</span>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>
            <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-2 sm:px-3 py-1.5 rounded-full max-w-[120px] sm:max-w-none">
              <User className="w-4 h-4 shrink-0" />
              <span className="font-semibold truncate">{currentUser}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Stats Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap gap-2 justify-center text-xs font-medium">
        {streak.count > 0 && (
          <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
            <Flame className="w-3.5 h-3.5" />
            <span>{streak.count} Day Streak</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          <span>{daysToTarget}d to Target</span>
        </div>
        <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
          <Calendar className="w-3.5 h-3.5" />
          <span>{daysToExam}d to Exam</span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 bg-slate-200/50 p-1 rounded-xl w-full sm:w-fit mb-8">
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex-1 px-6 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'plan' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Plan & Progress
          </button>
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`flex-1 px-6 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'syllabus' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Syllabus Tracker
          </button>
        </div>

        {activeTab === 'plan' && (
          <div className="space-y-8">
            {/* Top 20 Goal Tracker */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500 shrink-0" />
                    Target: Top 20 Chapters by May 3rd
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Focusing on the highest weightage chapters first to maximize your score.
                  </p>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto flex justify-between sm:block items-end">
                  <span className="text-3xl font-black text-indigo-600">{top20CompletedCount}</span>
                  <span className="text-slate-500 font-medium"> / 20</span>
                </div>
              </div>
              
              <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(top20CompletedCount / 20) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 font-medium text-right">
                {20 - top20CompletedCount} chapters remaining • {daysToTarget} days left
              </p>
            </section>

            {/* Today's Plan */}
            <section>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-slate-700 shrink-0" />
                  Today's Lessons
                </h2>
                <span className="text-sm font-medium text-slate-500 bg-slate-200/50 px-3 py-1.5 rounded-full w-full sm:w-auto text-center">
                  Goal: {todaysPlanChapters.length} Lessons (Load: {currentPlanLoad}/10)
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {todaysPlanChapters.length > 0 ? todaysPlanChapters.map(chapter => {
                  const colors = getSubjectColor(chapter.subject);
                  
                  return (
                    <div key={chapter.id} className={`rounded-2xl p-5 border ${colors} relative overflow-hidden flex flex-col ${chapter.completed ? 'opacity-60' : ''}`}>
                      <div className="text-xs font-bold uppercase tracking-wider mb-3 opacity-80">
                        {chapter.subject}
                      </div>
                      
                      <h3 className={`font-semibold text-lg mb-2 leading-tight ${chapter.completed ? 'line-through' : ''}`}>
                        {chapter.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-6 flex-wrap">
                        <span className="bg-white/60 px-2 py-1 rounded text-xs font-bold">
                          Weight: {chapter.weightage}/10
                        </span>
                        <span className="bg-white/60 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                          Diff: {chapter.difficulty}/5 <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                        </span>
                        {top20Chapters.find(c => c.id === chapter.id) && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                            <Award className="w-3 h-3" /> Top 20
                          </span>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => toggleChapter(chapter.id)}
                        className={`mt-auto w-full font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm ${
                          chapter.completed 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                            : 'bg-white/80 hover:bg-white text-slate-900'
                        }`}
                      >
                        {chapter.completed ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4 text-slate-400" />
                            Mark Complete
                          </>
                        )}
                      </button>
                    </div>
                  );
                }) : (
                  <div className="col-span-3 text-center py-12 bg-white rounded-2xl border border-slate-200">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
                    <p className="text-lg font-medium text-slate-700">All caught up!</p>
                    <p className="text-slate-500">You've completed the entire syllabus.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Overall Progress */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Overall Syllabus Progress
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${overallProgress}%` }}
                    ></div>
                  </div>
                </div>
                <span className="font-bold text-slate-700 w-12 text-right">{overallProgress}%</span>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'syllabus' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold">Full Syllabus Tracker</h2>
              <p className="text-sm text-slate-500 mt-1">Update your progress and chapter difficulty here to adjust your daily plan automatically.</p>
            </div>
            
            <div className="divide-y divide-slate-100">
              {(['Physics', 'Chemistry', 'Mathematics'] as Subject[]).map(subject => (
                <div key={subject} className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      subject === 'Physics' ? 'bg-blue-500' : 
                      subject === 'Chemistry' ? 'bg-emerald-500' : 'bg-purple-500'
                    }`} />
                    {subject}
                  </h3>
                  
                  <div className="space-y-3">
                    {chapters
                      .filter(c => c.subject === subject)
                      .sort((a, b) => b.weightage - a.weightage) // Sort by weightage
                      .map(chapter => {
                        const isTop20 = top20Chapters.some(t => t.id === chapter.id);
                        return (
                          <div 
                            key={chapter.id}
                            onClick={() => toggleChapter(chapter.id)}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                              chapter.completed 
                                ? 'bg-slate-50 border-slate-200 opacity-60' 
                                : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start sm:items-center gap-3 mb-3 sm:mb-0">
                              {chapter.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5 sm:mt-0" />
                              )}
                              <div>
                                <p className={`font-medium ${chapter.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                  {chapter.name}
                                </p>
                                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                                  <span className="text-xs font-medium text-slate-500">
                                    Weightage: {chapter.weightage}/10
                                  </span>
                                  {isTop20 && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded">
                                      Top 20
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Difficulty Selector */}
                            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto mt-3 sm:mt-0 pl-8 sm:pl-0 gap-1" onClick={e => e.stopPropagation()}>
                              <span className="text-xs font-medium text-slate-500 mr-1">Difficulty:</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    onClick={() => setChapterDifficulty(chapter.id, star)}
                                    className={`p-1 transition-colors rounded-full hover:bg-slate-100 ${
                                      chapter.difficulty >= star ? 'text-orange-400' : 'text-slate-200 hover:text-orange-300'
                                    }`}
                                  >
                                    <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${chapter.difficulty >= star ? 'fill-current' : ''}`} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
