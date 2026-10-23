# EduNomad Course Compass UX and UI specification

Version 2.0 | 23 October 2026 | Candidate release for review

## Design direction

Course Compass belongs to the EduNomad brand. Its interface now uses the supplied deep navy and metallic gold palette, white text on dark surfaces and light grey supporting text. The parent website was inspected as a visual reference on 23 October 2026. The application translates that identity into a practical research workspace with warm content surfaces, larger reading text and clear next actions.

This specification describes the candidate implementation. It is not a claim that the changes have been accepted or released to production. The implementation references are `app/globals.css`, `app/_components/course-compass.tsx`, `app/_components/workspace-access.tsx`, `app/icon.svg` and `app/apple-icon.tsx`.

## What changed and why

| Area | Previous interface | Candidate interface | Intended benefit |
| --- | --- | --- | --- |
| Brand | Green and sage, editorial serif headings | Deep navy, gold details and a system sans-serif display stack | Clear relationship to the parent brand |
| Reading | Conversation text 11 px; many labels 8–10 px | Conversation 14 px; supporting copy generally 11–13 px | Lower reading effort |
| Actions | Small send action and compact cards | 40 px send action, 46–48 px principal actions and larger cards | Easier selection and clearer hierarchy |
| Studio access | A key prompt after a failed request inside the workspace | Dedicated Studio entry and access check before loading register data | Explain access at the point it is needed |
| Credits | No allowance display | Persistent workspace credits card with explicit unknown/error states | Make availability visible without inventing a balance |
| Transparency | Narrative evidence trail | Evidence trail plus a Workflow tab with stage status and timing | Show how the latest answer was produced |
| Mobile navigation | Basic drawer | Keyboard focus containment, Escape to close and focus return | Improve keyboard operation |

## Brand tokens

| Token | Value | Use |
| --- | --- | --- |
| Primary base | `#0A1128` | Sidebar, selected mode, Studio entry background, primary ink accents |
| Deeper base | `#070D1F` | Optional dark supporting surface |
| Accent | `#C5A880` | Primary action fill, compass details, dark-surface accents and focus ring |
| White | `#FFFFFF` | Reading panels and text on dark surfaces |
| Sub-text on dark | `#E2E8F0` | Supporting text on the navy entry and navigation |
| Main ink | `#18233B` | Body text on white or warm paper |
| Secondary ink | `#596477` | Supporting text on light surfaces |
| Paper | `#F7F6F2` | Workspace canvas |
| Divider | `#E3E5EA` | Panel rules and borders |
| Soft gold | `#F2E9DB` | Supporting accent surfaces |
| Dark gold text | `#796344` | Eyebrows on light surfaces |
| Success | `#286247` | Complete/evidence-supported status |
| Warning | `#865B1C` | Review warnings and unavailable states |

Gold-filled buttons use navy text. White text on the gold fill is intentionally avoided for readability. Pale grey text belongs on dark surfaces; it is not used as paragraph text on white. Gold is an accent rather than a full-page reading colour.

The workspace does not use a moving video background. The navy entry frame carries the parent brand while keeping course evidence still and readable. No external font service, tracking script or image dependency is added by this design change.

## Typography

| Role | Family | Current specification |
| --- | --- | --- |
| Display and brand | Avenir Next, Segoe UI, Arial, sans-serif | System font stack; platform-dependent fallback |
| Body and controls | Arial, Helvetica, sans-serif | 14 px baseline, approximately 1.55 line height |
| Page title | Display stack | 34 px, 500 weight, 1.2 line height, −1 px tracking |
| Welcome title | Display stack | 34 px desktop, 40 px on wide screens, 32 px mobile |
| Evidence heading | Display stack | 25 px, 500 weight, 1.25 line height |
| Conversation | Body stack | 14 px, 1.85 line height |
| Main supporting copy | Body stack | 13–15 px, 1.7–1.8 line height |
| Brief fields | Body stack | 13 px, 1.65 line height |
| Eyebrows | Body stack | 10 px, 600 weight, 1.5–1.8 px tracking |
| Evidence/source metadata | Body stack | Generally 11–12 px |
| Fit figure | Display stack | 38 px, 500 weight |

