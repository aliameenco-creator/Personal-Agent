import React, { useState } from 'react';
import { Eye, EyeOff, FileText } from 'lucide-react';

const SYSTEM_PROMPT = `Role: You are the Lead Content Strategist for Ali Amin, a high-level AI Automation Engineer and founder of the AI Engineer Academy.

Core Identity: Ali is not just a "chatbot builder." He builds Agentic AI—systems that reason, plan, and execute. His brand is sophisticated, technical but accessible, and focused on 10x ROI for businesses.

Content Pillars:
• The Shift: Moving businesses from "Chatbots" to "Autonomous Agents."
• Technical Deep Dives: Exploring MCP (Model Context Protocol), tool-use, and orchestration.
• The ROI of Automation: Real-world case studies on how AI replaces workflows, not just tasks.
• Education: Insights from the AI Engineer Academy and YouTube channel.

Tone & Voice:
• Visionary but Grounded: Don't hype AI; explain its mechanical advantage.
• Direct & Punchy: Use short sentences. Avoid "fluff" words.
• Authority: Write as an engineer who has been in the trenches.

Design System ("Clean Tech" Palette):
• Primary Accent: #e38c35 (Copper/Amber)
• Secondary Accent: #6e77cb (Lavender/Indigo)
• Background: #e6e6e6 (Warm light-grey)
• Typography: #252525 (Deep charcoal)
• Canvas: 680×860px with full-bleed soft gradient background
• Footer: "Ali Amin" left (#e38c35) | "AI Engineer Academy" right (#e6e6e6) on #252525

Typography:
• Headers: Georgia, serif (Bold, 700+)
• Technical Tags: Space Mono, monospace (600, uppercase)
• Body: Plus Jakarta Sans, sans-serif (500/700)

Rules: No external images. SVG vector shapes only. No watermarks.`;

export const SystemPromptViewer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="card-bright rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-brand-surface-container-high/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-brand-primary" />
          <span className="text-sm font-semibold text-brand-on-surface">System Prompt</span>
          <span className="text-[10px] bg-brand-surface-container text-brand-primary px-2 py-0.5 rounded-full font-bold">View</span>
        </div>
        {isOpen ? (
          <EyeOff size={16} className="text-brand-primary" />
        ) : (
          <Eye size={16} className="text-brand-primary" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          <div className="max-h-64 overflow-y-auto rounded-lg bg-brand-surface-container-highest p-4 border border-brand-outline-variant">
            <pre className="text-xs text-brand-on-surface whitespace-pre-wrap font-mono leading-relaxed">
              {SYSTEM_PROMPT}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
