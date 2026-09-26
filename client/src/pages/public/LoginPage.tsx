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
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { apiLogin, apiRegister, setAuthToken, setStoredUser } from '../../services/api';

interface LoginPageProps {
  onNavigate: (tab: string) => void;
  currentUser: any;
  onLoginSuccess: (user: any) => void;
  initialRole?: 'public' | 'researcher' | 'admin';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  currentUser,
  onLoginSuccess,
  initialRole = 'public'
}) => {
  const [selectedRole, setSelectedRole] = useState<'public' | 'researcher' | 'admin'>(initialRole);
  const [isRegistering, setIsRegistering] = useState(false);

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(4,10,24,0.88)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    paddingTop: '13px',
    paddingBottom: '13px',
    paddingRight: '16px',
    fontSize: '13px',
    color: '#FFFFFF',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.18s',
  };

  const portals: Array<{ role: 'public' | 'researcher' | 'admin'; icon: React.ReactNode; label: string; sub: string }> = [
    { role: 'public',     icon: <Globe size={22} />,       label: 'PUBLIC',     sub: 'Explore & Learn'  },
    { role: 'researcher', icon: <FlaskConical size={22} />, label: 'RESEARCHER', sub: 'Upload & Manage'  },
    { role: 'admin',      icon: <ShieldCheck size={22} />,  label: 'ADMIN',      sub: 'Verify & Govern'  },
  ];

  return (
    <div
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', position: 'relative' }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#060c18]/60 via-[#071426]/80 to-[#040812]/90 pointer-events-none" />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '460px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button
            onClick={() => onNavigate('home')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#CBD5E1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#00F0FF'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#CBD5E1'; }}
          >
            <ArrowLeft size={15} />
            Back to DHRUVA Portal
          </button>
          {currentUser && (
            <span style={{ fontSize: '11px', fontWeight: 500, padding: '4px 12px', borderRadius: '9999px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34D399' }}>
              Logged in as {currentUser.name} ({currentUser.role})
            </span>
          )}
        </div>

        {/* Main card */}
        <div style={{
          background: 'rgba(6,18,42,0.93)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '2rem 2rem 1.75rem',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,240,255,0.04)',
        }}>

          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%', background: '#FFFFFF',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 3px rgba(56,189,248,0.3), 0 8px 24px rgba(0,0,0,0.45)',
                flexShrink: 0,
              }}>
                <img src="/images/dhruva-logo.png" alt="DHRUVA" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              </div>
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.65rem,4vw,2.1rem)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.12, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
              Welcome to{' '}
              <span style={{ background: 'linear-gradient(135deg,#00F0FF 0%,#38BDF8 55%,#818CF8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                DHRUVA
              </span>
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'rgba(203,213,225,0.82)', lineHeight: 1.65, maxWidth: '340px', margin: '0 auto' }}>
              Access India's Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Platform
            </p>
          </div>

          {/* Portal selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748B', marginBottom: '10px' }}>
              Select Your Portal
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {portals.map(({ role, icon, label, sub }) => {
                const active = selectedRole === role;
                return (
                  <button key={role} type="button" onClick={() => setDemoCredentials(role)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '14px 6px 12px', borderRadius: '12px', cursor: 'pointer', gap: '5px',
                      border: active ? '1.5px solid rgba(0,240,255,0.7)' : '1px solid rgba(255,255,255,0.07)',
                      background: active ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.03)',
                      boxShadow: active ? '0 0 20px rgba(0,240,255,0.14), inset 0 1px 0 rgba(0,240,255,0.1)' : 'none',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <span style={{ color: active ? '#00F0FF' : '#64748B', transition: 'color 0.18s', marginBottom: '2px' }}>{icon}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', color: active ? '#FFFFFF' : '#94A3B8', fontFamily: 'var(--font-heading)' }}>{label}</span>
                    <span style={{ fontSize: '10px', color: active ? 'rgba(0,240,255,0.7)' : '#475569', lineHeight: 1.25 }}>{sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Demo banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.22)', marginBottom: '18px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 600, color: '#67E8F9' }}>
              <Sparkles size={13} style={{ color: '#00F0FF' }} />
              Demo Credentials Loaded for {selectedRole.toUpperCase()}
            </span>
            <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>Ready to Sign In</span>
          </div>

          {/* Errors / Success */}
          {errorMessage && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '11px 13px', borderRadius: '10px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', marginBottom: '14px' }}>
              <AlertCircle size={15} style={{ color: '#FB7185', flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '12px', color: '#FCA5A5' }}>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '11px 13px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '14px' }}>
              <CheckCircle2 size={15} style={{ color: '#34D399', flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '12px', color: '#6EE7B7' }}>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {isRegistering && (
              <div style={{ marginBottom: '13px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dr. Rajesh Sharma"
                    style={{ ...inputStyle, paddingLeft: '42px' }}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(0,240,255,0.5)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }} />
                </div>
              </div>
            )}

            {isRegistering && selectedRole === 'researcher' && (
              <div style={{ marginBottom: '13px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>Institution / Organization</label>
                <div style={{ position: 'relative' }}>
                  <Building size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
                  <input type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="e.g. NCAOR / IIT Bombay / IISC"
                    style={{ ...inputStyle, paddingLeft: '42px' }}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(0,240,255,0.5)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }} />
                </div>
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: '13px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>Email Address or Username</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
                <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@organization.gov.in"
                  style={{ ...inputStyle, paddingLeft: '42px' }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(0,240,255,0.5)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#CBD5E1' }}>Password</label>
                {!isRegistering && (
                  <button type="button"
                    onClick={() => alert('Password reset is managed through your institution single sign-on or system administrator.')}
                    style={{ fontSize: '12px', color: '#00F0FF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Forgot Password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
                <input type={showPassword ? 'text' : 'password'} autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••"
                  style={{ ...inputStyle, paddingLeft: '42px', paddingRight: '46px' }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(0,240,255,0.5)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 0, display: 'flex', alignItems: 'center' }}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Sign In button */}
            <button type="submit" disabled={isLoading}
              style={{
                width: '100%', height: '52px', borderRadius: '12px', border: 'none',
                background: isLoading ? 'rgba(0,240,255,0.35)' : 'linear-gradient(135deg, #00E5FF 0%, #0BC5EB 55%, #0284C7 100%)',
                color: '#020617', fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: isLoading ? 'none' : '0 0 30px rgba(0,229,255,0.38), 0 4px 16px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease', fontFamily: 'var(--font-heading)',
              }}>
              {isLoading ? (
                <>
                  <span style={{ width: '18px', height: '18px', border: '2px solid #020617', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'lp-spin 0.7s linear infinite' }} />
                  Authenticating...
                </>
              ) : (
                <>
                  <span>{isRegistering ? `Register as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}` : `Sign In to ${selectedRole.toUpperCase()} Portal`}</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Register toggle */}
          {selectedRole !== 'admin' && (
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#94A3B8' }}>
                {isRegistering ? (
                  <>Already have an account?{' '}
                    <button type="button" onClick={() => setIsRegistering(false)}
                      style={{ color: '#00F0FF', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                      Sign In
                    </button>
                  </>
                ) : (
                  <>Don't have an account?{' '}
                    <button type="button" onClick={() => setIsRegistering(true)}
                      style={{ color: '#00F0FF', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                      Create {selectedRole === 'researcher' ? 'Researcher' : 'Public Explorer'} Account
                    </button>
                  </>
                )}
              </p>
            </div>
          )}

          {/* NCPOR footer */}
          <div style={{ marginTop: '18px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
              National Centre for Polar and Ocean Research (NCPOR) &middot; Ministry of Earth Sciences
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes lp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
