# EduNomad Course Compass — UX/UI specification

Version: 1.0 · 23 October 2026 · Proposed Demo/Studio release

## Purpose and source of truth

Use this document to reproduce the current interface in a design tool, discuss alternatives and return a clear design brief for implementation. It describes the interface in this branch, including the proposed Demo/Studio switch. It does not claim that these changes are already in production.

The product helps Australian course designers explore units against a course brief. The visual tone is calm, editorial and evidence led: deep navy navigation, warm off-white canvas, sage details and serif display headings. The interface should feel like a considered research workspace.

The implementation sources are `app/_components/course-compass.tsx`, `app/globals.css`, `lib/demo.ts` and `app/icon.svg`. The custom workspace uses CSS and Lucide icons. Other component files in the repository belong to the optional agent scaffold; they are not the visual specification for this page. No external font files or photographs are required.

## Information architecture

| Area | Content and purpose |
| --- | --- |
| Persistent navigation | Wordmark, New review, workspace identity, course brief, workspace footer |
| Top bar | Breadcrumb, Demo/Studio control, prototype badge and national register link |
| Mode notice | Current mode, what the data represents and warning that switching clears the review |
| Page introduction | Editorial eyebrow, Course Compass heading, supporting sentence and evidence/sample badge |
| Research conversation | Welcome state, starter actions, user and assistant messages, progress, errors and composer |
| Unit workspace | Unit selector before a review; assessment cards and a selector after a review |
| Evidence trail | Process steps, official source links for Studio, boundaries and Markdown export |

## Modes and state boundaries

| Behaviour | Demo | Studio |
| --- | --- | --- |
| Purpose | Walk through one prepared scenario | Research a course using live services |
| Brief | Fixed; fields visibly disabled | Editable qualification code, objectives and cohort |
| Unit data | Authored samples; status unchecked | Current register retrieval |
| Figures | Fixed, labelled illustrative values | JEV results when available; withheld on failure |
| Confidence | Unavailable | Native model output when available |
| Requests | No register or model request | Register and authenticated model requests |
| Export | Title and filename explicitly identify a Demo sample | Review, sources, releases and limitations |

The segmented control contains **Demo** and **Studio**. The active option has a dark green fill and white text; the inactive option is transparent with green-grey text. Each button exposes its pressed state. Mode switching remounts the workspace, clears the conversation, selection changes, results, draft and any in-memory access key, then restores the initial brief. Switching is disabled while a request or initial register load is running.

The mode control is a workspace choice, not login, entitlement or a security boundary. Studio is available from Demo; any API access protection is enforced separately on the server.

## Layout and responsive behaviour

### Desktop reference: 1440 × 1024

- Fixed left sidebar: 288 px wide, full viewport height, independently scrollable, padding 33 px top and 25 px sides.
- Main shell: remaining width, 100 vh tall, flex column. No horizontal page overflow.
- Top bar: 66 px tall, white, 36 px horizontal padding, bottom rule.
- Mode notice: 16 px top margin, 36 px side margins, 11 × 14 px internal padding. Two text groups with a 14 px gap.
- Page introduction: 31 px top, 36 px sides, 28 px bottom. Heading and badge aligned across the row.
- Main grid: 36 px side padding, 24 px bottom, 22 px column gap. Chat to evidence ratio 1.5:1; minimum columns 380 px and 320 px. At this frame the panel widths are approximately 635 px and 423 px.
- Panels use the remaining available height. Conversation and evidence content scroll internally; panel headers, composer and footer remain within their respective panel shells.

### Breakpoints implemented

| Viewport | Behaviour |
| --- | --- |
| At least 1550 px | Sidebar 305 px; chat/evidence ratio 1.8:1; welcome heading 41 px; evidence padding 28 px |
| 1181–1549 px | Base desktop layout |
| 951–1180 px | Sidebar 248 px; outer grid padding 22 px; gap 15 px; columns minimum 310/280 px, ratio 1.2:1; evidence badge and external top-bar link hidden |
| 641–950 px | Sidebar 225 px; one content column; chat above evidence; page scrolls; chat min 660 px/max 900 px; evidence min 480 px/max 850 px |
| Up to 640 px | Sidebar becomes a 285 px off-canvas drawer; menu button appears; dismissible full-screen scrim; top bar 55 px; grid side padding 13 px; chat min 640 px/max 850 px; evidence min 430 px; notice text stacks |

The prototype badge is hidden at 1180 px and below to preserve space for the mode switch. The switch and mode notice remain visible at every width. At 950 px and below the panel subtitle is hidden. The wordmark link returns to the home route.

At 380 px and below, the Workspace breadcrumb and slash are hidden to retain space for the menu, page identity and mode switch.

### Suggested design frames

Create Desktop 1440 × 1024, Wide 1728 × 1117, Tablet 1024 × 1024, Compact 768 × 1024 and Mobile 390 × 844. Also inspect 320 px width for overflow. Use vertical auto layout for content and explicit min/max constraints instead of shrinking every element proportionally.

## Colour system

These are implementation values, not a proposed palette change.

