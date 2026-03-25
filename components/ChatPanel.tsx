import React, { useState, useEffect, useRef } from 'react';
import { RebrandJob } from '../types';
import { X, Send, Loader2, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';

interface ChatPanelProps {
  job: RebrandJob;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (jobId: string, message: string) => void;
  isSending: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ job, isOpen, onClose, onSendMessage, isSending }) => {
  const [message, setMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [job.chatHistory.length, isSending]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;
    onSendMessage(job.id, trimmed);
    setMessage('');
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-md bg-brand-surface-container-highest h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare size={18} className="text-indigo-600 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 text-sm truncate">Edit Image</h3>
              <p className="text-xs text-slate-500 truncate">{job.fileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Current Result Image */}
          {job.resultImage && (
            <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
              <img src={job.resultImage} alt="Current result" className="w-full object-contain max-h-64" />
              <div className="px-3 py-1.5 bg-slate-100 text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                Current Result
              </div>
            </div>
          )}

          {/* Chat History */}
          {job.chatHistory.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Ask Gemini to make changes to this image.</p>
              <p className="text-xs text-slate-300 mt-1">e.g. "Move the logo to the top-left" or "Make colors brighter"</p>
            </div>
          )}

          {job.chatHistory.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : msg.text?.startsWith('Error')
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : 'bg-slate-100 text-slate-700'
              }`}>
                {msg.text && (
                  <p className="text-sm flex items-center gap-1.5">
                    {msg.role === 'model' && !msg.text.startsWith('Error') && <CheckCircle size={14} className="text-green-500 shrink-0" />}
                    {msg.role === 'model' && msg.text.startsWith('Error') && <AlertCircle size={14} className="text-red-500 shrink-0" />}
                    {msg.text}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Sending indicator */}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-indigo-600" />
                <span className="text-sm text-slate-500">Editing image...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="px-4 py-3 border-t border-slate-200 bg-brand-surface-container-highest">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe your edit..."
              disabled={isSending}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || isSending}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
