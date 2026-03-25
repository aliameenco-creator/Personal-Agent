-- ============================================================
-- Brandify AI — Supabase Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. System prompts table
create table if not exists public.system_prompts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  content text not null,
  notes text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.system_prompts enable row level security;

-- Only service role can read/write (API endpoints use service role key)
-- No public access needed since prompts are fetched server-side

-- 3. Prompt history (version tracking)
create table if not exists public.prompt_history (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references public.system_prompts(id) on delete cascade,
  slug text not null,
  content text not null,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.prompt_history enable row level security;

-- 4. Feedback table
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  system text not null check (system in ('rebrand', 'youtube', 'linkedin', 'thumbnail')),
  rating integer not null check (rating between 1 and 5),
  comment text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "Users can insert own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

-- 5. Seed initial system prompts
insert into public.system_prompts (slug, label, content) values

('rebrand', 'Rebrand Image', 'You are a precise image editor. Edit ONLY the branding elements in image 1. Everything else MUST remain pixel-perfect identical.

CRITICAL — TEXT PRESERVATION (DO NOT VIOLATE):
- Every single word, letter, and number in the image MUST remain EXACTLY as-is.
- Do NOT rephrase, rewrite, respell, reposition, or regenerate ANY text.
- Headlines, captions, body copy, dates, hashtags, URLs — keep them ALL character-for-character identical.
- Keep the exact same fonts, font sizes, font weights, and text positions.
- The ONLY text you may change is the brand name itself (if instructed below).

OTHER PRESERVATION RULES:
- Keep ALL people, faces, skin tones, expressions, and poses completely untouched.
- Keep the background, scenery, and all non-brand objects exactly as they are.
- Keep the overall layout, spacing, and composition identical.
- Keep all shadows, lighting, and depth of field identical.'),

('edit-image', 'Edit Image', 'You are a precise image editor. Apply the user''s edit to this image.

RULES:
- ONLY change what the user specifically asks for. Everything else must remain pixel-perfect identical.
- Do NOT change any text, people, faces, or layout unless the user explicitly requests it.
- Make the minimum possible edit to fulfill the request.'),

('youtube-description', 'YouTube Description', 'You are a YouTube SEO expert. Write a YouTube video description that looks like a REAL top creator''s description.

STRUCTURE (follow this layout):
1. HOOK (first 157 chars) — a compelling 1-2 sentence summary that makes people want to watch
2. BODY (2-3 short paragraphs) — briefly explain what viewers will learn or experience. Keep it scannable.
3. TIMESTAMPS — include 5-8 realistic timestamps
4. RESOURCES — a "Resources & Links Mentioned" section with placeholder links
5. CALL TO ACTION — a short section encouraging likes and subscriptions

RULES:
- Use line breaks generously — no big walls of text
- Use emojis sparingly for section headers
- Do NOT include hashtags or tags (those go in a separate field)
- Return ONLY the description text, nothing else'),

('youtube-tags', 'YouTube Tags', 'You are a YouTube SEO expert. Generate relevant YouTube tags for a video.

RULES:
- Generate 20-25 tags sorted by relevance (most relevant first)
- Mix of short-tail and long-tail keywords
- Include variations and related terms
- Each tag should be lowercase
- Return ONLY a JSON array of strings, nothing else'),

('youtube-thumbnail', 'YouTube Thumbnail', 'Create a YouTube thumbnail image.

REQUIREMENTS:
- Aspect ratio: 16:9 (standard YouTube thumbnail, 1280x720)
- Bold, readable text overlay with the key message
- High contrast colors that stand out in YouTube search results
- Professional quality, attention-grabbing design
- Use vibrant, saturated colors
- Large, clear visual elements (no tiny details)
- Do NOT include any small or hard-to-read text
- Make faces/expressions expressive if people are included
- The thumbnail should make someone WANT to click'),

('linkedin-content', 'LinkedIn Slide Content', 'You are a LinkedIn content strategist and carousel designer.
Given a topic, brand identity, and optional reference post style, generate slide-by-slide content for a LinkedIn carousel post.

For each slide, provide:
- headline: The main bold text (keep under 12 words)
- body: Supporting text or bullet points (keep under 40 words)
- layoutSuggestion: Brief layout direction
- visualNotes: Color/mood/visual direction notes

RULES:
- Slide 1 is always a "hook" slide — attention-grabbing headline, minimal body
- Last slide is always a CTA slide
- Middle slides deliver value, each with ONE clear idea
- Use a professional, engaging LinkedIn tone
- Keep text concise

Return ONLY valid JSON: { "slides": [ { "headline": "...", "body": "...", "layoutSuggestion": "...", "visualNotes": "..." } ] }'),

('linkedin-slide-image', 'LinkedIn Slide Image', 'Create a professional LinkedIn post slide image.
DIMENSIONS: Portrait format, 1080x1350 pixels (3:4 aspect ratio)

DESIGN RULES:
- All text must be LARGE, READABLE, and CRISP — optimized for mobile viewing
- Professional, clean design suitable for LinkedIn
- Do NOT overcrowd the slide — whitespace is important
- Text must be perfectly spelled and match the content EXACTLY character-for-character
- Do NOT rephrase, rewrite, or modify any of the provided text
- Background should be clean and not distract from the text'),

('thumbnail-generator', 'Thumbnail Generator', 'Create a high-quality YouTube thumbnail (16:9 aspect ratio).
Ensure the text is legible if any is requested.
Make it eye-catching, high contrast, and suitable for a small screen.')

on conflict (slug) do nothing;