| Token or use | Hex | Application |
| --- | --- | --- |
| Navy / `--navy` | `#142F37` | Sidebar |
| Deep navy / `--navy-dark` | `#10292F` | Darker supporting surface; mobile scrim uses this at 40% opacity |
| Ink / `--ink` | `#203B42` | Main text foundation |
| Muted / `--muted` | `#728186` | Secondary text token |
| Divider / `--line` | `#E5E9E7` | Panel and shell rules |
| Green / `--green` | `#32755E` | Brand token available for accents |
| Paper / `--paper` | `#F8F9F5` | Main canvas |
| White | `#FFFFFF` | Panel surfaces and reversed text |
| Action green | `#355A47` | Composer send button; selected mode |
| Sidebar input | `#203E46` | Course-code and brief fields |
| Sidebar field border | `#456067` | Input/textarea outlines |
| Wordmark accent | `#C7D6A1` | Compass symbol |
| Focus ring | `#A7BE65` | 2 px outline with 3 px offset |
| Selection fill | `#7D9C6C` | Checked unit boxes |
| Fit track / fill | `#EDF1E5` / `#94AD74` | Three-pixel fit bar |
| Sample notice background / border / text | `#FBF7EC` / `#E4DCC5` / `#725D32` | Demo banner |
| Studio notice background / border / text | `#EDF4ED` / `#D7E4D6` / `#486352` | Studio banner |
| Warning background / border / text | `#FFFAF0` / `#E9DCBC` / `#977C49` | Request error |
| Unlisted-unit background / text | `#F8F0DC` / `#AC9457` | Importing review label |

Much of the current evidence panel uses pale sage secondary text. Preserve exact values for a faithful recreation, but review contrast before adopting them as a production design system. A darker, more readable alternative should be presented as a deliberate revision, with the changed tokens identified.

## Typography

| Role | Current family | Size / treatment |
| --- | --- | --- |
| Body baseline | Arial, Helvetica, sans-serif | 14 px; most UI components override this |
| Wordmark | Same sans serif | 25 px, bold first part and regular second part, −1.3 px tracking |
| Page title | Georgia, Times New Roman, serif | 33 px, regular, 1.2 line height, −1 px tracking |
| Welcome headline | Same serif | 36 px, regular, 1.18 line height, −1 px tracking |
| Evidence heading | Same serif | 24 px, regular, 1.25 line height, −0.5 px tracking |
| Fit figure | Same serif | 35 px, regular, line height 1 |
| Conversation body | Arial/Helvetica | 11 px, line height 1.85; paragraphs preserve line breaks |
| Brief labels / fields | Arial/Helvetica | 11 px desktop; 12 px mobile |
| Eyebrows | Arial/Helvetica | Usually 8 px, 600 weight, 1.8–2 px tracking, uppercase |
| Supporting labels | Arial/Helvetica | Typically 8–11 px; unit type tags as small as 6 px |
| Mode switch / notice | Arial/Helvetica | 11 px; notice secondary line 10 px |

These small sizes describe the existing compact prototype. For accessibility revisions, propose 14–16 px primary reading text, larger supporting labels and 44 px touch targets, then adjust panel density and wrapping. Those changes are not included simply by following this document. Do not silently substitute a different font; if a tool lacks Georgia, mark the substituted serif and keep its role and proportions consistent.

## Spacing, shape and imagery

- Common spacing increments: 4, 5, 7, 8, 10, 12, 14, 16, 20, 22, 24, 28, 32 and 36 px. Use the component-specific values below for exact recreation.
- Panel radius 10 px; composer 8 px; starter/unit cards 7 px; fields 5–6 px; compact tags 3–4 px; evidence badge pill 20 px.
- Panel border 1 px. Chat shadow is extremely light: `0 3px 12px #213C3A02`. Composer shadow: `0 3px 8px #142F3703`.
- Welcome compass: 91 × 91 px circular illustration, 62 px Lucide Compass icon at stroke width 1, radial sage wash, fine outer border, −9° rotation and one small orbit dot.
- Icon language: Lucide outline icons; common sizes 12–20 px, sidebar brand symbol 26 px. Use Compass, ArrowUpRight, BookOpen, FileCheck2, Search, Sparkles, ShieldCheck, Download, Menu and X. No stock photography, gradients across the page or decorative illustrations beyond the compass motif.

## Components to build in Figma

