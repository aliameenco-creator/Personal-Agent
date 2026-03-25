import React, { useState, useEffect } from 'react';
import { Header, AppTab } from './components/Header';
import { RebrandPage } from './pages/RebrandPage';
import { YouTubePage } from './components/youtube/YouTubePage';
import { LinkedInPage } from './components/linkedin/LinkedInPage';
import { ThumbnailPage } from './components/thumbnails/ThumbnailPage';
import { AuthPage } from './components/auth/AuthPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { useAuth } from './hooks/useAuth';
import { supabase } from './services/supabaseClient';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const { user, isAuthenticated, loading, signIn, signUp, signInWithGoogle, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>('rebrand');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.role === 'admin');
      })
      .catch(() => {
        // Profile may not exist yet — silently ignore
        setIsAdmin(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-surface">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthPage
        onSignIn={signIn}
        onSignUp={signUp}
        onGoogleSignIn={signInWithGoogle}
      />
    );
  }

  if (showAdmin && isAdmin) {
    return (
      <div className="flex h-screen text-brand-on-surface font-sans bg-brand-surface">
        <AdminDashboard onBack={() => setShowAdmin(false)} />
      </div>
    );
  }

  return (
    <div className="flex h-screen text-brand-on-surface font-sans bg-brand-surface">
      <div className="flex-1 flex flex-col h-full min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isAdmin={isAdmin}
          onAdminClick={() => setShowAdmin(true)}
          onSignOut={signOut}
        />

        {activeTab === 'rebrand' ? (
          <div className="flex flex-1 overflow-hidden">
            <RebrandPage onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
          </div>
        ) : activeTab === 'youtube' ? (
          <YouTubePage />
        ) : activeTab === 'linkedin' ? (
          <LinkedInPage onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
        ) : (
          <ThumbnailPage onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
        )}
      </div>
    </div>
  );
};

export default App;
