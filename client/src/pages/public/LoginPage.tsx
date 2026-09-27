import React, { useState, useEffect } from 'react';
import {
  Globe,
  FlaskConical,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  Mail,
  User,
  Building,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { apiLogin, apiRegister, setAuthToken, clearAuthToken, setStoredUser } from '../../services/api';
import { SignOutModal } from '../../components/SignOutModal';

interface LoginPageProps {
  onNavigate: (tab: string) => void;
  currentUser: any;
  onLoginSuccess: (user: any) => void;
  initialRole?: 'public' | 'researcher' | 'admin';
  onSignOut?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  currentUser,
  onLoginSuccess,
  initialRole = 'public',
  onSignOut,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward
}) => {
  const [selectedRole, setSelectedRole] = useState<'public' | 'researcher' | 'admin'>(initialRole);
  const [isRegistering, setIsRegistering] = useState(false);
  const [signOutWarningOpen, setSignOutWarningOpen] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const setDemoCredentials = (role: 'public' | 'researcher' | 'admin') => {
    setSelectedRole(role);
    setIsRegistering(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (role === 'admin') {
      setEmail('admin@dhruva.gov.in');
      setPassword('admin123');
    } else if (role === 'researcher') {
      setEmail('dr.ananya@ncaor.gov.in');
      setPassword('researcher123');
    } else {
      setEmail('student@dhruva.edu');
      setPassword('student123');
    }
  };

  useEffect(() => {
    setDemoCredentials(initialRole);
  }, [initialRole]);

  const handleSignOut = () => {
    clearAuthToken();
    const pubUser = { role: 'public', name: 'Public Explorer' };
    setStoredUser(pubUser);
    onLoginSuccess(pubUser);
    if (onSignOut) {
      onSignOut();
    }
    setSuccessMessage('Successfully signed out of session.');
    setSelectedRole('public');
    setEmail('student@dhruva.edu');
    setPassword('student123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) { setErrorMessage('Please enter your registered email address.'); return; }
    if (!password) { setErrorMessage('Please enter your password.'); return; }

    setIsLoading(true);
    try {
      if (isRegistering) {
        if (!name.trim()) { setErrorMessage('Please enter your full name.'); setIsLoading(false); return; }
        const res = await apiRegister({
          name: name.trim(), email: email.trim(), password,
          role: selectedRole === 'admin' ? 'public' : selectedRole,
          institution: institution.trim() || undefined
        });
        setAuthToken(res.token);
        setStoredUser(res.user);
        setSuccessMessage('Account registered successfully! Redirecting...');
        setTimeout(() => {
          onLoginSuccess(res.user);
          if (res.user.role === 'researcher') onNavigate('researcher-dashboard');
          else onNavigate('home');
        }, 800);
      } else {
        const res = await apiLogin(email.trim(), password, selectedRole);
        setAuthToken(res.token);
        setStoredUser(res.user);
        setSuccessMessage('Sign in successful. Welcome to DHRUVA.');
        setTimeout(() => {
          onLoginSuccess(res.user);
          if (res.user.role === 'admin') onNavigate('admin-dashboard');
          else if (res.user.role === 'researcher') onNavigate('researcher-dashboard');
          else onNavigate('home');
        }, 700);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const portals: Array<{ role: 'public' | 'researcher' | 'admin'; icon: React.ReactNode; label: string; sub: string }> = [
    { role: 'public', icon: <Globe size={20} />, label: 'Public User', sub: 'Explore & Read' },
    { role: 'researcher', icon: <FlaskConical size={20} />, label: 'Researcher', sub: 'Upload & Review' },
    { role: 'admin', icon: <ShieldCheck size={20} />, label: 'Admin', sub: 'Govern & Publish' },
  ];

  const isAuthenticated = currentUser && currentUser.role !== 'public';

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4 relative">
      {/* Soft aurora highlight background gradient - transparent to let polar compass watermark show through */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 45% at 50% 12%, rgba(2, 132, 199, 0.09) 0%, rgba(56, 189, 248, 0.03) 50%, transparent 80%)'
        }}
      />

      <div className="relative z-10 w-full max-w-[480px]">
        {/* Main Card (Popup Modal) */}
        <div
          className="rounded-3xl p-6 sm:p-8 transition-all relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(14, 116, 144, 0.18)',
            boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(14, 116, 144, 0.06)'
          }}
        >
          {/* Back Button inside the popup modal */}
          <button
            type="button"
            onClick={() => {
              if (onGoBack && canGoBack) {
                onGoBack();
              } else {
                onNavigate('home');
              }
            }}
            title="Go back to previous page"
            aria-label="Go back to previous page"
            className="absolute top-5 left-5 sm:top-6 sm:left-6 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 group text-slate-700 bg-white/95 shadow-xs border border-slate-200/80 hover:bg-gradient-to-tr hover:from-sky-500 hover:to-cyan-600 hover:text-white hover:border-transparent hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer z-20"
          >
            <ArrowLeft size={16} strokeWidth={2.4} className="transition-transform group-hover:-translate-x-0.5" />
          </button>

          {/* Brand Header */}
          <div className="text-center mb-6 pt-1">
            <div className="inline-flex items-center justify-center mb-3">
              <div
                className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-md"
                style={{
                  border: '2px solid rgba(14, 116, 144, 0.2)',
                  boxShadow: '0 6px 20px rgba(2, 132, 199, 0.15)'
                }}
              >
                <img
                  src="/images/dhruva-logo.png"
                  alt="DHRUVA"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">
              Welcome to <span className="dhruva-brand-text">DHRUVA</span>
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              India's Polar Science Outreach, Knowledge Repository and Media Dissemination Platform
            </p>
          </div>

          {/* Active Session Card (when logged in) */}
          {isAuthenticated && (
            <div className="mb-5 p-3.5 rounded-2xl bg-sky-50/90 border border-sky-200/90 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-sky-200 flex items-center justify-center text-sky-600 shrink-0 shadow-2xs">
                  {currentUser.role === 'admin' ? (
                    <ShieldCheck size={18} className="text-rose-600" />
                  ) : (
                    <FlaskConical size={18} className="text-sky-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 whitespace-nowrap">
                      {currentUser.role}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Session
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1 break-words">
                    {currentUser.name || currentUser.email}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Portal Selector */}
          <div className="mb-4">
            <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2 flex items-center justify-between">
              <span>Select Sign In Portal</span>
              <span className="text-[10px] text-sky-600 font-medium">Specific role access</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {portals.map(({ role, icon, label, sub }) => {
                const active = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setDemoCredentials(role)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      active
                        ? 'bg-sky-50/90 border-sky-500 text-sky-700 shadow-sm shadow-sky-500/10'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70 text-slate-600'
                    }`}
                  >
                    <span className={`mb-1.5 ${active ? 'text-sky-600' : 'text-slate-400'}`}>
                      {icon}
                    </span>
                    <span className={`text-xs font-bold font-heading ${active ? 'text-slate-900' : 'text-slate-700'}`}>
                      {label}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      {sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Errors / Success */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-4">
              <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs mb-4">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                    <User size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    style={{ paddingLeft: '44px', paddingRight: '16px', fontSize: '13.5px' }}
                    className="w-full py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/15 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            {isRegistering && selectedRole === 'researcher' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institution / Organization
                </label>
                <div className="relative">
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                    <Building size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. NCPOR / IIT Bombay / IISC"
                    style={{ paddingLeft: '44px', paddingRight: '16px', fontSize: '13.5px' }}
                    className="w-full py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/15 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address or Username
              </label>
              <div className="relative">
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.gov.in"
                  style={{ paddingLeft: '44px', paddingRight: '16px', fontSize: '13.5px' }}
                  className="w-full py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/15 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={() => alert('Password reset is managed through your institution single sign-on or system administrator.')}
                    className="text-xs text-sky-600 hover:text-sky-700 transition-colors font-medium cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} className="text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  style={{ paddingLeft: '44px', paddingRight: '44px', fontSize: '13.5px' }}
                  className="w-full py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/15 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 flex items-center justify-center"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-11 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                isLoading
                  ? 'bg-sky-400 cursor-not-allowed opacity-80'
                  : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 shadow-sky-600/20 active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>
                    {isRegistering
                      ? `Register as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
                      : `Sign In to ${selectedRole.toUpperCase()} Portal`}
                  </span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Register / Sign In toggle */}
          {selectedRole !== 'admin' && (
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500">
                {isRegistering ? (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsRegistering(false)}
                      className="text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsRegistering(true)}
                      className="text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
                    >
                      Create {selectedRole === 'researcher' ? 'Researcher' : 'Public Explorer'} Account
                    </button>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Active User Information */}
          {isAuthenticated && (
            <div className="mt-4 pt-3 border-t border-slate-100 text-center px-2">
              <p className="text-xs text-slate-600 font-medium break-words leading-relaxed">
                Signed in as <span className="font-semibold text-slate-900">{currentUser.name || currentUser.email}</span>
                {currentUser.role ? (
                  <span className="text-slate-500 font-normal"> ({currentUser.role === 'admin' ? 'Admin Reviewer' : currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)})</span>
                ) : null}
              </p>
            </div>
          )}

          {/* NCPOR Footer */}
          <div className="mt-5 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              National Centre for Polar and Ocean Research (NCPOR) &middot; Ministry of Earth Sciences
            </p>
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Warning Dialog */}
      <SignOutModal
        isOpen={signOutWarningOpen}
        onClose={() => setSignOutWarningOpen(false)}
        onConfirm={handleSignOut}
        userName={currentUser?.name}
        userRole={currentUser?.role}
      />
    </div>
  );
};
