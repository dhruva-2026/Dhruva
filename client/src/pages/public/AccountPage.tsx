import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  BookOpen,
  Shield,
  ShieldCheck,
  FlaskConical,
  Globe,
  Clock,
  CheckCircle2,
  Edit3,
  Save,
  X,
  LogOut,
  ArrowRight,
  Sparkles,
  Lock,
  Key,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { apiGetProfile, apiUpdateProfile, clearAuthToken, setStoredUser } from '../../services/api';
import { SignOutModal } from '../../components/SignOutModal';

interface AccountPageProps {
  currentUser: any;
  setCurrentUser: (user: any) => void;
  onNavigate: (tab: string) => void;
  lang: 'en' | 'hi';
}

export const AccountPage: React.FC<AccountPageProps> = ({
  currentUser,
  setCurrentUser,
  onNavigate,
  lang
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);

  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editInstitution, setEditInstitution] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [editBio, setEditBio] = useState('');

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetProfile();
      if (res && res.user) {
        setProfile(res.user);
        setCurrentUser(res.user);
        setStoredUser(res.user);

        // Populate edit fields
        setEditName(res.user.name || '');
        setEditPhone(res.user.phone || '');
        setEditDob(res.user.dateOfBirth || '');
        setEditInstitution(res.user.institution || '');
        setEditDomain(res.user.researchDomain || '');
        setEditBio(res.user.bio || '');
      }
    } catch (err: any) {
      console.warn('Profile fetch note:', err);
      if (currentUser) {
        setProfile(currentUser);
        setEditName(currentUser.name || '');
        setEditPhone(currentUser.phone || '');
        setEditDob(currentUser.dateOfBirth || '');
        setEditInstitution(currentUser.institution || '');
        setEditDomain(currentUser.researchDomain || '');
        setEditBio(currentUser.bio || '');
      } else {
        setError('Could not load user profile from server. Please log in.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Full Name is required.');
      return;
    }

    setSaving(true);
    setSuccessMsg(null);
    try {
      const res = await apiUpdateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        dateOfBirth: editDob.trim(),
        institution: editInstitution.trim(),
        researchDomain: editDomain.trim(),
        bio: editBio.trim()
      });

      if (res && res.user) {
        setProfile(res.user);
        setCurrentUser(res.user);
        setStoredUser(res.user);
        setSuccessMsg('Profile updated successfully in PostgreSQL database!');
        setIsEditing(false);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      alert('Failed to update profile: ' + (err.message || 'Server error.'));
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'D';
    return nameStr
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
  };

  const role = profile?.role || currentUser?.role || 'public';

  const roleConfig = {
    admin: {
      badge: lang === 'en' ? 'System Administrator' : 'प्रणाली प्रशासक',
      bg: '#FFF1F2',
      border: '#FECDD3',
      color: '#BE123C',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />,
      desc: lang === 'en' ? 'Ministry of Earth Sciences / Portal Governance' : 'पृथ्वी विज्ञान मंत्रालय / पोर्टल प्रशासन'
    },
    researcher: {
      badge: lang === 'en' ? 'Verified Polar Researcher' : 'सत्यापित ध्रुवीय शोधकर्ता',
      bg: '#F0F9FF',
      border: '#BAE6FD',
      color: '#0284C7',
      icon: <FlaskConical className="w-3.5 h-3.5 text-sky-600" />,
      desc: lang === 'en' ? 'NCPOR Accredited Research Contributor' : 'एनसीपीओआर मान्यता प्राप्त अनुसंधान योगदानकर्ता'
    },
    public: {
      badge: lang === 'en' ? 'Public Explorer' : 'सार्वजनिक अन्वेषक',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      color: '#059669',
      icon: <Globe className="w-3.5 h-3.5 text-emerald-600" />,
      desc: lang === 'en' ? 'Open Access Polar Science Learner' : 'ओपन एक्सेस ध्रुवीय विज्ञान शिक्षार्थी'
    }
  }[role as 'admin' | 'researcher' | 'public'] || {
    badge: 'Public Explorer',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    color: '#059669',
    icon: <Globe className="w-3.5 h-3.5 text-emerald-600" />,
    desc: 'Polar Science Explorer'
  };

  const formattedCreatedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'September 2026';

  const formattedLastLogin = profile?.lastLogin
    ? new Date(profile.lastLogin).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Active Session';

  return (
    <div className="w-full min-h-[calc(100vh-80px)] py-8 sm:py-10 px-4 sm:px-6 lg:px-10 bg-slate-50/60">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── 1. MAIN CLEAN USER PROFILE HERO CARD (No Blue Area / Pure Clean UI) ── */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            {/* Avatar + Main Title Group */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar Box */}
              <div 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 shrink-0 flex items-center justify-center relative shadow-xs"
                style={{
                  background: role === 'admin' 
                    ? 'linear-gradient(135deg, #FFE4E6, #FECDD3)' 
                    : role === 'researcher' 
                    ? 'linear-gradient(135deg, #E0F2FE, #BAE6FD)' 
                    : 'linear-gradient(135deg, #D1FAE5, #A7F3D0)'
                }}
              >
                <div 
                  className="w-full h-full rounded-xl flex items-center justify-center font-black text-2xl sm:text-3xl text-white shadow-xs select-none"
                  style={{
                    background: role === 'admin' 
                      ? 'linear-gradient(135deg, #E11D48, #BE123C)' 
                      : role === 'researcher' 
                      ? 'linear-gradient(135deg, #0284C7, #0369A1)' 
                      : 'linear-gradient(135deg, #059669, #047857)'
                  }}
                >
                  {getInitials(profile?.name || currentUser?.name || 'Explorer')}
                </div>
                <span 
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white bg-emerald-500 shadow-xs"
                  title="Account Active"
                />
              </div>

              {/* Name, Role Badge, Email */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {profile?.name || currentUser?.name || 'DHRUVA User'}
                  </h1>
                  <span 
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                    style={{
                      backgroundColor: roleConfig.bg,
                      borderColor: roleConfig.border,
                      color: roleConfig.color
                    }}
                  >
                    {roleConfig.icon}
                    <span>{roleConfig.badge}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 text-xs sm:text-sm text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>{profile?.email || currentUser?.email || 'user@dhruva.gov.in'}</span>
                  </span>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="text-slate-500">{roleConfig.desc}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons (Stacked Vertically: Edit Profile on top, Sign Out below, text in one line) */}
            <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0 self-stretch sm:self-center">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
                >
                  <Edit3 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span className="whitespace-nowrap">Edit Profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Cancel</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSignOutOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="whitespace-nowrap">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">Account Status</span>
              <span className="font-semibold text-emerald-700 inline-flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {profile?.status ? profile.status.toUpperCase() : 'ACTIVE'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">User ID</span>
              <span className="font-mono text-slate-700 text-[11px] font-medium mt-0.5 block truncate">
                {profile?.id || currentUser?.id || 'usr-active'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">Member Since</span>
              <span className="font-medium text-slate-700 mt-0.5 block">
                {formattedCreatedDate}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">Last Active</span>
              <span className="font-medium text-slate-700 mt-0.5 block">
                {formattedLastLogin}
              </span>
            </div>
          </div>

        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── 2. TWO-COLUMN DETAILS SECTION ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Profile Info (2 cols on large) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Information Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    {isEditing ? 'Edit Profile Information' : 'Personal & Institutional Details'}
                  </h2>
                </div>
                {isEditing && (
                  <span className="text-[10px] text-cyan-700 font-semibold bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
                    Editing Mode
                  </span>
                )}
              </div>

              {isEditing ? (
                /* EDIT FORM */
                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 bg-white font-medium text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">
                        Email Address (Locked)
                      </label>
                      <input
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium cursor-not-allowed text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 bg-white font-medium text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={editDob}
                        onChange={(e) => setEditDob(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 bg-white font-medium text-xs sm:text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">
                        Institution / Organization
                      </label>
                      <input
                        type="text"
                        value={editInstitution}
                        onChange={(e) => setEditInstitution(e.target.value)}
                        placeholder="National Centre for Polar and Ocean Research (NCPOR), Goa"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 bg-white font-medium text-xs sm:text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">
                        Research Domain / Specialization Area
                      </label>
                      <input
                        type="text"
                        value={editDomain}
                        onChange={(e) => setEditDomain(e.target.value)}
                        placeholder="Glaciology, Cryosphere Dynamics, Oceanography, Arctic indARC"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 bg-white font-medium text-xs sm:text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">
                        Academic Biography / Research Background
                      </label>
                      <textarea
                        rows={3}
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Brief summary of polar expedition research, background, or scientific interests..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 bg-white font-medium resize-y text-xs sm:text-sm leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer text-xs"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* READ-ONLY VIEW */
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Full Name</span>
                      <span className="font-semibold text-slate-900 text-sm block">
                        {profile?.name || '—'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Email Address</span>
                      <span className="font-semibold text-slate-900 text-sm flex items-center justify-between">
                        <span>{profile?.email || '—'}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Phone Number</span>
                      <span className="font-medium text-slate-800 flex items-center gap-1.5 pt-0.5">
                        <Phone className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span>{profile?.phone || 'Not specified'}</span>
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Date of Birth</span>
                      <span className="font-medium text-slate-800 flex items-center gap-1.5 pt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span>{profile?.dateOfBirth || 'Not specified'}</span>
                      </span>
                    </div>

                    <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Institution / Affiliation</span>
                      <span className="font-medium text-slate-800 flex items-center gap-1.5 pt-0.5">
                        <Building className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span>{profile?.institution || 'National Centre for Polar and Ocean Research (NCPOR)'}</span>
                      </span>
                    </div>

                    <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Research Domain</span>
                      <span className="font-medium text-slate-800 flex items-center gap-1.5 pt-0.5">
                        <BookOpen className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span>{profile?.researchDomain || 'Polar & Cryospheric Science Studies'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-sky-50/30 border border-sky-100 space-y-1">
                    <span className="text-[10px] text-sky-800 font-bold uppercase tracking-wider block">
                      Biography / Research Background
                    </span>
                    <p className="text-slate-700 leading-relaxed text-xs">
                      {profile?.bio || 'Active researcher on the DHRUVA Integrated Polar Science Knowledge Repository.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Workspaces Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Authorized Workspaces &amp; Tools
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {role === 'researcher' && (
                  <>
                    <button
                      onClick={() => onNavigate('researcher-dashboard')}
                      className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/80 text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-sky-950">Researcher Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-sky-700">
                        Track manuscript submission status and AI claims
                      </p>
                    </button>
                    <button
                      onClick={() => onNavigate('researcher-upload')}
                      className="p-3.5 rounded-xl border border-cyan-200 bg-cyan-50/50 hover:bg-cyan-100/80 text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-cyan-950">Upload Manuscript</span>
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-cyan-700">
                        Submit PDF to DHRUVA AI extraction pipeline
                      </p>
                    </button>
                  </>
                )}

                {role === 'admin' && (
                  <>
                    <button
                      onClick={() => onNavigate('admin-dashboard')}
                      className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/80 text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-rose-950">Admin Governance Portal</span>
                        <ArrowRight className="w-3.5 h-3.5 text-rose-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-rose-700">
                        Audit logs, claim approvals &amp; repository governance
                      </p>
                    </button>
                    <button
                      onClick={() => onNavigate('admin-verification-queue')}
                      className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/80 text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-amber-950">Manuscript Review Queue</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-amber-700">
                        Inspect pending submissions with side-by-side manuscript proofing
                      </p>
                    </button>
                  </>
                )}

                {role === 'public' && (
                  <>
                    <button
                      onClick={() => onNavigate('explore')}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-slate-900">Explore Research</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Search and filter peer-reviewed polar manuscripts
                      </p>
                    </button>
                    <button
                      onClick={() => onNavigate('ask')}
                      className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100 text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-sky-950">Ask DHRUVA Assistant</span>
                        <ArrowRight className="w-3.5 h-3.5 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-sky-700">
                        Scientific RAG synthesis with page-level citations
                      </p>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Security & Permissions */}
          <div className="space-y-6">
            
            {/* Security & Authentication Box */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Lock className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-slate-900">Security &amp; Session</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Session Token</span>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    Active (7-Day Lifespan)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Password Hashing</span>
                  <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    bcrypt (10 rounds)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Role Authority</span>
                  <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full uppercase">
                    {role}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Database Engine</span>
                  <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    PostgreSQL 16
                  </span>
                </div>
              </div>
            </div>

            {/* Authorized Permissions Box */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3.5 text-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Shield className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Role Permissions</h3>
              </div>

              <ul className="space-y-2.5 text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Public Polar Research Access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Ask DHRUVA Scientific Inquiries</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>3D Flashcards &amp; Quizzes</span>
                </li>

                {role === 'researcher' && (
                  <>
                    <li className="flex items-center gap-2 font-semibold text-sky-900 pt-1 border-t border-slate-50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>Manuscript PDF Upload &amp; AI Extraction</span>
                    </li>
                    <li className="flex items-center gap-2 font-semibold text-sky-900">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>Repository Tracking &amp; Claim Review</span>
                    </li>
                  </>
                )}

                {role === 'admin' && (
                  <>
                    <li className="flex items-center gap-2 font-semibold text-rose-900 pt-1 border-t border-slate-50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Verification Queue &amp; Claim Review</span>
                    </li>
                    <li className="flex items-center gap-2 font-semibold text-rose-900">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Audit Logs &amp; Embargo Controls</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

          </div>
        </div>

      </div>

      {/* Sign Out Confirmation Modal */}
      {signOutOpen && (
        <SignOutModal
          isOpen={signOutOpen}
          onClose={() => setSignOutOpen(false)}
          onConfirm={() => {
            clearAuthToken();
            const pubUser = { role: 'public', name: 'Public Explorer' };
            setStoredUser(pubUser);
            setCurrentUser(pubUser);
            setSignOutOpen(false);
            onNavigate('home');
          }}
          userName={profile?.name || currentUser?.name}
          userRole={role}
        />
      )}
    </div>
  );
};
