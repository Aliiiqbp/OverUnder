import { ChatSession, User, ChatMessage } from "../types";

const STORAGE_KEYS = {
  USER: 'overunder_user',
  SESSIONS: 'overunder_sessions'
};

// Simulate a Google User Login
export const mockGoogleLogin = async (): Promise<User> => {
  // In a real app, this would trigger Firebase/Google Auth popup
  return new Promise((resolve) => {
    setTimeout(() => {
      const user: User = {
        id: 'user_12345',
        name: 'Demo User',
        email: 'demo.user@gmail.com',
        avatarUrl: 'https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff'
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      resolve(user);
    }, 800);
  });
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.USER);
  return stored ? JSON.parse(stored) : null;
};

export const getChatSessions = (userId: string): ChatSession[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  if (!stored) return [];
  const allSessions: ChatSession[] = JSON.parse(stored);
  // Filter by user and sort by newest first
  return allSessions
    .filter(s => s.userId === userId)
    .sort((a, b) => b.lastModified - a.lastModified);
};

export const saveChatSession = (session: ChatSession) => {
  const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  let allSessions: ChatSession[] = stored ? JSON.parse(stored) : [];
  
  const index = allSessions.findIndex(s => s.id === session.id);
  if (index >= 0) {
    allSessions[index] = session;
  } else {
    allSessions.push(session);
  }
  
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(allSessions));
};

export const deleteChatSession = (sessionId: string) => {
  const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  if (!stored) return;
  let allSessions: ChatSession[] = JSON.parse(stored);
  allSessions = allSessions.filter(s => s.id !== sessionId);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(allSessions));
};

export const createNewSession = (userId: string): ChatSession => {
  return {
    id: Date.now().toString(),
    userId,
    title: 'New Analysis',
    messages: [], // We will add the initial welcome message in the UI layer
    createdAt: Date.now(),
    lastModified: Date.now()
  };
};