The parent site uses its own hosted font setup. This application deliberately uses system fonts with a similar clean, approachable character; it does not claim to reproduce a licensed brand font exactly. Use the specified stack when recreating the product, and identify any font substitution in design proposals.

## Layout

### Desktop

The fixed sidebar is 290 px wide, with 30 px top and 22 px side padding. It contains the wordmark, New review action, course brief, credits card and workspace footer. It scrolls when the content exceeds the viewport.

The remaining main area has a white top bar with a minimum height of 74 px. It includes the breadcrumb, Demo/Studio switch and, where space permits, prototype and register links. The mode notice has 20 px top margin and 30 px side margins. The page introduction uses 30 px padding.

The main grid uses 30 px side and bottom padding, a 22 px gap and a chat-to-evidence ratio of 1.35:1, with minimum widths of 360 px and 320 px. Panels have 18 px radii and a 1 px border. Their nominal height is the smaller of 860 px and the viewport minus 290 px, subject to a 720 px minimum. This means short desktop screens may scroll vertically; content is not squeezed into unreadable controls.

### Responsive rules

| Width | Behaviour |
| --- | --- |
| At least 1600 px | Sidebar 310 px; grid ratio 1.6:1; welcome title 40 px; evidence padding 30 px |
| 1001–1200 px | Sidebar 255 px; grid gap 16 px; outer padding 22 px; compact panel headings; external top-bar link, prototype badge and evidence badge hidden |
| Up to 1000 px | Single content column; chat above evidence; chat 780 px high with a 660 px minimum; evidence 720 px high with a 500 px minimum; mode notice stacks |
| Up to 700 px | Sidebar becomes a 290 px off-canvas drawer; full-width main area; top bar minimum 68 px; grid side padding 13 px; chat 820 px high and evidence 730 px high |
| Up to 380 px | Breadcrumb identity can wrap into a narrow block; unit-card header wraps; unit metrics stack |

Use design frames of 1440 × 1024, 1728 × 1117, 1024 × 1024, 768 × 1024 and 390 × 844. Check 320 px for overflow. Do not infer that a browser check passed from the dimensions in this specification; see the release test record.

## Component anatomy

| Component | Important dimensions and behaviour |
| --- | --- |
| Wordmark | Gold compass with uppercase EDU-NOMAD; Course Compass descriptor; no personal avatar/name |
| Primary action | Gold fill, navy text, 10 px radius; typically 46–48 px minimum height |
| Mode switch | Navy selected button, white text; 38 px minimum button height; pressed state exposed |
| Mode notice | 12 px explanation; Demo uses a warm gold surface, Studio uses a quiet green surface |
| Welcome | Static compass motif; short headline; 14 px explanation; three starter actions |
| Starter card | 12 px radius, 15 px padding, 68 px minimum height, leading icon and trailing arrow |
| Composer | 12 px radius; 14 px multiline input; visible focus outline on its container; 40 px send action |
| Unit row | 17 px checkbox, 13 px title, code and type tag; disabled when the four-unit limit is reached |
| Assessment card | 13 px radius; 18 × 16 px padding; figure, status, metrics, source reference and disclosure |
| Evidence source | 12 px title, 11 px release/date and labelled external-link affordance |
| Workflow stage | Status label, duration, configured model ID and available token counts; no credentials or raw provider errors |
| Credits card | Dark sidebar card; percentage only when supplied by a verified source; refresh and source timestamp |
| Studio entry | Navy frame, white card up to 540 px wide, 24 px radius, 48 px password field/action |
| Mobile drawer | Focus moves inside on opening; Tab stays inside; Escape or scrim closes it; focus returns to menu |

## Demo and Studio journeys

