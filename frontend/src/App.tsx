import { useState, useEffect } from 'react';
import type { Session, Message, KnowledgeStats, ModelsConfig, Artifact, User } from './types';
import { api } from './api';
import { Sidebar } from './components/Sidebar';
import { ChatWorkspace } from './components/ChatWorkspace';
import { ArtifactWorkspace } from './components/ArtifactWorkspace';
import { WritingStudio } from './components/WritingStudio';
import { EvidenceExplorerPage } from './components/EvidenceExplorerPage';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';

export function App() {
  // Navigation & Authentication
  const [user, setUser] = useState<User | null>(null);
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'writing' | 'evidence'>('chat');

  // Application Data State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedArtifacts, setSavedArtifacts] = useState<Artifact[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);

  // System & Model Status
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [modelsConfig, setModelsConfig] = useState<ModelsConfig | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('ollama');
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize
  useEffect(() => {
    checkAuthAndInit();
  }, []);

  // When active session changes, load messages
  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  const checkAuthAndInit = async () => {
    try {
      const currentUser = await api.getMe();
      if (currentUser) {
        setUser(currentUser);
        setShowLanding(false);
      }

      const [fetchedStats, fetchedModels] = await Promise.all([
        api.getKnowledgeStats(),
        api.getModelsConfig(),
      ]);
      setStats(fetchedStats);
      setModelsConfig(fetchedModels);

      if (currentUser) {
        await loadUserData();
      }
    } catch (err) {
      console.error('Initialization error:', err);
    }
  };

  const loadUserData = async () => {
    try {
      const [fetchedSessions, fetchedArtifacts] = await Promise.all([
        api.listSessions(),
        api.listArtifacts(),
      ]);
      setSessions(fetchedSessions);
      setSavedArtifacts(fetchedArtifacts);

      if (fetchedSessions.length > 0 && !activeSessionId) {
        setActiveSessionId(fetchedSessions[0].id);
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const msgs = await api.getMessages(sessionId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleAuthSuccess = async (authUser: User) => {
    setUser(authUser);
    setShowLanding(false);
    setAuthModalMode(null);
    await loadUserData();
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setShowLanding(true);
    setSessions([]);
    setMessages([]);
    setSavedArtifacts([]);
    setActiveSessionId(null);
    setActiveArtifact(null);
  };

  const handleNewSession = async () => {
    try {
      const session = await api.createSession();
      setSessions([session, ...sessions]);
      setActiveSessionId(session.id);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await api.deleteSession(id);
      const remaining = sessions.filter((s) => s.id !== id);
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleSendMessage = async (content: string) => {
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      try {
        const newSession = await api.createSession(content.slice(0, 30));
        setSessions([newSession, ...sessions]);
        setActiveSessionId(newSession.id);
        currentSessionId = newSession.id;
      } catch (err) {
        console.error('Failed to auto-create session:', err);
        return;
      }
    }

    const tempUserMsg: Message = {
      id: `temp_${Date.now()}`,
      session_id: currentSessionId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const assistantMsg = await api.sendMessage(currentSessionId, content, selectedProvider);
      setMessages((prev) => [...prev, assistantMsg]);
      const updatedSessions = await api.listSessions();
      setSessions(updatedSessions);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateEssay = async (topic: string) => {
    setLoading(true);
    try {
      const res = await api.generateEssay(topic, activeSessionId || undefined, selectedProvider);
      const artifact: Artifact = {
        id: res.artifact_id || `essay_${Date.now()}`,
        session_id: activeSessionId || undefined,
        title: `Ship 30 Essay: ${topic.slice(0, 35)}`,
        content_type: 'essay',
        content: res.content,
        created_at: new Date().toISOString(),
      };
      setActiveArtifact(artifact);
      setSavedArtifacts([artifact, ...savedArtifacts]);
    } catch (err) {
      console.error('Failed to generate essay:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateArtifact = async (content: string, type: 'html' | 'markdown' | 'essay', title: string) => {
    setLoading(true);
    try {
      const artifact = await api.generateArtifact(content, type, title, activeSessionId || undefined, selectedProvider);
      setActiveArtifact(artifact);
      setSavedArtifacts([artifact, ...savedArtifacts]);
    } catch (err) {
      console.error('Failed to generate artifact:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleArtifactUpdated = (updated: Artifact) => {
    setActiveArtifact(updated);
    setSavedArtifacts(savedArtifacts.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleArtifactDeleted = (deletedId: string) => {
    setSavedArtifacts(savedArtifacts.filter((a) => a.id !== deletedId));
    if (activeArtifact?.id === deletedId) {
      setActiveArtifact(null);
    }
  };

  // If user is on landing page and not signed in
  if (showLanding && !user) {
    return (
      <>
        <LandingPage
          onSignIn={() => setAuthModalMode('login')}
          onGetStarted={() => setAuthModalMode('register')}
          docCount={stats?.total_documents ?? 60}
          chunkCount={stats?.total_chunks ?? 4193}
        />
        {authModalMode && (
          <AuthModal
            initialMode={authModalMode}
            onSuccess={handleAuthSuccess}
            onClose={() => setAuthModalMode(null)}
          />
        )}
      </>
    );
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <div className="app-container">
      <Sidebar
        user={user}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        savedArtifacts={savedArtifacts}
        onOpenArtifact={setActiveArtifact}
        stats={stats}
        modelsConfig={modelsConfig}
        selectedProvider={selectedProvider}
        onSelectProvider={setSelectedProvider}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalMode('login')}
      />

      <div className="main-content">
        <div className="content-split">
          {activeTab === 'chat' && (
            <ChatWorkspace
              activeSession={activeSession}
              messages={messages}
              loading={loading}
              onSendMessage={handleSendMessage}
              onGenerateEssay={handleGenerateEssay}
              onGenerateArtifact={handleGenerateArtifact}
            />
          )}

          {activeTab === 'writing' && (
            <WritingStudio
              selectedProvider={selectedProvider}
              onOpenArtifact={setActiveArtifact}
            />
          )}

          {activeTab === 'evidence' && (
            <EvidenceExplorerPage />
          )}

          {activeArtifact && (
            <ArtifactWorkspace
              artifact={activeArtifact}
              onClose={() => setActiveArtifact(null)}
              onArtifactUpdated={handleArtifactUpdated}
              onArtifactDeleted={handleArtifactDeleted}
            />
          )}
        </div>
      </div>

      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onSuccess={handleAuthSuccess}
          onClose={() => setAuthModalMode(null)}
        />
      )}
    </div>
  );
}

export default App;
