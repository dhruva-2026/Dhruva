import React, { useState, useEffect } from 'react';
import './styles/polar-theme.css';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ParallaxBackground } from './components/ParallaxBackground';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ExploreResearchPage } from './pages/public/ExploreResearchPage';
import { PaperDetailPage } from './pages/public/PaperDetailPage';
import { LearnPortalPage } from './pages/public/LearnPortalPage';
import { MediaDisseminationPage } from './pages/public/MediaDisseminationPage';
import { AskDhruvaPage } from './pages/public/AskDhruvaPage';
import { AboutPage } from './pages/public/AboutPage';
import { LoginPage } from './pages/public/LoginPage';

// Researcher Pages
import { ResearcherDashboard } from './pages/researcher/ResearcherDashboard';
import { ResearcherRepository } from './pages/researcher/ResearcherRepository';
import { PaperUploadWizard } from './pages/researcher/PaperUploadWizard';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminVerificationQueue } from './pages/admin/AdminVerificationQueue';
import { AdminVerificationScreen } from './pages/admin/AdminVerificationScreen';
import { AdminEmbargoManager } from './pages/admin/AdminEmbargoManager';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';

import {
  apiLogin,
  getStoredUser,
  setStoredUser,
  setAuthToken,
  clearAuthToken
} from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedPaperId, setSelectedPaperId] = useState<string>('paper-001');
  const [selectedTheme, setSelectedTheme] = useState<string>('All');
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Initialize user from local storage or set default public
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setCurrentUser(stored);
    } else {
      // Default to Public Portal
      setCurrentUser({ role: 'public', name: 'Public Explorer' });
    }
  }, []);

  // Instant Portal & Role Switcher Helper
  const handleRoleSwitch = async (role: 'public' | 'researcher' | 'admin', email?: string) => {
    if (role === 'public') {
      clearAuthToken();
      const pubUser = { role: 'public', name: 'Public Explorer' };
      setCurrentUser(pubUser);
      setStoredUser(pubUser);
      setCurrentTab('home');
      return;
    }

    try {
      const loginEmail = email || (role === 'admin' ? 'admin@dhruva.gov.in' : 'dr.ananya@ncaor.gov.in');
      const res = await apiLogin(loginEmail, role === 'admin' ? 'admin123' : 'researcher123');
      setAuthToken(res.token);
      setCurrentUser(res.user);
      setStoredUser(res.user);

      if (role === 'researcher') {
        setCurrentTab('researcher-dashboard');
      } else if (role === 'admin') {
        setCurrentTab('admin-dashboard');
      }
    } catch (e: any) {
      alert('Login error during role switch: ' + e.message);
    }
  };

  const handleReadPaper = (id: string) => {
    setSelectedPaperId(id);
    setCurrentTab('paper-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-100 selection:bg-cyan-500 selection:text-black relative">

      {/* Global Iceberg Parallax & Atmospheric Background */}
      <ParallaxBackground />

      {/* Global Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lang={lang}
        setLang={setLang}
        currentUser={currentUser}
        onRoleSwitch={handleRoleSwitch}
      />

      {/* Main Content Area — keyed by tab so each tab gets entry animation */}
      <main className="flex-1">
        {/* PUBLIC PORTAL */}
        {currentTab === 'home' && (
          <div className="animate-fadeIn" key="home">
            <HomePage
              setCurrentTab={setCurrentTab}
              setSelectedPaperId={handleReadPaper}
              onSelectTheme={(theme) => {
                setSelectedTheme(theme);
                setCurrentTab('explore');
              }}
              lang={lang}
            />
          </div>
        )}

        {currentTab === 'explore' && (
          <div className="animate-fadeIn" key="explore">
            <ExploreResearchPage
              onReadPaper={handleReadPaper}
              onAskPaper={(paper) => {
                setSelectedPaperId(paper.id);
                setCurrentTab('paper-detail');
              }}
              initialArea={selectedTheme}
              lang={lang}
            />
          </div>
        )}

        {currentTab === 'paper-detail' && (
          <div className="animate-fadeIn" key="paper-detail">
            <PaperDetailPage
              paperId={selectedPaperId}
              onBack={() => setCurrentTab('explore')}
              lang={lang}
            />
          </div>
        )}

        {/* AUTHENTICATION PORTAL */}
        {currentTab === 'login' && (
          <div className="animate-fadeIn" key="login">
            <LoginPage
              onNavigate={setCurrentTab}
              currentUser={currentUser}
              onLoginSuccess={(u) => {
                setCurrentUser(u);
              }}
              initialRole="public"
            />
          </div>
        )}

        {currentTab === 'learn' && (
          <div className="animate-fadeIn" key="learn">
            <LearnPortalPage
              onOpenPaper={handleReadPaper}
              lang={lang}
            />
          </div>
        )}

        {currentTab === 'media' && (
          <div className="animate-fadeIn" key="media">
            <MediaDisseminationPage
              onReadPaper={handleReadPaper}
              lang={lang}
            />
          </div>
        )}

        {currentTab === 'ask' && (
          <div className="animate-fadeIn" key="ask">
            <AskDhruvaPage
              onReadPaper={handleReadPaper}
              lang={lang}
              currentUser={currentUser}
              onNavigate={setCurrentTab}
            />
          </div>
        )}

        {currentTab === 'about' && (
          <div className="animate-fadeIn" key="about">
            <AboutPage
              setCurrentTab={setCurrentTab}
              lang={lang}
            />
          </div>
        )}

        {/* RESEARCHER PORTAL (PROTECTED) */}
        {currentTab === 'researcher-dashboard' && (
          currentUser && (currentUser.role === 'researcher' || currentUser.role === 'admin') ? (
            <div className="animate-fadeIn" key="researcher-dashboard">
              <ResearcherDashboard
                onNavigateUpload={() => setCurrentTab('researcher-upload')}
                onNavigateRepository={(status) => {
                  setCurrentTab('researcher-repository');
                }}
                onReadPaper={handleReadPaper}
                lang={lang}
              />
            </div>
          ) : (
            <div className="animate-fadeIn" key="researcher-dashboard-login">
              <LoginPage
                onNavigate={setCurrentTab}
                currentUser={currentUser}
                onLoginSuccess={(u) => setCurrentUser(u)}
                initialRole="researcher"
              />
            </div>
          )
        )}

        {currentTab === 'researcher-repository' && (
          currentUser && (currentUser.role === 'researcher' || currentUser.role === 'admin') ? (
            <div className="animate-fadeIn" key="researcher-repository">
              <ResearcherRepository
                initialStatus="all"
                onReadPaper={handleReadPaper}
                lang={lang}
              />
            </div>
          ) : (
            <div className="animate-fadeIn" key="researcher-repo-login">
              <LoginPage
                onNavigate={setCurrentTab}
                currentUser={currentUser}
                onLoginSuccess={(u) => setCurrentUser(u)}
                initialRole="researcher"
              />
            </div>
          )
        )}

        {currentTab === 'researcher-upload' && (
          currentUser && (currentUser.role === 'researcher' || currentUser.role === 'admin') ? (
            <div className="animate-fadeIn" key="researcher-upload">
              <PaperUploadWizard
                onCompleted={(newId) => {
                  setSelectedPaperId(newId);
                  setCurrentTab('researcher-repository');
                }}
                onCancel={() => setCurrentTab('researcher-dashboard')}
                lang={lang}
              />
            </div>
          ) : (
            <div className="animate-fadeIn" key="researcher-upload-login">
              <LoginPage
                onNavigate={setCurrentTab}
                currentUser={currentUser}
                onLoginSuccess={(u) => setCurrentUser(u)}
                initialRole="researcher"
              />
            </div>
          )
        )}

        {/* ADMIN PORTAL (PROTECTED) */}
        {currentTab === 'admin-dashboard' && (
          currentUser && currentUser.role === 'admin' ? (
            <div className="animate-fadeIn" key="admin-dashboard">
              <AdminDashboard
                onNavigateQueue={() => setCurrentTab('admin-verification-queue')}
                onNavigateAudit={() => setCurrentTab('admin-audit')}
                onNavigateAnalytics={() => setCurrentTab('admin-analytics')}
                onNavigateEmbargo={() => setCurrentTab('admin-embargo')}
                lang={lang}
              />
            </div>
          ) : (
            <div className="animate-fadeIn" key="admin-dashboard-login">
              <LoginPage
                onNavigate={setCurrentTab}
                currentUser={currentUser}
                onLoginSuccess={(u) => setCurrentUser(u)}
                initialRole="admin"
              />
            </div>
          )
        )}

        {currentTab === 'admin-verification-queue' && (
          currentUser && currentUser.role === 'admin' ? (
            <div className="animate-fadeIn" key="admin-verification-queue">
              <AdminVerificationQueue
                onOpenVerification={(paperId) => {
                  setSelectedPaperId(paperId);
                  setCurrentTab('admin-verification');
                }}
                lang={lang}
              />
            </div>
          ) : (
            <div className="animate-fadeIn" key="admin-queue-login">
              <LoginPage
                onNavigate={setCurrentTab}
                currentUser={currentUser}
                onLoginSuccess={(u) => setCurrentUser(u)}
                initialRole="admin"
              />
            </div>
          )
        )}

        {currentTab === 'admin-verification' && (
          currentUser && currentUser.role === 'admin' ? (
            <div className="animate-fadeIn" key="admin-verification">
              <AdminVerificationScreen
                paperId={selectedPaperId || 'paper-009'}
                onBack={() => setCurrentTab('admin-verification-queue')}
                onViewPublic={(pid) => handleReadPaper(pid)}
                lang={lang}
              />
            </div>
          ) : (
            <div className="animate-fadeIn" key="admin-verification-login">
              <LoginPage
                onNavigate={setCurrentTab}
                currentUser={currentUser}
                onLoginSuccess={(u) => setCurrentUser(u)}
                initialRole="admin"
              />
            </div>
          )
        )}

        {currentTab === 'admin-embargo' && (
          currentUser && currentUser.role === 'admin' ? (
            <div className="animate-fadeIn" key="admin-embargo">
              <AdminEmbargoManager
                onBack={() => setCurrentTab('admin-dashboard')}
                onReadPaper={handleReadPaper}
                lang={lang}
              />
            </div>
          ) : (
            <div className="animate-fadeIn" key="admin-embargo-login">
              <LoginPage
                onNavigate={setCurrentTab}
                currentUser={currentUser}
                onLoginSuccess={(u) => setCurrentUser(u)}
                initialRole="admin"
              />
            </div>
          )
        )}

        {currentTab === 'admin-audit' && (
          currentUser && currentUser.role === 'admin' ? (
            <div className="animate-fadeIn" key="admin-audit">
              <AdminAuditLogs
                onBack={() => setCurrentTab('admin-dashboard')}
                lang={lang}
              />
            </div>
          ) : (
            <div className="animate-fadeIn" key="admin-audit-login">
              <LoginPage
                onNavigate={setCurrentTab}
                currentUser={currentUser}
                onLoginSuccess={(u) => setCurrentUser(u)}
                initialRole="admin"
              />
            </div>
          )
        )}

        {currentTab === 'admin-analytics' && (
          currentUser && currentUser.role === 'admin' ? (
            <div className="animate-fadeIn" key="admin-analytics">
              <AdminAnalytics
                onBack={() => setCurrentTab('admin-dashboard')}
                lang={lang}
              />
            </div>
          ) : (
            <div className="animate-fadeIn" key="admin-analytics-login">
              <LoginPage
                onNavigate={setCurrentTab}
                currentUser={currentUser}
                onLoginSuccess={(u) => setCurrentUser(u)}
                initialRole="admin"
              />
            </div>
          )
        )}
      </main>

      {/* Global Footer */}
      <Footer lang={lang} onNavigate={setCurrentTab} />

    </div>
  );
}

export default App;