| Component | Variants and anatomy |
| --- | --- |
| Brand/Wordmark | Compass symbol + `edunomad` text + small uppercase tagline |
| Navigation/New review | Leading Plus, text, decorative shortcut glyph; no keyboard shortcut is implemented |
| Brief/Code field | Label, input, trailing load action; loading spinner; disabled Demo state |
| Brief/Textarea | Label, multiline value, normal/disabled/focus states |
| Mode/Switch | Two buttons, Demo or Studio selected, disabled during work |
| Mode/Notice | Amber Demo and green Studio variants; primary explanation and reset note |
| Chat/Welcome | Compass illustration, eyebrow, two-line heading, supporting text, three starter actions |
| Chat/Starter action | Icon, title, description, trailing arrow; 13 × 14 px padding; 8 px list gap |
| Chat/Message | 28 px avatar, 10 px gap, speaker label, content; user text has pale bubble, assistant text sits on white |
| Chat/Composer | Two-line textarea, selection indicator and 29 px send action; empty, populated and busy variants |
| Feedback/Error | Amber container, message and labelled dismiss action |
| Access/Shared key | Password input and Unlock action, shown after an API 401; key stays in browser memory |
| Evidence/Tabs | Unit workspace and Evidence trail; active underline 2 px; optional unit count |
| Unit/Selection row | 13 px checkbox, unit code, type tag and title; selected, unselected and disabled-at-limit variants |
| Unit/Assessment card | Code/status, title, figure, recommendation, 3 px bar, metrics, source reference, warnings and disclosure |
| Evidence/Process step | 19 px numbered circle, text, 16 px gap between steps |
| Evidence/Source link | Document icon, source title, release/date and external-link icon |
| Evidence/Disclosure | Native expandable summary and body; official content or boundaries |
| Export/Action | Full-width bordered green button with Download icon |
| Mobile/Navigation | Drawer, scrim and menu trigger; closed/open variants |

Use separate semantic variants for **sample**, **complete**, **unavailable**, **core**, **listed elective** and **importing review required**. Never rely on colour alone. A Demo score must always read “sample fit” and “illustrative figure”; it must never read “JEV assessment complete”.

## Flows and state inventory

1. **Demo welcome:** fixed course brief, three sample units, no network dependency. Selecting a starter or sending a question opens the prepared sample response.
2. **Demo result:** sample cards, sample discussion points, no official source entries, explicit sample process trail and labelled export.
3. **Studio initial load:** fetch the default qualification; show loading on the load button. Starter actions remain unavailable until a qualification is loaded.
4. **Studio research:** edit/load a course; edit objectives and cohort; filter and select at most four units; review the selection or request autonomous shortlisting.
5. **Pending review:** append the user message immediately, disable submission and mode switching, show progress. The response appears when the JSON result arrives; token streaming is not implemented.
6. **Success:** unit cards and evidence trail update together. New brief text clears prior messages and results.
7. **Service degradation:** retain official evidence and withhold fit when JEV is unavailable. If Gemini fails, show a labelled evidence summary. Do not turn unknown results into a score of zero.
8. **Request failure:** show dismissible error, restore the question to the composer and remove its unanswered user bubble so it can be retried.
9. **Access key required:** show the in-memory shared-key form after 401. This is not a user-account login screen.
10. **New review:** clear chat, result, draft and error; retain the current brief and selection.
11. **Mode change:** reset the entire workspace to the selected mode's initial state. The mode is not saved across reloads; the server default applies again.

## Accessibility and motion

The implementation includes labelled inputs, named icon buttons, focus-visible outlines, pressed-state mode buttons, an alert for errors, a polite live region for conversation updates and native details/summary controls. Enter submits; Shift+Enter adds a line break. Reduced-motion preference disables transitions, smooth scrolling and spinner animation.

The current prototype is not certified against an accessibility standard. Known review areas are compact text/targets, muted contrast and mobile drawer keyboard behaviour. A focus trap, Escape-to-close and focus restoration are not yet implemented for the drawer. Keep these as explicit design/engineering improvements rather than implying they already work.

## Copy and behaviour constraints

- Use English with Australian spelling: “normalised”, “organisation”, “behaviour”.
- Preserve the difference between suitability, model confidence and register eligibility.
- Use “Needs more evidence” or an em dash for unknown assessment values; retain explanatory text.
- Preserve source links, release metadata and boundaries in live reviews.
- Do not add account names, real learner records, private conversations, keys, budgets or usage balances to mock-ups.
- Do not add billing, persistent history or a verified-compliance badge: those features are not implemented.

## Paste-ready recreation brief

> Recreate EduNomad Course Compass as a responsive research workspace. Use the layout, tokens, component anatomy and states in this document as the baseline. Desktop: 288 px fixed navy sidebar, white 66 px top bar, persistent Demo/Studio segmented control and mode notice, editorial serif page heading, then white chat and evidence panels at 1.5:1 with a 22 px gap on a warm off-white canvas. Use Georgia for display headings, Arial/Helvetica for controls, sage outline icons and very light borders. Build the course brief, welcome starters, conversation, composer, unit selector, sample/live assessment cards, evidence trail and export. Include Desktop 1440, Tablet 1024, Compact 768 and Mobile 390 frames. Show Demo welcome, Demo result, Studio welcome, Studio result, loading, unavailable assessment, request error and mobile navigation. Demo contains fixed labelled illustrations; Studio uses live-service semantics. Do not fabricate an official source, confidence value or compliance outcome. Use only anonymous sample content. Return editable components and annotate any deliberate departure from this baseline.

## Returning design changes

For each proposed change, identify the screen/state, component, new token or dimension, interaction change and mobile consequence. Distinguish visual changes from new product functionality. Include a screenshot or design reference for each changed state, and indicate which variants are approved. A revised design should enter implementation through a reviewable pull request.
