import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
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
  Flame,
  Play,
  Pause,
  RotateCcw,
  BarChart,
  Activity,
  AlertCircle,
  Zap,
  Trash2,
  Settings,
  Maximize,
  Minimize
} from 'lucide-react';
import { SyllabusHeatmap, HeatmapChapter } from './components/SyllabusHeatmap';
import { useDecayTimer } from './lib/decay';
import { FlipClock } from './components/FlipClock';

// --- Components ---
const DecayTimerDisplay = ({ lastRevisionDate, confidenceScore }: { lastRevisionDate: string, confidenceScore: number }) => {
  const countdown = useDecayTimer(lastRevisionDate, confidenceScore);
  const isDecayed = countdown === 'Decayed';
  
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
      isDecayed 
        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    }`}>
      {countdown}
    </span>
  );
};

// --- Types ---
interface MockTest {
  id: string;
  date: string;
  score: number;
  physicsScore?: number;
  chemistryScore?: number;
  mathScore?: number;
  conceptualErrors?: number;
  calculationErrors?: number;
  timeErrors?: number;
  notes?: string;
}
type Subject = 'Physics' | 'Chemistry' | 'Mathematics';

interface Chapter {
  id: string;
  name: string;
  subject: Subject;
  weightage: number; // 1 to 10 scale based on historical JEE importance
  difficulty: number; // 1 to 5 scale
  completed: boolean;
  confidenceScore?: number; // 1 to 5 scale
  revisionCount?: number;
  lastRevised?: string;
}

interface SavedSession {
  id: string;
  date: string;
  duration: number; // in seconds
  mode: 'work' | 'break';
  progressNotes: string;
  distractionNotes: string;
  productivity?: 'red' | 'yellow' | 'green';
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
  const [activeTab, setActiveTab] = useState<'plan' | 'syllabus' | 'tests' | 'path'>('plan');
  const [dailyPlan, setDailyPlan] = useState<{date: string, chapterIds: string[]}>({ date: '', chapterIds: [] });
  const [streak, setStreak] = useState<{count: number, lastActivityDate: string}>({ count: 0, lastActivityDate: '' });
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [activityLog, setActivityLog] = useState<Record<string, number>>({});
  const [dailyBig3, setDailyBig3] = useState<{date: string, tasks: {id: string, text: string, completed: boolean}[]}>({ date: '', tasks: [] });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [goalScore, setGoalScore] = useState<number>(200);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pomodoro State
  const [timerTime, setTimerTime] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);
  const [progressNotes, setProgressNotes] = useState('');
  const [distractionNotes, setDistractionNotes] = useState('');
  const [isLoggingSession, setIsLoggingSession] = useState(false);
  const [sessionProductivity, setSessionProductivity] = useState<'red' | 'yellow' | 'green'>('green');
  const [chapterToRate, setChapterToRate] = useState<string | null>(null);
  
  // Timer Settings
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [isTimerSettingsOpen, setIsTimerSettingsOpen] = useState(false);
  const [isFullscreenTimer, setIsFullscreenTimer] = useState(false);
  
  // Mock Test Form State
  const [mtPhysics, setMtPhysics] = useState('');
  const [mtChemistry, setMtChemistry] = useState('');
  const [mtMath, setMtMath] = useState('');
  const [mtConceptual, setMtConceptual] = useState('');
  const [mtCalculation, setMtCalculation] = useState('');
  const [mtTime, setMtTime] = useState('');
  const [mtNotes, setMtNotes] = useState('');
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./timerWorker.ts', import.meta.url), { type: 'module' });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const playTickSound = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.error("Error playing tick sound", e);
    }
  };

  const playSoothingChime = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const now = ctx.currentTime;
      
      // Play 3 gentle bell-like chords over 7.5 seconds
      for (let i = 0; i < 3; i++) {
        const startTime = now + i * 2.5;
        
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // Use sine waves for a soft, pure tone
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        // C5 and E5 for a pleasant major third interval
        osc1.frequency.setValueAtTime(523.25, startTime);
        osc2.frequency.setValueAtTime(659.25, startTime);
        
        // Envelope: Soft attack, long exponential decay (like a bell)
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 2.0);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + 2.5);
        osc2.stop(startTime + 2.5);
      }
    } catch (e) {
      console.error("Chime failed", e);
    }
  };

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
      localStorage.setItem(`jee_data_${currentUser}`, JSON.stringify({ chapters, dailyPlan, streak, mockTests, activityLog, dailyBig3, goalScore, savedSessions, workDuration, breakDuration }));
    }
  }, [chapters, dailyPlan, streak, mockTests, activityLog, dailyBig3, goalScore, savedSessions, workDuration, breakDuration, currentUser]);

  const loadUserData = (user: string) => {
    setIsLoading(true);
    const data = localStorage.getItem(`jee_data_${user}`);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          setChapters(parsed);
          setDailyPlan({ date: '', chapterIds: [] });
          setStreak({ count: 0, lastActivityDate: '' });
          setMockTests([]);
          setActivityLog({});
          setDailyBig3({ date: '', tasks: [] });
          setGoalScore(200);
          setSavedSessions([]);
        } else {
          setChapters(parsed.chapters || INITIAL_CHAPTERS);
          setDailyPlan(parsed.dailyPlan || { date: '', chapterIds: [] });
          setStreak(parsed.streak || { count: 0, lastActivityDate: '' });
          setMockTests(parsed.mockTests || []);
          setActivityLog(parsed.activityLog || {});
          setDailyBig3(parsed.dailyBig3 || { date: '', tasks: [] });
          setGoalScore(parsed.goalScore || 200);
          setSavedSessions(parsed.savedSessions || []);
          if (parsed.workDuration) setWorkDuration(parsed.workDuration);
          if (parsed.breakDuration) setBreakDuration(parsed.breakDuration);
        }
      } catch (e) {
        setChapters(INITIAL_CHAPTERS);
      }
    } else {
      setChapters(INITIAL_CHAPTERS);
      setDailyPlan({ date: '', chapterIds: [] });
      setStreak({ count: 0, lastActivityDate: '' });
      setMockTests([]);
      setActivityLog({});
      setDailyBig3({ date: '', tasks: [] });
      setGoalScore(200);
      setSavedSessions([]);
    }
    
    // Simulate brief loading for skeleton screens
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
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
    setMockTests([]);
    setActivityLog({});
    setSavedSessions([]);
    setIsTimerRunning(false);
  }, []);

  // --- Dates ---
  const todayDateObj = new Date();
  const todayStr = todayDateObj.toISOString().split('T')[0];
  const targetDate = new Date('2026-05-03');
  const examDate = new Date('2026-05-17');

  const daysToTarget = Math.ceil((targetDate.getTime() - todayDateObj.getTime()) / (1000 * 3600 * 24));
  const daysToExam = Math.ceil((examDate.getTime() - todayDateObj.getTime()) / (1000 * 3600 * 24));

  // --- Derived State & Logic ---
  const quotes = [
    "Success is the sum of small efforts, repeated day in and day out.",
    "The only way to do great work is to love what you do.",
    "Don't watch the clock; do what it does. Keep going.",
    "The future depends on what you do today.",
    "Believe you can and you're halfway there."
  ];
  const dailyQuote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);

  const predictedPercentile = useMemo(() => {
    if (mockTests.length === 0) return null;
    const latestScore = mockTests[0].score;
    // Dummy formula for percentile estimation based on score out of 300
    let percentile = (latestScore / 300) * 100;
    if (latestScore > 150) percentile += (latestScore - 150) * 0.15;
    if (latestScore > 200) percentile += (latestScore - 200) * 0.1;
    return Math.min(99.99, Math.max(0, percentile)).toFixed(2);
  }, [mockTests]);

  const testInsights = useMemo(() => {
    if (mockTests.length === 0) return null;
    const recentTests = mockTests.slice(0, 3);
    const totalConceptual = recentTests.reduce((sum, t) => sum + (t.conceptualErrors || 0), 0);
    const totalCalc = recentTests.reduce((sum, t) => sum + (t.calculationErrors || 0), 0);
    const totalTime = recentTests.reduce((sum, t) => sum + (t.timeErrors || 0), 0);
    
    let primaryIssue = 'None';
    let maxErrors = 0;
    if (totalConceptual > maxErrors) { primaryIssue = 'Conceptual'; maxErrors = totalConceptual; }
    if (totalCalc > maxErrors) { primaryIssue = 'Calculation'; maxErrors = totalCalc; }
    if (totalTime > maxErrors) { primaryIssue = 'Time Management'; maxErrors = totalTime; }
    
    return { primaryIssue, maxErrors, totalConceptual, totalCalc, totalTime };
  }, [mockTests]);

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

  // Heatmap Data
  const heatmapChapters: HeatmapChapter[] = useMemo(() => {
    const now = Date.now();
    return chapters.map(c => {
      let daysSinceLastRevision: number | null = null;
      if (c.lastRevised) {
        const diffMs = now - new Date(c.lastRevised).getTime();
        daysSinceLastRevision = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }
      return {
        id: c.id,
        subject: c.subject,
        chapterName: c.name,
        daysSinceLastRevision
      };
    });
  }, [chapters]);

  // Overall Progress
  const totalCompleted = chapters.filter(c => c.completed).length;
  const overallProgress = Math.round((totalCompleted / chapters.length) * 100);

  const getSubjectProgress = (subject: Subject) => {
    const subChapters = chapters.filter(c => c.subject === subject);
    const completed = subChapters.filter(c => c.completed).length;
    return { completed, total: subChapters.length, percentage: Math.round((completed / subChapters.length) * 100) };
  };

  // --- Chart Data ---
  const last30Days = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(todayDateObj);
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });
  }, [todayDateObj]);

  const radarData = useMemo(() => {
    return (['Physics', 'Chemistry', 'Mathematics'] as Subject[]).map(sub => {
      const prog = getSubjectProgress(sub);
      return {
        subject: sub,
        completion: prog.percentage,
        fullMark: 100,
      };
    });
  }, [chapters]);

  const testChartData = useMemo(() => {
    return [...mockTests].reverse().map((t, index) => ({
      name: `Test ${index + 1}`,
      score: t.score,
      physics: t.physicsScore || 0,
      chemistry: t.chemistryScore || 0,
      math: t.mathScore || 0,
      conceptual: t.conceptualErrors || 0,
      calculation: t.calculationErrors || 0,
      time: t.timeErrors || 0,
      date: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));
  }, [mockTests]);

  // Timer Logic
  useEffect(() => {
    if (!workerRef.current) return;

    const handleWorkerMessage = (e: MessageEvent) => {
      if (e.data.type === 'tick' && isTimerRunning && targetEndTime) {
        const now = Date.now();
        const remaining = Math.max(0, Math.round((targetEndTime - now) / 1000));
        setTimerTime(remaining);
        
        if (remaining > 0) {
          playTickSound();
        }

        if (remaining === 0) {
          setIsTimerRunning(false);
          setTargetEndTime(null);
          setIsFullscreenTimer(false);
          workerRef.current?.postMessage({ command: 'stop' });
          
          // Play soothing chime
          playSoothingChime();
          
          // Open logging modal
          setIsLoggingSession(true);

          // Show Push Notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const title = timerMode === 'work' ? 'Focus Session Complete!' : 'Break Time Over!';
            const body = timerMode === 'work' ? `Time to take a ${breakDuration}-minute break.` : 'Time to get back to focus!';
            
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification(title, {
                body,
                icon: '/pwa-192x192.png',
                vibrate: [200, 100, 200, 100, 200, 100, 200],
                requireInteraction: true
              } as any);
            }).catch(() => {
              new Notification(title, { body, icon: '/pwa-192x192.png' });
            });
          }

          // Auto-switch mode
          if (timerMode === 'work') {
            setTimerMode('break');
            setTimerTime(breakDuration * 60);
          } else {
            setTimerMode('work');
            setTimerTime(workDuration * 60);
          }
        }
      }
    };

    workerRef.current.addEventListener('message', handleWorkerMessage);
    
    if (isTimerRunning && targetEndTime) {
      workerRef.current.postMessage({ command: 'start' });
    } else {
      workerRef.current.postMessage({ command: 'stop' });
    }

    return () => {
      workerRef.current?.removeEventListener('message', handleWorkerMessage);
    };
  }, [isTimerRunning, targetEndTime, timerMode]);

  // Handle visibility change to sync timer immediately when phone wakes up
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isTimerRunning && targetEndTime) {
        const now = Date.now();
        const remaining = Math.max(0, Math.round((targetEndTime - now) / 1000));
        setTimerTime(remaining);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTimerRunning, targetEndTime]);

  const toggleTimer = () => {
    if (!isTimerRunning) {
      // Request Notification Permission
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }

      // Initialize AudioContext on user interaction
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      
      // Start Timer
      setTargetEndTime(Date.now() + timerTime * 1000);
      workerRef.current?.postMessage({ command: 'start' });
      setIsFullscreenTimer(true);
    } else {
      // Pause Timer
      setTargetEndTime(null);
      workerRef.current?.postMessage({ command: 'stop' });
    }
    setIsTimerRunning(!isTimerRunning);
  };
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTargetEndTime(null);
    workerRef.current?.postMessage({ command: 'stop' });
    setTimerTime(timerMode === 'work' ? workDuration * 60 : breakDuration * 60);
  };
  const switchTimerMode = (mode: 'work' | 'break') => {
    setIsTimerRunning(false);
    setTargetEndTime(null);
    workerRef.current?.postMessage({ command: 'stop' });
    setTimerMode(mode);
    setTimerTime(mode === 'work' ? workDuration * 60 : breakDuration * 60);
  };

  const saveSession = useCallback(() => {
    const duration = timerMode === 'work' ? workDuration * 60 - timerTime : breakDuration * 60 - timerTime;
    if (duration <= 0) {
      setIsLoggingSession(false);
      return; // Don't save empty sessions
    }

    const newSession: SavedSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration,
      mode: timerMode,
      progressNotes,
      distractionNotes,
      productivity: sessionProductivity
    };

    setSavedSessions(prev => [newSession, ...prev]);
    setProgressNotes('');
    setDistractionNotes('');
    setSessionProductivity('green');
    setIsLoggingSession(false);
    resetTimer();
  }, [timerMode, timerTime, progressNotes, distractionNotes, sessionProductivity]);

  // 5. Backlog Manager
  const backlogChapters = useMemo(() => {
    return chapters
      .filter(c => !c.completed && c.weightage >= 7)
      .sort((a, b) => b.weightage - a.weightage)
      .slice(0, 5);
  }, [chapters]);

  // 6. Needs Revision
  const needsRevisionChapters = useMemo(() => {
    const fifteenDaysAgo = new Date(todayDateObj);
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    return chapters
      .filter(c => c.completed && (!c.lastRevised || new Date(c.lastRevised) < fifteenDaysAgo))
      .sort((a, b) => b.weightage - a.weightage)
      .slice(0, 5);
  }, [chapters, todayDateObj]);

  // --- Handlers ---
  const toggleChapter = useCallback((id: string) => {
    const chapter = chapters.find(c => c.id === id);
    if (!chapter) return;

    if (!chapter.completed) {
      // Prompt for confidence score before marking completed
      setChapterToRate(id);
    } else {
      // Unmarking as completed
      setChapters(prev => prev.map(c => 
        c.id === id ? { ...c, completed: false, confidenceScore: undefined, lastRevised: undefined } : c
      ));
      
      setActivityLog(prevLog => ({
        ...prevLog,
        [todayStr]: Math.max(0, (prevLog[todayStr] || 0) - 1)
      }));
    }
  }, [chapters, todayStr]);

  const handleRateChapter = (score: number) => {
    if (!chapterToRate) return;

    setChapters(prev => prev.map(c => 
      c.id === chapterToRate 
        ? { ...c, completed: true, confidenceScore: score, lastRevised: new Date().toISOString() } 
        : c
    ));

    setActivityLog(prevLog => ({
      ...prevLog,
      [todayStr]: (prevLog[todayStr] || 0) + 1
    }));

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

    setChapterToRate(null);
  };

  const setChapterDifficulty = useCallback((id: string, difficulty: number) => {
    setChapters(prev => prev.map(c => 
      c.id === id ? { ...c, difficulty } : c
    ));
  }, []);

  const markChapterRevised = useCallback((id: string) => {
    setChapters(prev => prev.map(c => 
      c.id === id ? { ...c, revisionCount: (c.revisionCount || 0) + 1, lastRevised: todayStr } : c
    ));
  }, [todayStr]);

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
      <div className="min-h-screen bg-[#fdfcff] flex items-center justify-center p-4 font-sans text-slate-900">
        <div className="bg-[#ece6f0] rounded-[28px] p-8 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#d0bcff] rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-[#381e72]" />
            </div>
          </div>
          <h1 className="text-2xl font-normal text-center mb-2 text-[#1c1b1f]">JEE Smart Planner</h1>
          <p className="text-[#49454f] text-center mb-8">
            {authMode === 'login' ? 'Welcome back! Log in to continue.' : 'Create an account to save your progress.'}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {authError && (
              <div className="bg-[#f2b8b5] text-[#601410] p-3 rounded-2xl text-sm font-medium text-center">
                {authError}
              </div>
            )}
            
            <div>
              <div className="relative bg-[#e7e0ec] rounded-t-xl border-b-2 border-[#49454f] focus-within:border-[#6750a4] transition-colors">
                <User className="w-5 h-5 text-[#49454f] absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 pt-6 pb-2 bg-transparent outline-none text-[#1c1b1f] placeholder-transparent peer"
                  placeholder="Username"
                  id="username"
                />
                <label htmlFor="username" className="absolute left-12 top-2 text-xs text-[#49454f] font-medium transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#6750a4]">Username</label>
              </div>
            </div>

            <div>
              <div className="relative bg-[#e7e0ec] rounded-t-xl border-b-2 border-[#49454f] focus-within:border-[#6750a4] transition-colors">
                <Lock className="w-5 h-5 text-[#49454f] absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 pt-6 pb-2 bg-transparent outline-none text-[#1c1b1f] placeholder-transparent peer"
                  placeholder="Password"
                  id="password"
                />
                <label htmlFor="password" className="absolute left-12 top-2 text-xs text-[#49454f] font-medium transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#6750a4]">Password</label>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#6750a4] hover:bg-[#4f378b] text-white font-medium py-3.5 rounded-full transition-colors mt-6"
            >
              {authMode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#49454f]">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError('');
              }}
              className="text-[#6750a4] font-medium hover:underline"
            >
              {authMode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main App Screen ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdfcff] dark:bg-gray-900 transition-colors duration-300 p-4 pb-20">
        <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
          <div className="h-16 bg-[#ece6f0] dark:bg-gray-800 rounded-full w-full"></div>
          <div className="flex gap-4">
            <div className="h-10 bg-[#ece6f0] dark:bg-gray-800 rounded-full w-32"></div>
            <div className="h-10 bg-[#ece6f0] dark:bg-gray-800 rounded-full w-32"></div>
            <div className="h-10 bg-[#ece6f0] dark:bg-gray-800 rounded-full w-32"></div>
          </div>
          <div className="h-32 bg-[#ece6f0] dark:bg-gray-800 rounded-[28px] w-full"></div>
          <div className="h-64 bg-[#ece6f0] dark:bg-gray-800 rounded-[28px] w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfcff] dark:bg-gray-900 transition-colors duration-300 font-sans text-[#1c1b1f] dark:text-gray-100 pb-20">
      {/* Header */}
      <header className="bg-[#fdfcff] dark:bg-gray-900 sticky top-0 z-10 pt-2 pb-2 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between bg-[#ece6f0] dark:bg-gray-800 rounded-full mx-2 sm:mx-4 lg:mx-auto transition-colors duration-300">
          <div className="flex items-center gap-3 pl-2">
            <div className="w-10 h-10 bg-[#d0bcff] dark:bg-purple-600 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-[#381e72] dark:text-white shrink-0" />
            </div>
            <h1 className="text-lg font-medium text-[#1c1b1f] dark:text-gray-100 truncate">JEE Smart Planner</h1>
          </div>
          <div className="flex gap-2 sm:gap-3 text-sm font-medium items-center pr-2">
            {streak.count > 0 && (
              <div className="hidden md:flex items-center gap-1.5 text-[#8c1d18] dark:text-red-300 bg-[#f9dedc] dark:bg-red-900/50 px-4 py-2 rounded-full">
                <Flame className="w-4 h-4" />
                <span>{streak.count} Day Streak</span>
              </div>
            )}
            <div className="hidden md:flex items-center gap-1.5 text-[#001d35] dark:text-blue-300 bg-[#d3e3fd] dark:bg-blue-900/50 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span>{daysToTarget}d to Target</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-[#31111d] dark:text-pink-300 bg-[#ffd8e4] dark:bg-pink-900/50 px-4 py-2 rounded-full">
              <Calendar className="w-4 h-4" />
              <span>{daysToExam}d to Exam</span>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-[#49454f] dark:text-gray-300 hover:bg-[#e8def8] dark:hover:bg-gray-700 rounded-full transition-colors shrink-0"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Circle className="w-5 h-5 fill-current" /> : <Circle className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 text-[#21005d] dark:text-purple-200 bg-[#eaddff] dark:bg-purple-900/50 px-4 py-2 rounded-full max-w-[120px] sm:max-w-none">
              <User className="w-4 h-4 shrink-0" />
              <span className="font-medium truncate">{currentUser}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-[#49454f] dark:text-gray-300 hover:text-[#ba1a1a] dark:hover:text-red-400 hover:bg-[#ffdad6] dark:hover:bg-red-900/50 rounded-full transition-colors shrink-0"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Stats Bar */}
      <div className="md:hidden px-4 py-3 flex flex-wrap gap-2 justify-center text-xs font-medium">
        {streak.count > 0 && (
          <div className="flex items-center gap-1.5 text-[#8c1d18] bg-[#f9dedc] px-4 py-2 rounded-full">
            <Flame className="w-3.5 h-3.5" />
            <span>{streak.count} Day Streak</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[#001d35] bg-[#d3e3fd] px-4 py-2 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          <span>{daysToTarget}d to Target</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#31111d] bg-[#ffd8e4] px-4 py-2 rounded-full">
          <Calendar className="w-3.5 h-3.5" />
          <span>{daysToExam}d to Exam</span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Desktop Navigation Tabs */}
        <div className="hidden md:flex flex-row gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar w-full">
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex-none px-6 py-2.5 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
              activeTab === 'plan' ? 'bg-[#eaddff] text-[#21005d] dark:bg-purple-900/80 dark:text-purple-200' : 'bg-transparent border border-[#79747e] text-[#49454f] dark:text-gray-300 dark:border-gray-600 hover:bg-[#ece6f0] dark:hover:bg-gray-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Daily Plan
          </button>
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`flex-none px-6 py-2.5 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
              activeTab === 'syllabus' ? 'bg-[#eaddff] text-[#21005d] dark:bg-purple-900/80 dark:text-purple-200' : 'bg-transparent border border-[#79747e] text-[#49454f] dark:text-gray-300 dark:border-gray-600 hover:bg-[#ece6f0] dark:hover:bg-gray-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Syllabus
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex-none px-6 py-2.5 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
              activeTab === 'tests' ? 'bg-[#eaddff] text-[#21005d] dark:bg-purple-900/80 dark:text-purple-200' : 'bg-transparent border border-[#79747e] text-[#49454f] dark:text-gray-300 dark:border-gray-600 hover:bg-[#ece6f0] dark:hover:bg-gray-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            Mock Tests
          </button>
          <button
            onClick={() => setActiveTab('path')}
            className={`flex-none px-6 py-2.5 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
              activeTab === 'path' ? 'bg-[#eaddff] text-[#21005d] dark:bg-purple-900/80 dark:text-purple-200' : 'bg-transparent border border-[#79747e] text-[#49454f] dark:text-gray-300 dark:border-gray-600 hover:bg-[#ece6f0] dark:hover:bg-gray-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Path Travelled
          </button>
        </div>

        {activeTab === 'plan' && (
          <div className="space-y-8">
            {/* Motivational Quote */}
            <div className="bg-[#eaddff] dark:bg-purple-900/30 rounded-[28px] p-6 text-center italic text-[#21005d] dark:text-purple-200 font-medium">
              "{dailyQuote}"
            </div>

            {/* Daily Big 3 */}
            <section className="bg-[#f3edf7] dark:bg-gray-800 rounded-[28px] p-6 transition-colors duration-300">
              <h2 className="text-lg font-medium flex items-center gap-2 text-[#1c1b1f] dark:text-gray-100 mb-4">
                <Target className="w-6 h-6 text-[#6750a4] dark:text-purple-400 shrink-0" />
                Daily Big 3
              </h2>
              <p className="text-[#49454f] dark:text-gray-400 text-sm mb-4">What are the 3 most important tasks for today?</p>
              <div className="space-y-3">
                {[0, 1, 2].map(index => {
                  const task = dailyBig3.tasks[index] || { id: `task-${index}`, text: '', completed: false };
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          const newTasks = [...dailyBig3.tasks];
                          if (!newTasks[index]) newTasks[index] = { id: `task-${index}`, text: '', completed: false };
                          newTasks[index].completed = !newTasks[index].completed;
                          setDailyBig3({ date: todayStr, tasks: newTasks });
                        }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                          task.completed 
                            ? 'bg-[#6750a4] border-[#6750a4] dark:bg-purple-500 dark:border-purple-500' 
                            : 'border-[#79747e] dark:border-gray-500'
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                      <input 
                        type="text"
                        value={task.text}
                        onChange={(e) => {
                          const newTasks = [...dailyBig3.tasks];
                          if (!newTasks[index]) newTasks[index] = { id: `task-${index}`, text: '', completed: false };
                          newTasks[index].text = e.target.value;
                          setDailyBig3({ date: todayStr, tasks: newTasks });
                        }}
                        placeholder={`Task ${index + 1}`}
                        className={`flex-1 bg-transparent border-b border-[#79747e] dark:border-gray-600 focus:border-[#6750a4] dark:focus:border-purple-400 outline-none py-1 text-[#1c1b1f] dark:text-gray-100 transition-colors ${task.completed ? 'line-through text-[#49454f] dark:text-gray-500' : ''}`}
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Backlog Manager */}
            {backlogChapters.length > 0 && (
              <section className="bg-[#ffdad6] dark:bg-red-900/20 rounded-[28px] p-6 transition-colors duration-300">
                <h2 className="text-lg font-medium flex items-center gap-2 mb-4 text-[#410002] dark:text-red-300">
                  <AlertCircle className="w-6 h-6 text-[#ba1a1a] dark:text-red-400" />
                  High Priority Backlog
                </h2>
                <div className="space-y-3">
                  {backlogChapters.map(chapter => (
                    <div key={chapter.id} className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-4 rounded-[16px]">
                      <div>
                        <p className="font-medium text-[#1c1b1f] dark:text-gray-100">{chapter.name}</p>
                        <p className="text-xs text-[#49454f] dark:text-gray-400 uppercase tracking-wider mt-1">{chapter.subject} • Weightage: {chapter.weightage}/10</p>
                      </div>
                      <button 
                        onClick={() => toggleChapter(chapter.id)}
                        className="bg-[#ba1a1a] hover:bg-[#93000a] dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                      >
                        Mark Done
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Needs Revision */}
            {needsRevisionChapters.length > 0 && (
              <section className="bg-[#fff8e1] dark:bg-yellow-900/20 rounded-[28px] p-6 transition-colors duration-300">
                <h2 className="text-lg font-medium flex items-center gap-2 mb-4 text-[#5c4000] dark:text-yellow-300">
                  <Zap className="w-6 h-6 text-[#fbc02d] dark:text-yellow-400" />
                  Needs Revision (15+ Days)
                </h2>
                <div className="space-y-3">
                  {needsRevisionChapters.map(chapter => (
                    <div key={chapter.id} className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-4 rounded-[16px]">
                      <div>
                        <p className="font-medium text-[#1c1b1f] dark:text-gray-100">{chapter.name}</p>
                        <p className="text-xs text-[#49454f] dark:text-gray-400 uppercase tracking-wider mt-1">
                          {chapter.subject} • Last Revised: {chapter.lastRevised ? new Date(chapter.lastRevised).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <button 
                        onClick={() => markChapterRevised(chapter.id)}
                        className="bg-[#fbc02d] hover:bg-[#f9a825] dark:bg-yellow-600 dark:hover:bg-yellow-700 text-[#5c4000] dark:text-yellow-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                      >
                        Mark Revised
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Top 20 Goal Tracker */}
            <section className="bg-[#f3edf7] dark:bg-gray-800 rounded-[28px] p-6 transition-colors duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <div>
                  <h2 className="text-lg font-medium flex items-center gap-2 text-[#1c1b1f]">
                    <Award className="w-6 h-6 text-[#6750a4] shrink-0" />
                    Target: Top 20 Chapters by May 3rd
                  </h2>
                  <p className="text-[#49454f] text-sm mt-1">
                    Focusing on the highest weightage chapters first to maximize your score.
                  </p>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto flex justify-between sm:block items-end">
                  <span className="text-4xl font-normal text-[#6750a4]">{top20CompletedCount}</span>
                  <span className="text-[#49454f] font-medium"> / 20</span>
                </div>
              </div>
              
              <div className="w-full bg-[#eaddff] rounded-full h-4 mb-2 overflow-hidden">
                <div 
                  className="bg-[#6750a4] h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(top20CompletedCount / 20) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-[#49454f] font-medium text-right">
                {20 - top20CompletedCount} chapters remaining • {daysToTarget} days left
              </p>
            </section>

            {/* Today's Plan */}
            <section>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <h2 className="text-xl font-medium flex items-center gap-2 text-[#1c1b1f]">
                  <BookOpen className="w-6 h-6 text-[#6750a4] shrink-0" />
                  Today's Lessons
                </h2>
                <span className="text-sm font-medium text-[#21005d] bg-[#eaddff] px-4 py-2 rounded-full w-full sm:w-auto text-center">
                  Goal: {todaysPlanChapters.length} Lessons (Load: {currentPlanLoad}/10)
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {todaysPlanChapters.length > 0 ? todaysPlanChapters.map(chapter => {
                  const colors = getSubjectColor(chapter.subject);
                  
                  return (
                    <div key={chapter.id} className={`rounded-[24px] p-6 bg-[#ece6f0] relative overflow-hidden flex flex-col ${chapter.completed ? 'opacity-60' : ''}`}>
                      <div className="text-xs font-medium uppercase tracking-wider mb-3 text-[#49454f]">
                        {chapter.subject}
                      </div>
                      
                      <h3 className={`font-medium text-lg mb-2 leading-tight text-[#1c1b1f] ${chapter.completed ? 'line-through' : ''}`}>
                        {chapter.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-6 flex-wrap">
                        <span className="bg-[#eaddff] text-[#21005d] px-3 py-1 rounded-full text-xs font-medium">
                          Weight: {chapter.weightage}/10
                        </span>
                        <span className="bg-[#eaddff] text-[#21005d] px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          Diff: {chapter.difficulty}/5 <Star className="w-3 h-3 fill-[#6750a4] text-[#6750a4]" />
                        </span>
                        {top20Chapters.find(c => c.id === chapter.id) && (
                          <span className="bg-[#ffdad6] text-[#410002] px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Award className="w-3 h-3" /> Top 20
                          </span>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => toggleChapter(chapter.id)}
                        className={`mt-auto w-full font-medium py-3 rounded-full transition-colors flex items-center justify-center gap-2 ${
                          chapter.completed 
                            ? 'bg-[#d3e3fd] text-[#001d35] hover:bg-[#c2d7ff]' 
                            : 'bg-[#6750a4] hover:bg-[#4f378b] text-white'
                        }`}
                      >
                        {chapter.completed ? (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Circle className="w-5 h-5 text-[#eaddff]" />
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

            {/* Pomodoro Timer */}
            <section className="bg-[#f3edf7] dark:bg-gray-800 rounded-[28px] p-6 transition-colors duration-300">
              <h2 className="text-xl font-medium flex items-center gap-2 mb-6 text-[#1c1b1f] dark:text-gray-100">
                <Clock className="w-6 h-6 text-[#6750a4] dark:text-purple-400" />
                Focus Timer
              </h2>
              
              <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                <div className="flex flex-col items-center relative">
                  <button
                    onClick={() => setIsTimerSettingsOpen(true)}
                    className="absolute -top-4 -right-4 p-2 text-[#49454f] dark:text-gray-400 hover:bg-[#eaddff] dark:hover:bg-gray-700 rounded-full transition-colors"
                    title="Timer Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <div className="flex gap-2 mb-8 bg-[#e7e0ec] dark:bg-gray-700 p-1 rounded-full transition-colors duration-300">
                    <button 
                      onClick={() => switchTimerMode('work')}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${timerMode === 'work' ? 'bg-[#6750a4] text-white shadow-sm' : 'text-[#49454f] dark:text-gray-300 hover:bg-[#d0bcff] dark:hover:bg-gray-600'}`}
                    >
                      Focus ({workDuration}m)
                    </button>
                    <button 
                      onClick={() => switchTimerMode('break')}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${timerMode === 'break' ? 'bg-[#6750a4] text-white shadow-sm' : 'text-[#49454f] dark:text-gray-300 hover:bg-[#d0bcff] dark:hover:bg-gray-600'}`}
                    >
                      Break ({breakDuration}m)
                    </button>
                  </div>
                  
                  <div className="relative">
                    <FlipClock time={timerTime} />
                    {isTimerRunning && (
                      <button 
                        onClick={() => setIsFullscreenTimer(true)}
                        className="absolute -top-4 -right-12 p-2 text-[#49454f] dark:text-gray-400 hover:bg-[#eaddff] dark:hover:bg-gray-700 rounded-full transition-colors"
                        title="Fullscreen Timer"
                      >
                        <Maximize className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={toggleTimer}
                      className="w-16 h-16 rounded-full bg-[#6750a4] hover:bg-[#4f378b] text-white flex items-center justify-center transition-colors shadow-md"
                    >
                      {isTimerRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                    </button>
                    <button 
                      onClick={resetTimer}
                      className="w-16 h-16 rounded-full bg-[#ece6f0] dark:bg-gray-700 hover:bg-[#e8def8] dark:hover:bg-gray-600 text-[#49454f] dark:text-gray-300 flex items-center justify-center transition-colors"
                    >
                      <RotateCcw className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="w-full md:w-1/2 flex flex-col items-center justify-center gap-4">
                  {(timerMode === 'work' ? workDuration * 60 - timerTime : breakDuration * 60 - timerTime) > 0 && (
                    <button 
                      onClick={() => setIsLoggingSession(true)}
                      className="w-full max-w-xs bg-[#6750a4] hover:bg-[#4f378b] text-white font-medium py-3 rounded-full transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Log Session
                    </button>
                  )}
                  <p className="text-sm text-[#49454f] dark:text-gray-400 text-center mt-4">
                    Focus sessions are automatically saved when the timer completes, or you can log them manually.
                  </p>
                </div>
              </div>
            </section>

            {/* Overall Progress */}
            <section className="bg-[#f3edf7] dark:bg-gray-800 rounded-[28px] p-6 transition-colors duration-300">
              <h2 className="text-lg font-medium flex items-center gap-2 mb-6 text-[#1c1b1f] dark:text-gray-100">
                <TrendingUp className="w-6 h-6 text-[#6750a4] dark:text-purple-400" />
                Syllabus Progress
              </h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2 text-[#1c1b1f] dark:text-gray-100">
                    <span className="font-medium">Overall</span>
                    <span className="font-medium">{overallProgress}%</span>
                  </div>
                  <div className="w-full bg-[#eaddff] dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div className="bg-[#6750a4] dark:bg-purple-500 h-4 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#cac4d0] dark:border-gray-600">
                  {(['Physics', 'Chemistry', 'Mathematics'] as Subject[]).map(sub => {
                    const prog = getSubjectProgress(sub);
                    const colorClass = sub === 'Physics' ? 'bg-[#0061a4] dark:bg-blue-400' : sub === 'Chemistry' ? 'bg-[#006d3a] dark:bg-emerald-400' : 'bg-[#6750a4] dark:bg-purple-400';
                    return (
                      <div key={sub}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-[#1c1b1f] dark:text-gray-100">{sub}</span>
                          <span className="text-[#49454f] dark:text-gray-400">{prog.completed}/{prog.total}</span>
                        </div>
                        <div className="w-full bg-[#eaddff] dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div className={`${colorClass} h-2 rounded-full transition-all duration-500`} style={{ width: `${prog.percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Activity Heatmap */}
            <section className="bg-[#f3edf7] dark:bg-gray-800 rounded-[28px] p-6 transition-colors duration-300">
              <h2 className="text-lg font-medium flex items-center gap-2 mb-4 text-[#1c1b1f] dark:text-gray-100">
                <Flame className="w-6 h-6 text-[#ba1a1a] dark:text-red-400" />
                30-Day Activity Heatmap
              </h2>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {last30Days.map(date => {
                  const count = activityLog[date] || 0;
                  let bg = 'bg-[#eaddff] dark:bg-gray-700';
                  if (count === 1) bg = 'bg-[#d0bcff] dark:bg-purple-900';
                  else if (count === 2) bg = 'bg-[#9a82db] dark:bg-purple-700';
                  else if (count === 3) bg = 'bg-[#6750a4] dark:bg-purple-500';
                  else if (count > 3) bg = 'bg-[#4f378b] dark:bg-purple-400';
                  
                  return (
                    <div 
                      key={date} 
                      title={`${date}: ${count} lessons`}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-[6px] ${bg} transition-colors hover:ring-2 ring-[#21005d] dark:ring-purple-300 ring-offset-1 dark:ring-offset-gray-800`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-4 text-xs text-[#49454f] dark:text-gray-400 font-medium">
                <span>Less</span>
                <div className="w-3 h-3 rounded-[4px] bg-[#eaddff] dark:bg-gray-700"></div>
                <div className="w-3 h-3 rounded-[4px] bg-[#d0bcff] dark:bg-purple-900"></div>
                <div className="w-3 h-3 rounded-[4px] bg-[#9a82db] dark:bg-purple-700"></div>
                <div className="w-3 h-3 rounded-[4px] bg-[#6750a4] dark:bg-purple-500"></div>
                <div className="w-3 h-3 rounded-[4px] bg-[#4f378b] dark:bg-purple-400"></div>
                <span>More</span>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'syllabus' && (
          <div className="space-y-6">
            <section className="bg-[#f3edf7] dark:bg-gray-800 rounded-[28px] p-6 transition-colors duration-300">
              <h2 className="text-lg font-medium flex items-center gap-2 mb-4 text-[#1c1b1f] dark:text-gray-100">
                <Target className="w-6 h-6 text-[#6750a4] dark:text-purple-400" />
                Subject Mastery Radar
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke={isDarkMode ? '#49454f' : '#cac4d0'} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: isDarkMode ? '#cac4d0' : '#49454f', fontSize: 12, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: isDarkMode ? '#cac4d0' : '#49454f', fontSize: 10 }} />
                    <Radar name="Completion %" dataKey="completion" stroke={isDarkMode ? '#d0bcff' : '#6750a4'} strokeWidth={2} fill={isDarkMode ? '#d0bcff' : '#6750a4'} fillOpacity={0.5} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: isDarkMode ? '#332d41' : '#ece6f0', color: isDarkMode ? '#e6e1e5' : '#1c1b1f' }}
                      itemStyle={{ color: isDarkMode ? '#d0bcff' : '#6750a4', fontWeight: '500' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-[#fdfcff] dark:bg-gray-900 rounded-[28px] p-6 shadow-sm border border-[#cac4d0] dark:border-gray-700 transition-colors duration-300">
              <h2 className="text-lg font-medium flex items-center gap-2 mb-2 text-[#1c1b1f] dark:text-gray-100">
                <Flame className="w-6 h-6 text-orange-500" />
                War Room Heatmap
              </h2>
              <p className="text-sm text-[#49454f] dark:text-gray-400 mb-4">Track chapter freshness based on your last revision date.</p>
              <SyllabusHeatmap chapters={heatmapChapters} />
            </section>

            <div className="bg-[#fdfcff] dark:bg-gray-900 rounded-[28px] shadow-sm border border-[#cac4d0] dark:border-gray-700 overflow-hidden transition-colors duration-300">
              <div className="p-6 border-b border-[#cac4d0] dark:border-gray-700 bg-[#ece6f0] dark:bg-gray-800 transition-colors duration-300">
                <h2 className="text-lg font-medium text-[#1c1b1f] dark:text-gray-100">Full Syllabus Tracker</h2>
                <p className="text-sm text-[#49454f] dark:text-gray-400 mt-1">Update your progress, difficulty, and confidence here.</p>
              </div>
            
            <div className="divide-y divide-[#cac4d0] dark:divide-gray-700">
              {(['Physics', 'Chemistry', 'Mathematics'] as Subject[]).map(subject => (
                <div key={subject} className="p-6">
                  <h3 className="font-medium text-lg mb-4 flex items-center gap-2 text-[#1c1b1f] dark:text-gray-100">
                    <div className={`w-3 h-3 rounded-full ${
                      subject === 'Physics' ? 'bg-[#0061a4] dark:bg-blue-400' : 
                      subject === 'Chemistry' ? 'bg-[#006d3a] dark:bg-emerald-400' : 'bg-[#6750a4] dark:bg-purple-400'
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
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-[16px] cursor-pointer transition-all ${
                              chapter.completed 
                                ? 'bg-[#f3edf7] dark:bg-gray-800/60 opacity-60' 
                                : 'bg-[#fdfcff] dark:bg-gray-800 border border-[#cac4d0] dark:border-gray-600 hover:bg-[#ece6f0] dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="flex items-start sm:items-center gap-3 mb-3 sm:mb-0">
                              {chapter.completed ? (
                                <CheckCircle2 className="w-6 h-6 text-[#6750a4] dark:text-purple-400 shrink-0 mt-0.5 sm:mt-0" />
                              ) : (
                                <Circle className="w-6 h-6 text-[#49454f] dark:text-gray-400 shrink-0 mt-0.5 sm:mt-0" />
                              )}
                              <div>
                                <p className={`font-medium ${chapter.completed ? 'line-through text-[#49454f] dark:text-gray-500' : 'text-[#1c1b1f] dark:text-gray-100'}`}>
                                  {chapter.name}
                                </p>
                                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                                  <span className="text-xs font-medium text-[#49454f] dark:text-gray-400">
                                    Weightage: {chapter.weightage}/10
                                  </span>
                                  {isTop20 && (
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-[#410002] dark:text-red-200 bg-[#ffdad6] dark:bg-red-900/50 px-2 py-1 rounded-full">
                                      Top 20
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Difficulty & Confidence Selector */}
                            <div className="flex flex-col sm:items-end w-full sm:w-auto mt-3 sm:mt-0 pl-8 sm:pl-0 gap-2" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-between sm:justify-end w-full gap-1">
                                <span className="text-xs font-medium text-[#49454f] dark:text-gray-400 mr-1">Difficulty:</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                      key={star}
                                      onClick={() => setChapterDifficulty(chapter.id, star)}
                                      className={`p-1 transition-colors rounded-full hover:bg-[#eaddff] dark:hover:bg-purple-900/50 ${
                                        chapter.difficulty >= star ? 'text-[#6750a4] dark:text-purple-400' : 'text-[#cac4d0] dark:text-gray-600 hover:text-[#6750a4] dark:hover:text-purple-400'
                                      }`}
                                    >
                                      <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${chapter.difficulty >= star ? 'fill-current' : ''}`} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between sm:justify-end w-full gap-2">
                                <span className="text-xs font-medium text-[#49454f] dark:text-gray-400">Confidence:</span>
                                {chapter.confidenceScore ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-bold text-[#6750a4] dark:text-purple-400">{chapter.confidenceScore}/5</span>
                                    <Star className="w-3 h-3 text-[#6750a4] dark:text-purple-400 fill-current" />
                                  </div>
                                ) : (
                                  <span className="text-xs text-[#49454f] dark:text-gray-500 italic">Not rated</span>
                                )}
                              </div>
                              
                              {chapter.completed && chapter.lastRevised && chapter.confidenceScore && (
                                <div className="flex items-center justify-between sm:justify-end w-full gap-2 mt-1">
                                  <span className="text-[10px] font-medium text-[#49454f] dark:text-gray-400 uppercase tracking-wider">Decay in:</span>
                                  <DecayTimerDisplay lastRevisionDate={chapter.lastRevised} confidenceScore={chapter.confidenceScore} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-6">
            {predictedPercentile && (
              <div className="bg-[#eaddff] dark:bg-purple-900/30 rounded-[28px] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between transition-colors duration-300 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-[#21005d] dark:text-purple-300 uppercase tracking-wider mb-1">Predicted Percentile</h3>
                  <p className="text-[#49454f] dark:text-gray-400 text-sm">Based on your latest mock test score of {mockTests[0]?.score}/300</p>
                </div>
                <div className="text-4xl font-bold text-[#6750a4] dark:text-purple-400">
                  {predictedPercentile}%
                </div>
              </div>
            )}

            {testInsights && testInsights.primaryIssue !== 'None' && (
              <div className="bg-[#ffdad6] dark:bg-red-900/20 rounded-[28px] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between transition-colors duration-300 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-[#410002] dark:text-red-300 uppercase tracking-wider mb-1">Diagnostic Insight</h3>
                  <p className="text-[#49454f] dark:text-gray-400 text-sm">
                    You've lost {testInsights.maxErrors} marks recently to <strong className="text-[#ba1a1a] dark:text-red-400">{testInsights.primaryIssue} errors</strong>. Focus on improving this area.
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-[#ba1a1a] dark:text-red-400 shrink-0" />
              </div>
            )}

            <section className="bg-[#f3edf7] dark:bg-gray-800 rounded-[28px] p-6 transition-colors duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <h2 className="text-lg font-medium flex items-center gap-2 text-[#1c1b1f] dark:text-gray-100">
                  <TrendingUp className="w-6 h-6 text-[#6750a4] dark:text-purple-400" />
                  Score Trend
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#49454f] dark:text-gray-400">Goal Score:</span>
                  <input 
                    type="number" 
                    value={goalScore}
                    onChange={(e) => setGoalScore(parseInt(e.target.value) || 0)}
                    className="w-20 bg-transparent border border-[#cac4d0] dark:border-gray-600 rounded-md px-2 py-1 text-sm text-[#1c1b1f] dark:text-gray-100 focus:outline-none focus:border-[#6750a4] dark:focus:border-purple-400"
                    min="0"
                    max="300"
                  />
                </div>
              </div>
              <div className="h-64 w-full">
                {mockTests.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={testChartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#49454f' : '#cac4d0'} vertical={false} />
                      <XAxis dataKey="name" stroke={isDarkMode ? '#cac4d0' : '#49454f'} fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 300]} stroke={isDarkMode ? '#cac4d0' : '#49454f'} fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: isDarkMode ? '#332d41' : '#ece6f0', color: isDarkMode ? '#e6e1e5' : '#1c1b1f' }}
                        labelStyle={{ fontWeight: '500', color: isDarkMode ? '#e6e1e5' : '#1c1b1f', marginBottom: '4px' }}
                      />
                      <Line type="monotone" dataKey="score" name="Score" stroke={isDarkMode ? '#d0bcff' : '#6750a4'} strokeWidth={3} dot={{ r: 4, fill: isDarkMode ? '#d0bcff' : '#6750a4', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                      <Line type="monotone" dataKey={() => goalScore} name="Goal" stroke={isDarkMode ? '#4ade80' : '#16a34a'} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#49454f] dark:text-gray-400 text-sm bg-[#ece6f0] dark:bg-gray-700 rounded-[24px] border border-dashed border-[#cac4d0] dark:border-gray-500 transition-colors duration-300">
                    <BarChart className="w-8 h-8 mb-2 text-[#49454f] dark:text-gray-400" />
                    <p>Log at least 2 tests to see your trend.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-[#f3edf7] dark:bg-gray-800 rounded-[28px] p-6 transition-colors duration-300">
              <h2 className="text-lg font-medium flex items-center gap-2 mb-4 text-[#1c1b1f] dark:text-gray-100">
                <Activity className="w-6 h-6 text-[#6750a4] dark:text-purple-400" />
                Log Mock Test Score
              </h2>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const pScore = parseInt(mtPhysics, 10) || 0;
                  const cScore = parseInt(mtChemistry, 10) || 0;
                  const mScore = parseInt(mtMath, 10) || 0;
                  const totalScore = pScore + cScore + mScore;
                  
                  if (totalScore >= 0 && totalScore <= 300) {
                    setMockTests(prev => [{ 
                      id: Date.now().toString(), 
                      date: todayStr, 
                      score: totalScore,
                      physicsScore: pScore,
                      chemistryScore: cScore,
                      mathScore: mScore,
                      conceptualErrors: parseInt(mtConceptual, 10) || 0,
                      calculationErrors: parseInt(mtCalculation, 10) || 0,
                      timeErrors: parseInt(mtTime, 10) || 0,
                      notes: mtNotes
                    }, ...prev]);
                    
                    setMtPhysics('');
                    setMtChemistry('');
                    setMtMath('');
                    setMtConceptual('');
                    setMtCalculation('');
                    setMtTime('');
                    setMtNotes('');
                  }
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#49454f] dark:text-gray-300 mb-1">Physics Score</label>
                    <input 
                      type="number" 
                      value={mtPhysics}
                      onChange={e => setMtPhysics(e.target.value)}
                      min="0" max="100" required
                      className="w-full px-4 py-3 bg-[#ece6f0] dark:bg-gray-700 border-b-2 border-[#49454f] dark:border-gray-500 rounded-t-[4px] focus:border-[#6750a4] dark:focus:border-purple-400 outline-none transition-all text-[#1c1b1f] dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#49454f] dark:text-gray-300 mb-1">Chemistry Score</label>
                    <input 
                      type="number" 
                      value={mtChemistry}
                      onChange={e => setMtChemistry(e.target.value)}
                      min="0" max="100" required
                      className="w-full px-4 py-3 bg-[#ece6f0] dark:bg-gray-700 border-b-2 border-[#49454f] dark:border-gray-500 rounded-t-[4px] focus:border-[#6750a4] dark:focus:border-purple-400 outline-none transition-all text-[#1c1b1f] dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#49454f] dark:text-gray-300 mb-1">Math Score</label>
                    <input 
                      type="number" 
                      value={mtMath}
                      onChange={e => setMtMath(e.target.value)}
                      min="0" max="100" required
                      className="w-full px-4 py-3 bg-[#ece6f0] dark:bg-gray-700 border-b-2 border-[#49454f] dark:border-gray-500 rounded-t-[4px] focus:border-[#6750a4] dark:focus:border-purple-400 outline-none transition-all text-[#1c1b1f] dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[#1c1b1f] dark:text-gray-100 mb-3">Error Analysis (Number of Questions)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-[#49454f] dark:text-gray-400 mb-1">Conceptual Errors</label>
                      <input 
                        type="number" value={mtConceptual} onChange={e => setMtConceptual(e.target.value)} min="0"
                        className="w-full px-3 py-2 bg-[#ece6f0] dark:bg-gray-700 border-b border-[#49454f] dark:border-gray-500 rounded-t-[4px] focus:border-[#6750a4] dark:focus:border-purple-400 outline-none text-sm text-[#1c1b1f] dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#49454f] dark:text-gray-400 mb-1">Calculation Errors</label>
                      <input 
                        type="number" value={mtCalculation} onChange={e => setMtCalculation(e.target.value)} min="0"
                        className="w-full px-3 py-2 bg-[#ece6f0] dark:bg-gray-700 border-b border-[#49454f] dark:border-gray-500 rounded-t-[4px] focus:border-[#6750a4] dark:focus:border-purple-400 outline-none text-sm text-[#1c1b1f] dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#49454f] dark:text-gray-400 mb-1">Time Management Errors</label>
                      <input 
                        type="number" value={mtTime} onChange={e => setMtTime(e.target.value)} min="0"
                        className="w-full px-3 py-2 bg-[#ece6f0] dark:bg-gray-700 border-b border-[#49454f] dark:border-gray-500 rounded-t-[4px] focus:border-[#6750a4] dark:focus:border-purple-400 outline-none text-sm text-[#1c1b1f] dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-[#49454f] dark:text-gray-300 mb-1">Test Notes / Takeaways</label>
                    <input 
                      type="text" 
                      value={mtNotes}
                      onChange={e => setMtNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-[#ece6f0] dark:bg-gray-700 border-b-2 border-[#49454f] dark:border-gray-500 rounded-t-[4px] focus:border-[#6750a4] dark:focus:border-purple-400 outline-none transition-all text-[#1c1b1f] dark:text-gray-100"
                      placeholder="e.g. Need to revise Optics formulas..."
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full sm:w-auto bg-[#6750a4] hover:bg-[#4f378b] text-white font-medium px-8 py-3 rounded-full transition-colors h-[48px] flex items-center justify-center shrink-0"
                  >
                    Log Score
                  </button>
                </div>
              </form>
            </section>

            <section className="bg-[#f3edf7] dark:bg-gray-800 rounded-[28px] p-6 transition-colors duration-300">
              <h2 className="text-lg font-medium flex items-center gap-2 mb-6 text-[#1c1b1f] dark:text-gray-100">
                <BarChart className="w-6 h-6 text-[#6750a4] dark:text-purple-400" />
                Past Scores
              </h2>
              {mockTests.length > 0 ? (
                <div className="space-y-4">
                  {mockTests.map(test => (
                    <div key={test.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[24px] bg-[#ece6f0] dark:bg-gray-700 transition-colors duration-300 gap-4">
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-[#eaddff] dark:bg-purple-900/50 flex items-center justify-center font-bold text-[#21005d] dark:text-purple-200 shrink-0">
                          {Math.round((test.score / 300) * 100)}%
                        </div>
                        <div>
                          <p className="font-bold text-lg text-[#1c1b1f] dark:text-gray-100">{test.score} <span className="text-sm font-normal text-[#49454f] dark:text-gray-400">/ 300</span></p>
                          <p className="text-xs text-[#49454f] dark:text-gray-400 mb-2">{new Date(test.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          
                          {(test.physicsScore !== undefined || test.conceptualErrors !== undefined) && (
                            <div className="flex flex-wrap gap-2 text-xs">
                              {test.physicsScore !== undefined && (
                                <span className="bg-[#d3e3fd] dark:bg-blue-900/30 text-[#001d35] dark:text-blue-300 px-2 py-1 rounded-md">P: {test.physicsScore} | C: {test.chemistryScore} | M: {test.mathScore}</span>
                              )}
                              {(test.conceptualErrors || test.calculationErrors || test.timeErrors) ? (
                                <span className="bg-[#ffdad6] dark:bg-red-900/30 text-[#410002] dark:text-red-300 px-2 py-1 rounded-md">
                                  Errors: {test.conceptualErrors}C, {test.calculationErrors}M, {test.timeErrors}T
                                </span>
                              ) : null}
                            </div>
                          )}
                          {test.notes && (
                            <p className="text-sm text-[#49454f] dark:text-gray-300 mt-2 italic">"{test.notes}"</p>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => setMockTests(prev => prev.filter(t => t.id !== test.id))}
                        className="text-sm text-[#ba1a1a] dark:text-red-400 hover:text-[#93000a] dark:hover:text-red-300 font-medium px-4 py-2 rounded-full hover:bg-[#ffdad6] dark:hover:bg-red-900/50 transition-colors self-end sm:self-auto"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#49454f] dark:text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-[#cac4d0] dark:text-gray-600" />
                  <p>No mock tests logged yet.</p>
                  <p className="text-sm">Log your first score above to start tracking your performance!</p>
                </div>
              )}
            </section>

            {/* Subject Scores Trend */}
            <section className="bg-[#f3edf7] dark:bg-gray-800 rounded-[28px] p-6 transition-colors duration-300">
              <h2 className="text-lg font-medium flex items-center gap-2 mb-4 text-[#1c1b1f] dark:text-gray-100">
                <TrendingUp className="w-6 h-6 text-[#0061a4] dark:text-blue-400" />
                Subject-Wise Trend
              </h2>
              <div className="h-64 w-full">
                {mockTests.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={testChartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#49454f' : '#cac4d0'} vertical={false} />
                      <XAxis dataKey="name" stroke={isDarkMode ? '#cac4d0' : '#49454f'} fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} stroke={isDarkMode ? '#cac4d0' : '#49454f'} fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: isDarkMode ? '#332d41' : '#ece6f0', color: isDarkMode ? '#e6e1e5' : '#1c1b1f' }}
                        labelStyle={{ fontWeight: '500', color: isDarkMode ? '#e6e1e5' : '#1c1b1f', marginBottom: '4px' }}
                      />
                      <Line type="monotone" dataKey="physics" name="Physics" stroke={isDarkMode ? '#60a5fa' : '#0061a4'} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="chemistry" name="Chemistry" stroke={isDarkMode ? '#34d399' : '#006d3a'} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="math" name="Math" stroke={isDarkMode ? '#c084fc' : '#6750a4'} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#49454f] dark:text-gray-400 text-sm bg-[#ece6f0] dark:bg-gray-700 rounded-[24px] border border-dashed border-[#cac4d0] dark:border-gray-500 transition-colors duration-300">
                    <BarChart className="w-8 h-8 mb-2 text-[#49454f] dark:text-gray-400" />
                    <p>Log at least 2 tests to see your trend.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Error Trends */}
            <section className="bg-[#f3edf7] dark:bg-gray-800 rounded-[28px] p-6 transition-colors duration-300">
              <h2 className="text-lg font-medium flex items-center gap-2 mb-4 text-[#1c1b1f] dark:text-gray-100">
                <Activity className="w-6 h-6 text-[#ba1a1a] dark:text-red-400" />
                Error Analysis Trend
              </h2>
              <div className="h-64 w-full">
                {mockTests.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={testChartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#49454f' : '#cac4d0'} vertical={false} />
                      <XAxis dataKey="name" stroke={isDarkMode ? '#cac4d0' : '#49454f'} fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke={isDarkMode ? '#cac4d0' : '#49454f'} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: isDarkMode ? '#332d41' : '#ece6f0', color: isDarkMode ? '#e6e1e5' : '#1c1b1f' }}
                        labelStyle={{ fontWeight: '500', color: isDarkMode ? '#e6e1e5' : '#1c1b1f', marginBottom: '4px' }}
                      />
                      <Line type="monotone" dataKey="conceptual" name="Conceptual" stroke={isDarkMode ? '#f87171' : '#ba1a1a'} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="calculation" name="Calculation" stroke={isDarkMode ? '#fb923c' : '#b45309'} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="time" name="Time Management" stroke={isDarkMode ? '#94a3b8' : '#475569'} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#49454f] dark:text-gray-400 text-sm bg-[#ece6f0] dark:bg-gray-700 rounded-[24px] border border-dashed border-[#cac4d0] dark:border-gray-500 transition-colors duration-300">
                    <BarChart className="w-8 h-8 mb-2 text-[#49454f] dark:text-gray-400" />
                    <p>Log at least 2 tests to see your trend.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'path' && (
          <div className="space-y-6">
            <section className="bg-[#f3edf7] dark:bg-gray-800 rounded-[28px] p-6 transition-colors duration-300">
              <h2 className="text-lg font-medium flex items-center gap-2 mb-6 text-[#1c1b1f] dark:text-gray-100">
                <BookOpen className="w-6 h-6 text-[#6750a4] dark:text-purple-400" />
                Path Travelled (Saved Sessions)
              </h2>
              
              {savedSessions.length > 0 ? (
                <div className="space-y-4">
                  {savedSessions.map(session => (
                    <div key={session.id} className="bg-[#fdfcff] dark:bg-gray-900 rounded-[24px] p-5 shadow-sm border border-[#cac4d0] dark:border-gray-700 transition-colors duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            session.mode === 'work' ? 'bg-[#eaddff] text-[#21005d] dark:bg-purple-900/50 dark:text-purple-200' : 'bg-[#d3e3fd] text-[#001d35] dark:bg-blue-900/50 dark:text-blue-200'
                          }`}>
                            {session.mode === 'work' ? <Target className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-[#1c1b1f] dark:text-gray-100 capitalize">{session.mode} Session</p>
                              {session.productivity && (
                                <div className={`w-3 h-3 rounded-full ${
                                  session.productivity === 'green' ? 'bg-green-500' :
                                  session.productivity === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                                }`} title={`Productivity: ${session.productivity}`} />
                              )}
                            </div>
                            <p className="text-xs text-[#49454f] dark:text-gray-400">
                              {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <div className="text-sm font-medium text-[#6750a4] dark:text-purple-400 bg-[#ece6f0] dark:bg-gray-800 px-3 py-1 rounded-full">
                            {Math.round(session.duration / 60)} min
                          </div>
                          <button
                            onClick={() => setSavedSessions(prev => prev.filter(s => s.id !== session.id))}
                            className="p-1.5 text-[#ba1a1a] dark:text-red-400 hover:bg-[#ffdad6] dark:hover:bg-red-900/50 rounded-full transition-colors"
                            title="Delete Session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {session.progressNotes && (
                          <div className="bg-[#ece6f0] dark:bg-gray-800 rounded-[16px] p-4">
                            <h4 className="text-xs font-medium text-[#49454f] dark:text-gray-400 uppercase tracking-wider mb-2">Progress</h4>
                            <p className="text-sm text-[#1c1b1f] dark:text-gray-100 whitespace-pre-wrap">{session.progressNotes}</p>
                          </div>
                        )}
                        {session.distractionNotes && (
                          <div className="bg-[#ffdad6] dark:bg-red-900/20 rounded-[16px] p-4">
                            <h4 className="text-xs font-medium text-[#410002] dark:text-red-300 uppercase tracking-wider mb-2">Distractions</h4>
                            <p className="text-sm text-[#1c1b1f] dark:text-gray-100 whitespace-pre-wrap">{session.distractionNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#49454f] dark:text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-[#cac4d0] dark:text-gray-600" />
                  <p>No saved sessions yet.</p>
                  <p className="text-sm">Complete a focus or break session and save it to see your history here.</p>
                </div>
              )}
            </section>
          </div>
        )}

      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#fdfcff] dark:bg-gray-900 border-t border-[#cac4d0] dark:border-gray-700 flex justify-around items-center pb-[env(safe-area-inset-bottom)] pt-2 px-2 z-40 transition-colors duration-300">
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex flex-col items-center p-2 min-w-[64px] rounded-xl transition-colors ${
            activeTab === 'plan' ? 'text-[#21005d] dark:text-purple-300' : 'text-[#49454f] dark:text-gray-400 hover:bg-[#ece6f0] dark:hover:bg-gray-800'
          }`}
        >
          <div className={`px-4 py-1 rounded-full mb-1 transition-colors ${activeTab === 'plan' ? 'bg-[#eaddff] dark:bg-purple-900/80' : 'bg-transparent'}`}>
            <Calendar className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-medium">Plan</span>
        </button>
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`flex flex-col items-center p-2 min-w-[64px] rounded-xl transition-colors ${
            activeTab === 'syllabus' ? 'text-[#21005d] dark:text-purple-300' : 'text-[#49454f] dark:text-gray-400 hover:bg-[#ece6f0] dark:hover:bg-gray-800'
          }`}
        >
          <div className={`px-4 py-1 rounded-full mb-1 transition-colors ${activeTab === 'syllabus' ? 'bg-[#eaddff] dark:bg-purple-900/80' : 'bg-transparent'}`}>
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-medium">Syllabus</span>
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`flex flex-col items-center p-2 min-w-[64px] rounded-xl transition-colors ${
            activeTab === 'tests' ? 'text-[#21005d] dark:text-purple-300' : 'text-[#49454f] dark:text-gray-400 hover:bg-[#ece6f0] dark:hover:bg-gray-800'
          }`}
        >
          <div className={`px-4 py-1 rounded-full mb-1 transition-colors ${activeTab === 'tests' ? 'bg-[#eaddff] dark:bg-purple-900/80' : 'bg-transparent'}`}>
            <Activity className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-medium">Tests</span>
        </button>
        <button
          onClick={() => setActiveTab('path')}
          className={`flex flex-col items-center p-2 min-w-[64px] rounded-xl transition-colors ${
            activeTab === 'path' ? 'text-[#21005d] dark:text-purple-300' : 'text-[#49454f] dark:text-gray-400 hover:bg-[#ece6f0] dark:hover:bg-gray-800'
          }`}
        >
          <div className={`px-4 py-1 rounded-full mb-1 transition-colors ${activeTab === 'path' ? 'bg-[#eaddff] dark:bg-purple-900/80' : 'bg-transparent'}`}>
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-medium">Path</span>
        </button>
      </div>

      {/* Chapter Confidence Rating Modal */}
      {chapterToRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#fdfcff] dark:bg-gray-900 rounded-[28px] p-6 w-full max-w-md shadow-xl border border-[#cac4d0] dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-medium mb-2 text-[#1c1b1f] dark:text-gray-100 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              Rate Your Confidence
            </h2>
            <p className="text-sm text-[#49454f] dark:text-gray-400 mb-6">
              How confident are you in this chapter? This helps calculate when you should revise it next.
            </p>
            
            <div className="flex justify-between gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => handleRateChapter(score)}
                  className="flex flex-col items-center gap-2 flex-1 group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#ece6f0] dark:bg-gray-800 flex items-center justify-center group-hover:bg-[#eaddff] dark:group-hover:bg-purple-900/50 group-hover:text-[#21005d] dark:group-hover:text-purple-300 transition-colors border border-transparent group-hover:border-[#6750a4] dark:group-hover:border-purple-500">
                    <span className="text-lg font-bold">{score}</span>
                  </div>
                  <span className="text-xs text-[#49454f] dark:text-gray-400 font-medium">
                    {score === 1 && 'Low'}
                    {score === 3 && 'Medium'}
                    {score === 5 && 'High'}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setChapterToRate(null)}
                className="flex-1 py-3 rounded-full font-medium text-[#49454f] dark:text-gray-300 bg-[#ece6f0] dark:bg-gray-800 hover:bg-[#e8def8] dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Timer Overlay */}
      {isFullscreenTimer && (
        <div className="fixed inset-0 z-[100] bg-[#fdfcff] dark:bg-gray-900 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <button 
            onClick={() => setIsFullscreenTimer(false)}
            className="absolute top-6 right-6 p-3 text-[#49454f] dark:text-gray-400 hover:bg-[#eaddff] dark:hover:bg-gray-800 rounded-full transition-colors"
            title="Minimize Timer"
          >
            <Minimize className="w-6 h-6" />
          </button>
          
          <div className="text-2xl font-medium text-[#6750a4] dark:text-purple-400 mb-12 tracking-widest uppercase">
            {timerMode === 'work' ? 'Focus Session' : 'Break Time'}
          </div>

          <FlipClock time={timerTime} />

          <div className="flex gap-6 mt-12">
            <button 
              onClick={toggleTimer}
              className="w-20 h-20 rounded-full bg-[#6750a4] hover:bg-[#4f378b] text-white flex items-center justify-center transition-colors shadow-lg"
            >
              {isTimerRunning ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-2" />}
            </button>
            <button 
              onClick={() => {
                resetTimer();
                setIsFullscreenTimer(false);
              }}
              className="w-20 h-20 rounded-full bg-[#ece6f0] dark:bg-gray-800 hover:bg-[#e8def8] dark:hover:bg-gray-700 text-[#49454f] dark:text-gray-300 flex items-center justify-center transition-colors shadow-lg"
            >
              <RotateCcw className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}

      {/* Session Logging Modal */}
      {isTimerSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#fdfcff] dark:bg-gray-900 rounded-[28px] p-6 w-full max-w-sm shadow-xl border border-[#cac4d0] dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-medium mb-6 text-[#1c1b1f] dark:text-gray-100 flex items-center gap-2">
              <Settings className="w-6 h-6 text-[#6750a4] dark:text-purple-400" />
              Timer Settings
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#49454f] dark:text-gray-300 mb-2">Focus Duration (minutes)</label>
                <input 
                  type="number" 
                  min="1"
                  max="120"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(Math.max(1, parseInt(e.target.value) || 25))}
                  className="w-full bg-[#ece6f0] dark:bg-gray-800 border-none rounded-[16px] px-4 py-3 text-[#1c1b1f] dark:text-gray-100 focus:ring-2 focus:ring-[#6750a4] dark:focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#49454f] dark:text-gray-300 mb-2">Break Duration (minutes)</label>
                <input 
                  type="number" 
                  min="1"
                  max="60"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(Math.max(1, parseInt(e.target.value) || 5))}
                  className="w-full bg-[#ece6f0] dark:bg-gray-800 border-none rounded-[16px] px-4 py-3 text-[#1c1b1f] dark:text-gray-100 focus:ring-2 focus:ring-[#6750a4] dark:focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => {
                  setIsTimerSettingsOpen(false);
                  resetTimer();
                }}
                className="px-6 py-2.5 rounded-full text-sm font-medium bg-[#6750a4] hover:bg-[#4f378b] text-white transition-colors"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoggingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#fdfcff] dark:bg-gray-900 rounded-[28px] p-6 w-full max-w-md shadow-xl border border-[#cac4d0] dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-medium mb-6 text-[#1c1b1f] dark:text-gray-100 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-[#6750a4] dark:text-purple-400" />
              Log Session
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#49454f] dark:text-gray-300 mb-2 uppercase tracking-wider">Productivity Rating</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSessionProductivity('green')}
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors border-2 ${
                      sessionProductivity === 'green' 
                        ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300' 
                        : 'border-transparent bg-[#ece6f0] dark:bg-gray-800 text-[#49454f] dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/10'
                    }`}
                  >
                    Great
                  </button>
                  <button
                    onClick={() => setSessionProductivity('yellow')}
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors border-2 ${
                      sessionProductivity === 'yellow' 
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-300' 
                        : 'border-transparent bg-[#ece6f0] dark:bg-gray-800 text-[#49454f] dark:text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10'
                    }`}
                  >
                    Okay
                  </button>
                  <button
                    onClick={() => setSessionProductivity('red')}
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors border-2 ${
                      sessionProductivity === 'red' 
                        ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300' 
                        : 'border-transparent bg-[#ece6f0] dark:bg-gray-800 text-[#49454f] dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10'
                    }`}
                  >
                    Poor
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#49454f] dark:text-gray-300 mb-2 uppercase tracking-wider">Progress Notes</label>
                <textarea 
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  placeholder="What did you accomplish?"
                  className="w-full h-24 bg-[#ece6f0] dark:bg-gray-800 border-none rounded-[16px] p-4 resize-none focus:ring-2 focus:ring-[#6750a4] text-[#1c1b1f] dark:text-gray-100 placeholder-[#79747e] dark:placeholder-gray-500 outline-none transition-shadow"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#49454f] dark:text-gray-300 mb-2 uppercase tracking-wider">Distractions</label>
                <textarea 
                  value={distractionNotes}
                  onChange={(e) => setDistractionNotes(e.target.value)}
                  placeholder="Any distracting thoughts or interruptions?"
                  className="w-full h-20 bg-[#ece6f0] dark:bg-gray-800 border-none rounded-[16px] p-4 resize-none focus:ring-2 focus:ring-[#6750a4] text-[#1c1b1f] dark:text-gray-100 placeholder-[#79747e] dark:placeholder-gray-500 outline-none transition-shadow"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setIsLoggingSession(false)}
                className="flex-1 py-3 rounded-full font-medium text-[#49454f] dark:text-gray-300 bg-[#ece6f0] dark:bg-gray-800 hover:bg-[#e8def8] dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveSession}
                className="flex-1 py-3 rounded-full font-medium text-white bg-[#6750a4] hover:bg-[#4f378b] transition-colors"
              >
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
