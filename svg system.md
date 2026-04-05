System Documentation: Agentic Ali Content Engine
Version: 2.0 (Full-Bleed Design)
AI Model: Gemini 1.5 Pro
Author: Content Strategist for Ali Amin
1. System Overview
The "Agentic Ali" System is an automated content pipeline designed to convert high-level technical AI engineering concepts into authoritative, high-conversion LinkedIn carousels. The system focuses on Agentic AI—moving beyond simple chatbots to autonomous systems that reason and execute.
2. The Model: Gemini 1.5 Pro
This system is optimized for Gemini 1.5 Pro.
Reasoning: High-level architectural planning.
Context Window: Capable of processing long technical whitepapers (e.g., Anthropic/OpenAI blogs) and converting them into multi-slide narratives.
Code Generation: Precise SVG coordinate math for 680x860 "LinkedIn Info-cards."
3. The Design System ("Clean Tech")
All visual outputs must strictly adhere to the following CSS/SVG specification:
A. Color Palette (HEX)
Element	HEX Code	Usage
Primary Accent	#e38c35	Copper/Amber: Hooks, primary highlights, Left Footer.
Secondary Accent	#6e77cb	Lavender/Indigo: Secondary icons, tags, gradients.
Typography	#252525	Deep Charcoal: High readability for headers and body.
Base Background	#e6e6e6	Warm Light-Grey.
Footer BG	#252525	Solid block at the bottom.
B. Background Style (Soft Dim Gradient)
Backgrounds must be Full-Bleed (no outer margins).
Gradient: Linear, Top-Left to Bottom-Right.
Stop 1 (0%): #f2ede9 (Copper tint)
Stop 2 (50%): #e6e6e6 (Neutral)
Stop 3 (100%): #eceef4 (Lavender tint)
C. Typography
Headers: Georgia, serif (Bold, Weight 700+).
Technical Tags: Space Mono, monospace (Weight 600, All Caps, Letter-spacing 1.5).
Body/UI Text: Plus Jakarta Sans, sans-serif.
Weight 500: Standard body text.
Weight 700: Emphasis/Headers inside cards.
Weight 400: Right-aligned footer (Secondary branding).
D. Layout & Footer
Canvas Size: 680px (Width) x 860px (Height).
Footer Block: rect from y=790 to y=860 with fill #252525.
Left Footer (x=40): "Ali Amin" (#e38c35, Weight 700).
Right Footer (x=640, text-anchor="end"): "AI Engineer Academy" (#e6e6e6, Weight 400).
4. Iconography Metaphors
Legacy/Hard-Coded: Mechanical Gears or rigid parallel lines (#6e77cb).
Agentic/Model-Led: Neural Nodes, Brain-like connections, or adaptive nodes (#e38c35).
5. Master Parallel Generation Prompt
To generate multiple slides in parallel, use the following prompt structure:
PROMPT TEMPLATE:
"Using the Agentic Ali Design System, generate [Number] SVG slides for a LinkedIn carousel based on [Topic/Link].
Instructions for Parallel Output:
Extract [Number] distinct insights from the provided source.
For each insight, generate a unique 680x860 SVG code block.
Ensure all slides use the Full-Bleed Soft Gradient background (#f2ede9 to #eceef4).
Adhere to the Split Footer rule (Ali Amin Left / AI Engineer Academy Right with 400 weight).
Slide 1: Hook/Title.
Slide [X]: Technical Comparison using the Gear vs. Node iconography.
Final Slide: Call to Action (CTA) for the AI Engineer Academy.
Output each SVG code block sequentially."
6. Implementation Rules
No External Images: Use only SVG vector shapes.
Internal Cards: Use rect with fill="#ffffff" and fill-opacity="0.85" for content blocks to allow the background gradient to bleed through.
Direct Voice: Avoid corporate fluff. Speak as an engineer.
Full-Bleed: The very first element in every SVG must be <rect width="680" height="860" fill="url(#softBg)" />.
