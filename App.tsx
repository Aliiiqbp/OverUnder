import React, { useState, useRef, useEffect } from 'react';
import { Send, BarChart2, Loader2, Info, ExternalLink, Menu, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { ChatMessage, StockReportData, User, ChatSession } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { StockReport } from './components/StockReport';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { 
  mockGoogleLogin, 
  getCurrentUser, 
  getChatSessions, 
  saveChatSession, 
  deleteChatSession, 
  createNewSession, 
  logoutUser 
} from './services/storageService';

const INITIAL_WELCOME_MSG: ChatMessage = {
  id: 'welcome-msg',
  role: 'model',
  text: "Hello! I'm OverUnder. I can help you analyze whether a stock is overvalued or undervalued using real-time data and key financial ratios (P/E, PEG, P/B, etc.). Which stock would you like to analyze today?"
};

// Custom styles for Markdown elements
const MarkdownComponents = {
  p: ({node, ...props}: any) => <p className="mb-4 last:mb-0" {...props} />,
  h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold text-white mb-4 mt-6" {...props} />,
  h2: ({node, ...props}: any) => <h2 className="text-xl font-bold text-white mb-3 mt-5" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-lg font-bold text-slate-100 mb-2 mt-4" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc list-outside ml-6 mb-4 space-y-1" {...props} />,
  ol: ({node, ...props}: any) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-1" {...props} />,
  li: ({node, ...props}: any) => <li className="text-slate-200 pl-1" {...props} />,
  a: ({node, ...props}: any) => <a className="text-blue-400 hover:text-blue-300 underline break-words" target="_blank" rel="noopener noreferrer" {...props} />,
  strong: ({node, ...props}: any) => <strong className="font-bold text-white" {...props} />,
  b: ({node, ...props}: any) => <b className="font-bold text-white" {...props} />,
  em: ({node, ...props}: any) => <em className="italic text-slate-300" {...props} />,
  table: ({node, ...props}: any) => <div className="overflow-x-auto mb-4 rounded-lg border border-slate-700 mt-2"><table className="w-full text-left border-collapse min-w-[300px]" {...props} /></div>,
  thead: ({node, ...props}: any) => <thead className="bg-slate-900/50" {...props} />,
  th: ({node, ...props}: any) => <th className="p-3 border-b border-slate-700 font-semibold text-slate-200 text-sm whitespace-nowrap" {...props} />,
  td: ({node, ...props}: any) => <td className="p-3 border-b border-slate-700/50 text-sm text-slate-300 align-top" {...props} />,
  blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-blue-500 pl-4 py-1 italic text-slate-400 mb-4 bg-slate-900/30 rounded-r" {...props} />,
  code: ({node, inline, className, children, ...props}: any) => {
     return inline ? 
       <code className="bg-slate-900 px-1.5 py-0.5 rounded text-sm font-mono text-emerald-400 border border-slate-700/50" {...props}>{children}</code> :
       <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto mb-4 text-sm font-mono text-slate-300 border border-slate-700" {...props}><code>{children}</code></pre>
  }
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Auth Check
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      loadSessions(currentUser.id);
    }
  }, []);

  const loadSessions = (userId: string) => {
    const loadedSessions = getChatSessions(userId);
    setSessions(loadedSessions);
    
    // Select most recent or create new if none
    if (loadedSessions.length > 0) {
      setCurrentSessionId(loadedSessions[0].id);
    } else {
      startNewChat(userId);
    }
  };

  const startNewChat = (userId: string) => {
    const newSession = createNewSession(userId);
    // Add welcome message directly to the new session
    newSession.messages.push(INITIAL_WELCOME_MSG);
    
    saveChatSession(newSession);
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleLogin = async () => {
    setIsLoginLoading(true);
    try {
      const loggedInUser = await mockGoogleLogin();
      setUser(loggedInUser);
      loadSessions(loggedInUser.id);
    } catch (e) {
      console.error("Login failed", e);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setSessions([]);
    setCurrentSessionId(null);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSessionId, sessions]);

  // Derived state: Current Messages
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession ? currentSession.messages : [];

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isProcessing || !currentSession || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
    };

    // Update Local State
    const updatedMessages = [...currentSession.messages, userMessage];
    
    // Update Title if it's the first real user message (2nd overall after welcome)
    let updatedTitle = currentSession.title;
    if (currentSession.messages.length <= 1) {
       updatedTitle = inputText.length > 30 ? inputText.substring(0, 30) + '...' : inputText;
    }

    const updatedSession = {
      ...currentSession,
      messages: updatedMessages,
      title: updatedTitle,
      lastModified: Date.now()
    };

    // Optimistic Update
    setSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s));
    saveChatSession(updatedSession);
    
    setInputText('');
    setIsProcessing(true);

    // Add Loading Message
    const loadingId = 'loading-' + Date.now();
    const sessionWithLoading = {
       ...updatedSession,
       messages: [...updatedMessages, { id: loadingId, role: 'model', text: '', isLoading: true } as ChatMessage]
    };
    setSessions(prev => prev.map(s => s.id === currentSession.id ? sessionWithLoading : s));
    
    try {
      const response = await sendMessageToGemini(userMessage.text);
      
      const modelMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        isReport: !!response.reportData,
        reportData: response.reportData,
        groundingUrls: response.groundingUrls
      };

      const finalMessages = [...updatedMessages, modelMessage];
      const finalSession = {
        ...updatedSession,
        messages: finalMessages,
        lastModified: Date.now()
      };

      setSessions(prev => {
        // We move the updated session to the top of the list because it's most active
        const otherSessions = prev.filter(s => s.id !== currentSession.id);
        return [finalSession, ...otherSessions];
      });
      saveChatSession(finalSession);

    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'model',
          text: "I encountered an error. Please try again.",
      };
      
      const errorSession = {
        ...updatedSession,
        messages: [...updatedMessages, errorMessage],
        lastModified: Date.now()
      };
      setSessions(prev => prev.map(s => s.id === currentSession.id ? errorSession : s));
      saveChatSession(errorSession);

    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteChatSession(id);
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      // If we deleted the active session, select another
      if (currentSessionId === id) {
         if (filtered.length > 0) setCurrentSessionId(filtered[0].id);
         else if (user) startNewChat(user.id);
      }
      return filtered;
    });
  };

  // --- Render Login ---
  if (!user) {
    return <LoginPage onLogin={handleLogin} isLoading={isLoginLoading} />;
  }

  // --- Render Main App ---
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => {
          setCurrentSessionId(id);
          if (window.innerWidth < 768) setSidebarOpen(false);
        }}
        onNewChat={() => user && startNewChat(user.id)}
        onDeleteSession={handleDeleteSession}
        user={user}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="flex-none bg-slate-900 border-b border-slate-800 p-4 shadow-lg z-10 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setSidebarOpen(!sidebarOpen)}
               className="md:hidden p-2 text-slate-400 hover:text-white"
             >
               {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
             </button>

             <div className="bg-slate-800 p-2 rounded-lg shadow-inner hidden sm:block">
               <BarChart2 className="w-5 h-5 text-white" />
             </div>
             <div>
               <h1 className="text-lg font-bold">
                 <span className="text-red-400">Over</span><span className="text-emerald-400">Under</span>
               </h1>
               <p className="text-[10px] text-slate-400 hidden sm:block">AI Intrinsic Valuation</p>
             </div>
           </div>
           
           <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-800">
             <Info className="w-3 h-3" />
             <span className="hidden sm:inline">Powered by Gemini 2.5</span>
             <span className="sm:hidden">Gemini 2.5</span>
           </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 scrollbar-hide relative bg-slate-950">
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[95%] md:max-w-[85%] lg:max-w-[75%] animate-fade-in-up ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm p-4 shadow-lg'
                      : msg.isLoading 
                        ? 'bg-transparent' 
                        : 'bg-transparent w-full' 
                  }`}
                >
                  {/* Loading State */}
                  {msg.isLoading ? (
                    <div className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800 w-fit">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                      <span className="text-sm text-slate-400">Thinking...</span>
                    </div>
                  ) : (
                    <>
                      {/* Message Text */}
                      {msg.text && msg.role === 'model' && !msg.isReport && (
                        <div className="bg-slate-900/80 backdrop-blur-sm p-5 rounded-2xl rounded-tl-sm border border-slate-800 shadow-xl text-slate-200 leading-relaxed">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm, remarkMath]} 
                            rehypePlugins={[rehypeKatex]}
                            components={MarkdownComponents}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      )}
                      
                      {msg.text && msg.role === 'user' && (
                         <p className="text-sm md:text-base whitespace-pre-wrap">{msg.text}</p>
                      )}

                      {/* Stock Report Component */}
                      {msg.isReport && msg.reportData && (
                        <div className="space-y-4">
                           {msg.text && (
                              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 mb-2">
                                  <ReactMarkdown 
                                    remarkPlugins={[remarkGfm, remarkMath]} 
                                    rehypePlugins={[rehypeKatex]}
                                    components={MarkdownComponents}
                                  >
                                    {msg.text}
                                  </ReactMarkdown>
                              </div>
                           )}
                           <StockReport data={msg.reportData} />
                        </div>
                      )}
                      
                      {/* Grounding Sources */}
                      {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 px-2">
                          {msg.groundingUrls.map((source, idx) => (
                            <a 
                              key={idx} 
                              href={source.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-400 transition-colors bg-slate-900 px-2 py-1 rounded border border-slate-800"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Area */}
        <footer className="flex-none p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message OverUnder..."
                className="w-full bg-slate-800 text-slate-100 placeholder-slate-500 border border-slate-700 rounded-xl px-5 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-inner transition-all"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-blue-600 shadow-lg shadow-blue-600/20"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
            <div className="text-center mt-2">
              <p className="text-[10px] text-slate-600">
                Not financial advice. Check important info.
              </p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}