Demo opens without an application access key, loads a prepared brief and makes no register or model request. All figures remain labelled sample illustrations. Its credits card says “No credits needed”; this is not a fictional credit allocation. Demo exports identify themselves as samples.

Choosing Studio checks `GET /api/workspace` before opening the workspace. When the shared pilot key is required, a dedicated entry screen explains how to enter and offers a route back to Demo. The key is kept only in memory. A failed key is reported on that form; no register request is issued before access is accepted. If no shared key is configured, the server permits entry, subject to hosting protection. This is shared workspace access, not individual identity or account authentication.

The access-key control is disabled while checking. Studio can be left through the Demo option. Leaving clears the review and key. A page reload uses the configured default mode and requires access to be checked again. Hosting authentication is independent and may still protect the entire deployment, including Demo; this change does not weaken that protection.

## Credits states

| State | Display | Meaning |
| --- | --- | --- |
| Demo | No credits needed | The prepared sample does not call paid AI |
| Available | Percentage remaining, progress bar and source timestamp | A trusted server source supplied a valid workspace allowance |
| Not configured | Credits not assigned | No workspace allowance source is connected; this is not zero balance |
| Unavailable | Credits temporarily unavailable | The source could not provide a valid response |
| Zero | 0% remaining | A verified source explicitly returned zero |

The application receives only the normalised percentage and timestamp, not a monetary budget or provider account balance. Credits are shared across the pilot workspace. No client-side counter is presented as a ledger. Per-user accounting, replenishment and automatic spend enforcement require additional identity and ledger work.

## Evidence and Workflow tabs

The evidence panel contains Unit workspace, Evidence trail and Workflow tabs. Workflow shows the most recent live request: course retrieval, optional Gemini shortlisting, unit retrieval, JEV assessment and final Gemini explanation. Each stage shows Complete or Unavailable, elapsed milliseconds and model/token details where available.

JEV precedes the final explanation. The optional Gemini planner can run before JEV when no units have been selected. The UI must preserve that distinction. A successful request is not necessarily a fully assessed result: unavailable JEV withholds fit, and unavailable Gemini returns a labelled evidence summary.

Workflow is a view of the latest request, not persistent history. The release test record provides the separate development baseline. Demo states clearly that no model was called.

## Interaction and accessibility

All principal inputs and icon actions have accessible names. Mode buttons expose their pressed state. Error messages use alerts; conversation changes use a polite live region. Enter submits and Shift+Enter inserts a new line. Focus rings are 3 px gold with a 3 px offset. Reduced-motion preference disables transitions, smooth scrolling and spinners.

The readable text, larger controls and keyboard drawer are improvements, not a claim of full accessibility certification. Supporting metadata is still compact. Browser zoom, screen-reader behaviour, focus order, contrast and touch-target spacing should remain part of release review.

## Copy principles

Use clear Australian English. Address the designer's task directly and explain the next action. Use “not assigned”, “unavailable” and “not assessed” precisely. Never turn an unknown into zero or describe a sample as a model result. Do not imply that suitability is compliance, that a shared key identifies a person or that the credits card implements billing.

## Recreation brief for design tools

> Recreate EduNomad Course Compass using the tokens and components in this document. Keep a deep navy sidebar and Studio entry, metallic gold primary actions with navy text, white reading panels and a warm paper canvas. Use the system display stack and 14 px body reading text. Make the experience calm, practical and approachable. Create desktop, compact and mobile frames, plus Demo welcome/result, Studio entry, invalid key, loading, Studio result, model-unavailable, credits-unknown and credits-available states. Include the Unit workspace, Evidence trail and Workflow tabs. Preserve sample/live labels and source provenance. Do not add personal names, invented balances, user accounts or compliance badges. Return editable components and annotate proposed changes to this baseline.

## Change handover

For each proposed revision, specify the screen/state, component, token or dimension, interaction change and mobile consequence. Separate visual changes from new functionality. All implementation changes go through a reviewable pull request; production release follows acceptance.
