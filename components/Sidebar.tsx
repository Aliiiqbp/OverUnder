import React from 'react';
import { Plus, MessageSquare, LogOut, MoreVertical, Trash2 } from 'lucide-react';
import { ChatSession, User } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  user: User;
  onLogout: () => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  user,
  onLogout,
  isOpen
}) => {
  return (
    <aside 
      className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Header / New Chat */}
      <div className="p-4 border-b border-slate-800">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg transition-colors shadow-lg shadow-blue-600/10"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Analysis</span>
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3 mt-2">History</h3>
        {sessions.length === 0 ? (
          <div className="text-center text-slate-600 text-sm py-8 px-4">
            No history yet.<br/>Start a new analysis!
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                currentSessionId === session.id
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-sm font-medium">{session.title}</span>
              </div>
              <button
                onClick={(e) => onDeleteSession(e, session.id)}
                className={`p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity ${currentSessionId === session.id ? 'opacity-100' : ''}`}
                title="Delete chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* User Footer */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full border border-slate-700" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
               <span className="text-sm font-medium text-white truncate max-w-[120px]">{user.name}</span>
               <span className="text-xs text-slate-500 truncate max-w-[120px]">{user.email}</span>
            </div>
          </div>
          <button 
             onClick={onLogout}
             className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
             title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};