import React, { useState, useEffect } from 'react';
import { User, Classroom } from '../types';
import {
  X,
  LogIn,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  School,
  Lock,
  Mail,
  User as UserIcon,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  KeyRound,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onAuthSuccess: (user: User, classroom: Classroom, message: string) => void;
  classrooms: Classroom[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onAuthSuccess,
  classrooms,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Demo accounts
  const [demoUsers, setDemoUsers] = useState<any[]>([]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupDepartment, setSignupDepartment] = useState('Computer Science');
  const [signupRollNumber, setSignupRollNumber] = useState('');
  
  // Single classroom enrollment choice
  const [enrollmentMode, setEnrollmentMode] = useState<'code' | 'select' | 'create'>('code');
  const [classroomCode, setClassroomCode] = useState('BTECH26A');
  const [selectedClassroomId, setSelectedClassroomId] = useState(classrooms[0]?.id || 'cls-1');
  
  // New classroom state if creating during signup
  const [newCourseName, setNewCourseName] = useState('B.Tech Data Science');
  const [newCollegeName, setNewCollegeName] = useState('Stanford University');
  const [newBatchYear, setNewBatchYear] = useState('2026');
  const [newSection, setNewSection] = useState('Section A');

  useEffect(() => {
    setMode(initialMode);
    setErrorMessage(null);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/auth/demo-users')
        .then((res) => res.json())
        .then((data) => setDemoUsers(data))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      confetti({ particleCount: 40, spread: 60 });
      onAuthSuccess(data.user, data.classroom, data.message || 'Logged in successfully!');
      onClose();
    } catch (err: any) {
      setErrorMessage('Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (!signupName.trim() || !signupEmail.trim()) {
      setErrorMessage('Please fill in your name and university email.');
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword.trim() || 'password123',
        department: signupDepartment.trim(),
        rollNumber: signupRollNumber.trim() || `STU${Math.floor(1000 + Math.random() * 9000)}`,
        classroomOption: enrollmentMode === 'create' ? 'create' : enrollmentMode === 'code' ? 'join' : 'select',
      };

      if (enrollmentMode === 'code') {
        payload.classroomCode = classroomCode.trim();
      } else if (enrollmentMode === 'select') {
        payload.classroomId = selectedClassroomId;
      } else if (enrollmentMode === 'create') {
        payload.newClassroomData = {
          course: newCourseName,
          collegeName: newCollegeName,
          department: signupDepartment,
          batchYear: newBatchYear,
          section: newSection,
          selectedSubjects: [
            'Data Structures (CS301)',
            'Operating Systems (CS302)',
            'Computer Networks (CS304)',
          ],
        };
      }

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to create account.');
        setLoading(false);
        return;
      }

      confetti({ particleCount: 60, spread: 70 });
      onAuthSuccess(data.user, data.classroom, data.message || 'Account created successfully!');
      onClose();
    } catch (err) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user: any) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        confetti({ particleCount: 35, spread: 50 });
        onAuthSuccess(data.user, data.classroom, `Logged in as ${data.user.name} (${data.user.role})`);
        onClose();
      }
    } catch (err) {
      setErrorMessage('Failed to switch demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-full bg-[#FDFCF8] text-[#1b1c1c] overflow-y-auto flex flex-col min-h-screen animate-in fade-in duration-200">
      {/* Sticky Full-Width Header Bar */}
      <header className="sticky top-0 z-20 w-full px-4 sm:px-8 md:px-12 py-4 sm:py-5 bg-white/95 backdrop-blur-md border-b border-[#E5E4E2] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0EDED] hover:bg-[#E4E2E1] text-[#2d312e] hover:text-[#1b1c1c] text-sm sm:text-base font-bold transition-colors cursor-pointer shadow-xs"
            title="Back to previous screen"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Previous Screen</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#d9e6dc] text-[#56615a] flex items-center justify-center font-bold shadow-xs">
            <School className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg sm:text-xl font-black text-[#1b1c1c] tracking-tight">
              Academic Sanctuary
            </h1>
            <p className="text-xs text-[#737874] font-medium">Classroom Cohort Access Portal</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#56615a] hover:text-[#1b1c1c] hover:bg-[#F0EDED] text-sm sm:text-base font-bold transition-colors cursor-pointer"
          title="Close Auth Portal"
        >
          <span className="hidden sm:inline">Close</span>
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Full-Page Content Area */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-10 py-8 md:py-12 flex-grow flex flex-col gap-8">
        {/* Large Visible Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-[#EAE8E7] rounded-2xl text-base sm:text-lg font-bold shadow-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`py-3.5 sm:py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-[#1b1c1c] shadow-sm font-extrabold ring-1 ring-black/5'
                : 'text-[#56615a] hover:text-[#1b1c1c]'
            }`}
          >
            <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`py-3.5 sm:py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-[#1b1c1c] shadow-sm font-extrabold ring-1 ring-black/5'
                : 'text-[#56615a] hover:text-[#1b1c1c]'
            }`}
          >
            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Section Title */}
        <div>
          {mode === 'login' ? (
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1b1c1c] tracking-tight mb-2">
                Sign In to Your Classroom
              </h2>
              <p className="text-base sm:text-lg text-[#56615a]">
                Access course notes, question banks, scheduled exams, and your classmates.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1b1c1c] tracking-tight mb-2">
                Create Your Student Profile
              </h2>
              <p className="text-base sm:text-lg text-[#56615a]">
                Join your cohort or create a brand new classroom sanctuary.
              </p>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 sm:p-5 bg-[#ffdad6] border-2 border-[#ffb4ab] rounded-2xl text-sm sm:text-base font-bold text-[#ba1a1a] flex items-center gap-3 shadow-xs">
            <Info className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Demo Switcher with Big, Visible Cards */}
        <div className="bg-[#F0EDED]/90 border-2 border-[#E5E4E2] rounded-3xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <span className="text-sm sm:text-base font-extrabold text-[#434844] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#56642b]" />
              Instant Demo Profiles (1-Click Sign In)
            </span>
            <span className="text-xs sm:text-sm text-[#737874] font-medium">
              No password needed for quick evaluation
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {demoUsers.slice(0, 4).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickLogin(u)}
                disabled={loading}
                className="p-3.5 sm:p-4 bg-white hover:bg-[#d9e6dc]/40 border-2 border-[#E5E4E2] hover:border-[#56615a] rounded-2xl text-left transition-all flex items-center gap-3.5 group cursor-pointer shadow-xs"
              >
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#C3C8C3] flex-shrink-0 shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-grow">
                  <div className="text-base sm:text-lg font-bold text-[#1b1c1c] truncate group-hover:text-[#56615a]">
                    {u.name}
                  </div>
                  <div className="text-xs sm:text-sm text-[#737874] font-medium truncate">
                    {u.role === 'super_admin'
                      ? 'Super Admin'
                      : u.role === 'admin'
                      ? 'Admin'
                      : 'Student'}{' '}
                    • {u.classroomCode || 'Cohort'}
                  </div>
                </div>
                <div className="ml-auto px-3.5 py-1.5 rounded-xl bg-[#F0EDED] group-hover:bg-[#56615a] group-hover:text-white text-xs sm:text-sm font-bold text-[#56615a] transition-colors flex-shrink-0 flex items-center gap-1">
                  <span>Log In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {mode === 'login' ? (
          /* Sign In Form with Big Inputs and Action Buttons */
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label className="text-sm sm:text-base font-bold text-[#2d312e] uppercase tracking-wide block mb-2">
                University / Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-[#56615a] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah.j@oxford.edu"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="paper-input w-full pl-12 sm:pl-14 pr-4 py-4 text-base sm:text-lg rounded-2xl bg-white border-2 border-[#D8D6D4] text-[#1b1c1c] font-medium shadow-xs focus:outline-none focus:border-[#56615a] focus:ring-2 focus:ring-[#56615a]/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm sm:text-base font-bold text-[#2d312e] uppercase tracking-wide block">
                  Password
                </label>
                <span className="text-xs sm:text-sm text-[#737874] font-medium">
                  Default test password: <code className="bg-[#EAE8E7] px-2 py-0.5 rounded font-mono font-bold text-xs">password123</code>
                </span>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-[#56615a] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password..."
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="paper-input w-full pl-12 sm:pl-14 pr-12 py-4 text-base sm:text-lg rounded-2xl bg-white border-2 border-[#D8D6D4] text-[#1b1c1c] font-medium shadow-xs focus:outline-none focus:border-[#56615a] focus:ring-2 focus:ring-[#56615a]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737874] hover:text-[#1b1c1c] p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4.5 sm:py-5 bg-[#56615a] hover:bg-[#3e4641] disabled:opacity-50 text-white font-extrabold text-base sm:text-xl rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 cursor-pointer"
              >
                <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>{loading ? 'Authenticating Profile...' : 'Sign In to My Classroom'}</span>
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-sm sm:text-base text-[#737874]">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                  }}
                  className="font-bold text-[#56615a] hover:underline cursor-pointer ml-1"
                >
                  Create Account & Join a Classroom →
                </button>
              </p>
            </div>
          </form>
        ) : (
          /* Sign Up Form with Big Inputs, Cohort Selectors, and Action Button */
          <form onSubmit={handleSignupSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="text-sm sm:text-base font-bold text-[#2d312e] uppercase tracking-wide block mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#56615a] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Elena Rostova"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="paper-input w-full pl-12 sm:pl-14 pr-4 py-4 text-base sm:text-lg rounded-2xl bg-white border-2 border-[#D8D6D4] text-[#1b1c1c] font-medium shadow-xs focus:outline-none focus:border-[#56615a]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm sm:text-base font-bold text-[#2d312e] uppercase tracking-wide block mb-2">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-[#56615a] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. elena.r@oxford.edu"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="paper-input w-full pl-12 sm:pl-14 pr-4 py-4 text-base sm:text-lg rounded-2xl bg-white border-2 border-[#D8D6D4] text-[#1b1c1c] font-medium shadow-xs focus:outline-none focus:border-[#56615a]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="text-sm sm:text-base font-bold text-[#2d312e] uppercase tracking-wide block mb-2">
                  Department / Discipline
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science & Engineering"
                  value={signupDepartment}
                  onChange={(e) => setSignupDepartment(e.target.value)}
                  className="paper-input w-full px-4 py-4 text-base sm:text-lg rounded-2xl bg-white border-2 border-[#D8D6D4] text-[#1b1c1c] font-medium shadow-xs focus:outline-none focus:border-[#56615a]"
                />
              </div>

              <div>
                <label className="text-sm sm:text-base font-bold text-[#2d312e] uppercase tracking-wide block mb-2">
                  Roll / Registration No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS22B029"
                  value={signupRollNumber}
                  onChange={(e) => setSignupRollNumber(e.target.value)}
                  className="paper-input w-full px-4 py-4 text-base sm:text-lg rounded-2xl bg-white border-2 border-[#D8D6D4] text-[#1b1c1c] font-medium shadow-xs focus:outline-none focus:border-[#56615a]"
                />
              </div>
            </div>

            <div>
              <label className="text-sm sm:text-base font-bold text-[#2d312e] uppercase tracking-wide block mb-2">
                Account Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-[#56615a] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password (or leave blank for password123)..."
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="paper-input w-full pl-12 sm:pl-14 pr-12 py-4 text-base sm:text-lg rounded-2xl bg-white border-2 border-[#D8D6D4] text-[#1b1c1c] font-medium shadow-xs focus:outline-none focus:border-[#56615a]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737874] hover:text-[#1b1c1c] p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Strict 1-Classroom Assignment Section */}
            <div className="p-5 sm:p-7 bg-[#d9e6dc]/30 border-2 border-[#b2beb5] rounded-3xl space-y-4 shadow-xs">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-6 h-6 text-[#56615a]" />
                <span className="text-base sm:text-lg font-extrabold text-[#1b1c1c] uppercase tracking-wide">
                  Single Classroom Cohort Assignment
                </span>
              </div>
              <p className="text-sm sm:text-base text-[#434844] leading-relaxed">
                In Academic Sanctuary, every student belongs to <strong>one specific classroom cohort</strong> for organized notes, syllabus, announcements, and exam schedules.
              </p>

              <div className="grid grid-cols-3 gap-3 text-center">
                <button
                  type="button"
                  onClick={() => setEnrollmentMode('code')}
                  className={`py-3.5 sm:py-4 px-2 rounded-2xl border-2 text-sm sm:text-base font-bold transition-all cursor-pointer ${
                    enrollmentMode === 'code'
                      ? 'bg-white border-[#56615a] text-[#1b1c1c] shadow-sm ring-2 ring-[#56615a]/20'
                      : 'bg-white/60 border-[#E5E4E2] text-[#737874] hover:bg-white'
                  }`}
                >
                  Enter Code
                </button>
                <button
                  type="button"
                  onClick={() => setEnrollmentMode('select')}
                  className={`py-3.5 sm:py-4 px-2 rounded-2xl border-2 text-sm sm:text-base font-bold transition-all cursor-pointer ${
                    enrollmentMode === 'select'
                      ? 'bg-white border-[#56615a] text-[#1b1c1c] shadow-sm ring-2 ring-[#56615a]/20'
                      : 'bg-white/60 border-[#E5E4E2] text-[#737874] hover:bg-white'
                  }`}
                >
                  Select Cohort
                </button>
                <button
                  type="button"
                  onClick={() => setEnrollmentMode('create')}
                  className={`py-3.5 sm:py-4 px-2 rounded-2xl border-2 text-sm sm:text-base font-bold transition-all cursor-pointer ${
                    enrollmentMode === 'create'
                      ? 'bg-white border-[#56615a] text-[#1b1c1c] shadow-sm ring-2 ring-[#56615a]/20'
                      : 'bg-white/60 border-[#E5E4E2] text-[#737874] hover:bg-white'
                  }`}
                >
                  Create New
                </button>
              </div>

              {enrollmentMode === 'code' && (
                <div className="space-y-2 pt-2">
                  <label className="text-sm sm:text-base font-bold text-[#434844] block">
                    Classroom Access Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BTECH26A"
                    value={classroomCode}
                    onChange={(e) => setClassroomCode(e.target.value.toUpperCase())}
                    className="paper-input w-full p-4 text-base sm:text-lg font-mono font-extrabold tracking-widest text-[#1b1c1c] uppercase rounded-2xl bg-white border-2 border-[#D8D6D4] shadow-xs"
                  />
                  <span className="text-xs sm:text-sm text-[#737874] block">
                    Tip: Try <code className="font-bold text-[#56615a] bg-white px-1.5 py-0.5 rounded border border-[#E5E4E2]">BTECH26A</code> (Oxford) or <code className="font-bold text-[#56615a] bg-white px-1.5 py-0.5 rounded border border-[#E5E4E2]">AIDS26A</code> (Stanford).
                  </span>
                </div>
              )}

              {enrollmentMode === 'select' && (
                <div className="space-y-2 pt-2">
                  <label className="text-sm sm:text-base font-bold text-[#434844] block">
                    Choose Your Cohort
                  </label>
                  <select
                    value={selectedClassroomId}
                    onChange={(e) => setSelectedClassroomId(e.target.value)}
                    className="w-full p-4 text-base sm:text-lg rounded-2xl bg-white border-2 border-[#D8D6D4] text-[#1b1c1c] font-bold shadow-xs cursor-pointer"
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.collegeName}) • Code: {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {enrollmentMode === 'create' && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs sm:text-sm font-bold text-[#434844] block mb-1">
                        Program / Course
                      </label>
                      <input
                        type="text"
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        className="paper-input w-full p-3.5 text-sm sm:text-base rounded-2xl bg-white border-2 border-[#D8D6D4]"
                      />
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-bold text-[#434844] block mb-1">
                        University / College
                      </label>
                      <input
                        type="text"
                        value={newCollegeName}
                        onChange={(e) => setNewCollegeName(e.target.value)}
                        className="paper-input w-full p-3.5 text-sm sm:text-base rounded-2xl bg-white border-2 border-[#D8D6D4]"
                      />
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-[#56642b] font-bold flex items-center gap-1.5 bg-white/80 p-3 rounded-xl border border-[#b2beb5]">
                    <ShieldCheck className="w-4 h-4 text-[#56642b] flex-shrink-0" />
                    <span>You will be registered as the Super Admin for this new cohort.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4.5 sm:py-5 bg-[#56615a] hover:bg-[#3e4641] disabled:opacity-50 text-white font-extrabold text-base sm:text-xl rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 cursor-pointer"
              >
                <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>{loading ? 'Creating Profile...' : 'Complete Registration & Join Cohort'}</span>
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-sm sm:text-base text-[#737874]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className="font-bold text-[#56615a] hover:underline cursor-pointer ml-1"
                >
                  Sign In Here →
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
