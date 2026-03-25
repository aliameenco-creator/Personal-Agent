import React, { useState, useEffect } from 'react';
import { Settings, MessageSquare, Save, Loader2, ChevronDown, ChevronRight, ArrowLeft, Star } from 'lucide-react';
import { apiGet, apiPost } from '../../services/apiClient';

interface SystemPrompt {
  id: string;
  slug: string;
  label: string;
  content: string;
  notes: string | null;
  updated_at: string;
}

interface FeedbackEntry {
  id: string;
  system: string;
  rating: number;
  comment: string | null;
  metadata: any;
  created_at: string;
}

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [tab, setTab] = useState<'prompts' | 'feedback'>('prompts');
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [feedbackSystem, setFeedbackSystem] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [promptData, feedbackData] = await Promise.all([
        apiGet<{ prompts: SystemPrompt[] }>('prompts/list'),
        apiGet<{ feedback: FeedbackEntry[] }>('feedback/list?limit=100'),
      ]);
      setPrompts(promptData.prompts);
      setFeedback(feedbackData.feedback);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompt = async (prompt: SystemPrompt) => {
    const content = editContent[prompt.id] ?? prompt.content;
    setSaving(prompt.id);
    try {
      await apiPost('prompts/update', { id: prompt.id, content });
      setPrompts(prev => prev.map(p => p.id === prompt.id ? { ...p, content, updated_at: new Date().toISOString() } : p));
      setExpandedPrompt(null);
    } catch (err: any) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(null);
    }
  };

  const filteredFeedback = feedbackSystem === 'all'
    ? feedback
    : feedback.filter(f => f.system === feedbackSystem);

  const avgRating = (system: string) => {
    const items = system === 'all' ? feedback : feedback.filter(f => f.system === system);
    if (items.length === 0) return 0;
    return (items.reduce((sum, f) => sum + f.rating, 0) / items.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-brand-surface-container-high text-brand-on-surface-variant transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-brand-on-surface">Admin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('prompts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'prompts'
                ? 'bg-brand-primary text-white'
                : 'bg-brand-surface-container-high text-brand-on-surface-variant hover:text-brand-on-surface'
            }`}
          >
            <Settings size={16} /> System Prompts
          </button>
          <button
            onClick={() => setTab('feedback')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'feedback'
                ? 'bg-brand-primary text-white'
                : 'bg-brand-surface-container-high text-brand-on-surface-variant hover:text-brand-on-surface'
            }`}
          >
            <MessageSquare size={16} /> Feedback ({feedback.length})
          </button>
        </div>

        {/* Prompts Tab */}
        {tab === 'prompts' && (
          <div className="space-y-3">
            {prompts.map(prompt => (
              <div key={prompt.id} className="card-bright rounded-xl overflow-hidden">
                <button
                  onClick={() => {
                    setExpandedPrompt(expandedPrompt === prompt.id ? null : prompt.id);
                    if (!editContent[prompt.id]) {
                      setEditContent(prev => ({ ...prev, [prompt.id]: prompt.content }));
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div>
                    <p className="font-medium text-brand-on-surface">{prompt.label}</p>
                    <p className="text-xs text-brand-on-surface-variant mt-1">
                      {prompt.slug} — updated {new Date(prompt.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  {expandedPrompt === prompt.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>

                {expandedPrompt === prompt.id && (
                  <div className="px-4 pb-4 space-y-3">
                    <textarea
                      value={editContent[prompt.id] ?? prompt.content}
                      onChange={(e) => setEditContent(prev => ({ ...prev, [prompt.id]: e.target.value }))}
                      className="w-full h-64 px-3 py-2 rounded-lg bg-brand-surface-container-low border border-brand-outline-variant text-brand-on-surface text-sm font-mono focus:outline-none focus:border-brand-primary resize-y"
                    />
                    <button
                      onClick={() => handleSavePrompt(prompt)}
                      disabled={saving === prompt.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      {saving === prompt.id ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            ))}

            {prompts.length === 0 && (
              <p className="text-center text-brand-on-surface-variant py-8">
                No system prompts found. Run the SQL migration to seed initial prompts.
              </p>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {tab === 'feedback' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              {['all', 'rebrand', 'youtube', 'linkedin', 'thumbnail'].map(sys => (
                <button
                  key={sys}
                  onClick={() => setFeedbackSystem(sys)}
                  className={`p-3 rounded-xl text-center transition-colors ${
                    feedbackSystem === sys
                      ? 'bg-brand-primary/20 border border-brand-primary'
                      : 'card-bright'
                  }`}
                >
                  <p className="text-xs text-brand-on-surface-variant capitalize">{sys}</p>
                  <p className="text-lg font-bold text-brand-on-surface flex items-center justify-center gap-1">
                    <Star size={14} className="fill-brand-primary text-brand-primary" />
                    {avgRating(sys)}
                  </p>
                </button>
              ))}
            </div>

            {/* Entries */}
            <div className="space-y-2">
              {filteredFeedback.map(entry => (
                <div key={entry.id} className="card-bright rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-surface-container-high text-brand-on-surface-variant capitalize">
                        {entry.system}
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} size={12} className={n <= entry.rating ? 'fill-brand-primary text-brand-primary' : 'text-brand-outline-variant'} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-brand-on-surface-variant">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  {entry.comment && (
                    <p className="text-sm text-brand-on-surface">{entry.comment}</p>
                  )}
                </div>
              ))}

              {filteredFeedback.length === 0 && (
                <p className="text-center text-brand-on-surface-variant py-8">No feedback yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
