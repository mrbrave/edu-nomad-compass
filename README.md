# EduNomad Course Compass

An independent research prototype for Australian RTO course designers. It compares official units of competency with a fixed course brief, using Gemini for research and explanations and JEV for structured suitability assessments.

## Independence

This is a new codebase and Git repository. It has no runtime connection to 1906.au, its Git repository, API endpoints, Supabase database, environment files or deployments. Reference integration source was inspected read-only; no credentials were copied. The user designated `mrbrave/edu-nomad-compass` as this project's new GitHub destination. Use a **new** Vercel project named `edunomad-course-compass`. The older `mrbrave/edu-nomad` repository is a separate active project and must not be changed.

## What the prototype does

- Loads qualifications and skill sets from the official training.gov.au JSON API.
- Retrieves the current release, packaging text, unit grid, application, performance criteria, foundation skills and assessment requirements.
- Displays compulsory core units separately from listed electives.
- Lets the user select up to four units or lets a Gemini tool agent shortlist units from official results.
- Runs JEV against the course objectives, cohort and retrieved evidence before Gemini writes its explanation.
- Shows objective fit, cohort fit, native JEV confidence and a supporting official section, alongside deterministic register checks.
- Exports a Markdown review with the course brief, assessment, limitations, retrieval dates, releases, sources and unit evidence.
- Returns clearly labelled evidence-only results when AI is unavailable. No substitute scores are generated.

The default example is BSB50420, Diploma of Leadership and Management, for frontline managers. It starts with BSBCMM412, BSBLDR522 and BSBPEF501. Press **Find the right electives** or **Let the agent choose** to exercise autonomous shortlisting instead.

## Data access without scraping

The adapter uses structured JSON endpoints published in training.gov.au's OpenAPI documentation. It does not automate or scrape the rendered website.

- API documentation: https://training.gov.au/swagger/index.html
- Integration guidance: https://training.gov.au/support/connecting-your-system-traininggovau-apis-1
- Training component: `GET /api/training/{code}`
- Current release: `GET /api/training/{code}/releases/{release}`
- Qualification unit grid: `GET /api/training/{code}/releases/{release}/unitgrid`
- Official content: `GET /api/content/bundle/{id}`
- Prerequisites: `GET /api/training/{code}/prerequisites`
- Search: `GET /api/search/training`

The official integration guidance also describes SOAP web services. Public availability of the website JSON API does not establish a commercial service agreement, permitted reuse, stable external support or a rate-limit guarantee. Confirm the preferred production integration and reuse terms with the National Training Register team before selling the service. The JSON adapter is isolated in `lib/training.ts` so it can be replaced without changing the assessment workflow.

## Run locally

Node.js 24 is required.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Enter this project's own AI Gateway key in `.env.local` for local AI requests. Never place credentials in source or chat. Without AI access, the official register explorer and evidence-only review still work when units are selected.

The web application uses Next.js. The shared review and search actions are also authored as Eve tools in `agent/tools`. The custom `/api/chat` route enforces retrieval → register checks → JEV → Gemini. The optional Eve HTTP channel remains protected by its starter authentication and is not the public web entry point.

## Model configuration

| Variable | Purpose |
| --- | --- |
| `GEMINI_MODEL` | Gateway model ID for planning and explanations; default `google/gemini-3.8-flash` |
| `JEV_MODEL` | Gateway evaluation model ID; default `typesafe-ai/jev-1.14.0` |
| `AI_GATEWAY_API_KEY` | This project's server-only local or external-runtime credential; optional on Vercel |
| `COMPASS_ACCESS_TOKEN` | Optional extra app-level access key, held in memory by the UI |

Both default model IDs were verified in the live Gateway catalogue on 22 October 2026. JEV uses the TypeSafe-compatible Gateway endpoint to preserve native Score, Choice, Noul and confidence semantics. Vercel OIDC can authenticate both services within a new deployment without copying another project's keys. Gateway access, available credits and any account verification requirement still need a live check in that deployment. Gemini and TypeSafe provider balances are separate from Gateway credits unless intentional BYOK is configured.

## Deploy to a new project

1. Push this checkout only to the user-designated repository, `mrbrave/edu-nomad-compass`. That repository was public and empty when inspected on 22 October 2026. Never commit credentials.
2. Create a new Vercel project with the same name under the intended account. Import **only the new repository**.
3. Use the Next.js preset and Node.js 24. `vercel.json` requests Sydney for functions.
4. Enable the new project's OIDC token and protect the prototype with Vercel Authentication. Keep the prototype private. If the account cannot provide the required protection, configure an app access key before publishing.
5. Verify the register explorer, then run one real JEV assessment followed by the Gemini explanation. Verify failures with withheld scores as well.
6. A commercial RTO service needs hosting terms that permit commercial use. Vercel Hobby is restricted to non-commercial personal use; do not upgrade or add a paid plan automatically.

The connected Vercel API returned a 403 permission error when asked to create the new project. The user subsequently supplied the new GitHub repository above, resolving the repository-creation step. Vercel creation and deployment remain unverified. Do not reuse 1906.au or the older EduNomad project to bypass these blockers.

## Validation

```bash
npm run typecheck
npm test
npm run test:register
npm run build
```

The focused tests cover core-unit retention, importing checks, currency, missing prerequisites, score normalisation, insufficient grounding, invented source sections, malformed distributions, request bounds, text sanitisation and optional access control. `test:register` uses live official data and checks complete assessment sections and unit-only search.

## Review boundaries

This prototype supports research and a shortlist discussion. It does not certify a whole qualification selection, confirm RTO scope, prove AQF importing eligibility, check every elective group or exclusion, approve training and assessment strategies, validate trainer qualifications or predict student outcomes. A high fit score cannot override core-unit or packaging requirements.

Confidence and fit have not been validated on an RTO benchmark. A weak or insufficient result is a cue to inspect evidence, not a final inclusion decision. Imported-unit level validation is explicitly unresolved. Prerequisite retrieval failure is labelled separately from an empty prerequisite list.

The register cache lasts five minutes per process. Chat context and assessments live in browser memory and are not retained after refresh. Only the last ten messages are sent for continuity; current course context and freshly retrieved evidence control every assessment. There is no persistent cross-session memory, user management, subscription billing or change-monitoring service yet. Rate limiting is per process and is suitable only as a prototype guard; commercial operation needs durable quotas and tenant isolation.

## Next product decision

Start with a paid, human-reviewed shortlist pilot for one leadership qualification and a specific learner cohort. Compare the shortlist and explanations with an experienced course designer's judgement before promising automatic course assembly. The valuable deliverable is a traceable unit-fit recommendation, not an unverified compliance badge. Measure expert agreement, unsupported recommendations, time saved and the review effort still required.
