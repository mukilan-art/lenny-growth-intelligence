import { useState, useEffect } from 'react';
import type { Session, Message, KnowledgeStats, ModelsConfig, Artifact } from './types';
import { api } from './api';
import { Sidebar } from './components/Sidebar';
import { ChatWorkspace } from './components/ChatWorkspace';
import { ArtifactWorkspace } from './components/ArtifactWorkspace';

export function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [modelsConfig, setModelsConfig] = useState<ModelsConfig | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('ollama');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);

  // Initialize
  useEffect(() => {
    loadInitialData();
  }, []);

  // When active session changes, load messages
  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  const loadInitialData = async () => {
    try {
      const [fetchedSessions, fetchedStats, fetchedModels] = await Promise.all([
        api.listSessions(),
        api.getKnowledgeStats(),
        api.getModelsConfig(),
      ]);
      setSessions(fetchedSessions);
      setStats(fetchedStats);
      setModelsConfig(fetchedModels);

      if (fetchedSessions.length > 0) {
        setActiveSessionId(fetchedSessions[0].id);
      }
    } catch (err) {
      console.error('Initialization error:', err);
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

    // Optimistically render user message
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
      // Refresh session title in sidebar
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
    } catch (err) {
      console.error('Failed to generate essay:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateArtifact = async (content: string, type: 'html' | 'markdown', title: string) => {
    setLoading(true);
    try {
      const artifact = await api.generateArtifact(content, type, title, activeSessionId || undefined, selectedProvider);
      setActiveArtifact(artifact);
    } catch (err) {
      console.error('Failed to generate artifact:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <div className="app-container">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        stats={stats}
        modelsConfig={modelsConfig}
        selectedProvider={selectedProvider}
        onSelectProvider={setSelectedProvider}
      />

      <div className="main-content">
        <div className="content-split">
          <ChatWorkspace
            activeSession={activeSession}
            messages={messages}
            loading={loading}
            onSendMessage={handleSendMessage}
            onGenerateEssay={handleGenerateEssay}
            onGenerateArtifact={handleGenerateArtifact}
          />

          {activeArtifact && (
            <ArtifactWorkspace
              artifact={activeArtifact}
              onClose={() => setActiveArtifact(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
