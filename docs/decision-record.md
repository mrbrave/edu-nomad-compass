# Decision record — 22 October 2026

| Decision | Reason |
| --- | --- |
| New EduNomad codebase and repository | Explicit user instruction: preserve 1906.au entirely |
| Name: EduNomad Course Compass | Describes a guided course-design research service |
| Read-only official API adapter | Structured product data is available without rendered-page scraping |
| Retrieve current releases on each review, with a short cache | Makes product currency and provenance inspectable |
| Separate register facts from JEV fit | Suitability cannot determine packaging eligibility |
| JEV before final Gemini response | Preserves the requested LLM + System One methodology |
| No invented fallback scores | Makes unavailable evaluation explicit |
| Small four-unit review scope | Keeps initial cost, context and evidence review bounded |
| Independent Gateway OIDC | Avoids copying or changing 1906.au credentials |
| Private pilot before commercial release | Hosting entitlement, integration support and expert agreement require validation |

## Evidence checked

Live official API calls retrieved BSB50420 release 3, six core units and 30 listed electives. BSBCMM412 release 2 returned Application, Elements and performance criteria, Foundation skills, Performance evidence, Knowledge evidence and Assessment conditions. Unit-only search returned 12 units. These are observations on the review date, not hardcoded course rules.

Primary technical references: training.gov.au Swagger; the register's API support guidance; TypeSafe's System One, Score, Choice and Noul documentation; Vercel Gateway's live model catalogue and TypeSafe compatibility documentation; installed AI SDK 7 documentation; Eve documentation.

## Outstanding external actions

The user supplied `https://github.com/mrbrave/edu-nomad-compass` as the new destination. Its metadata confirmed an empty public repository with push access. This resolves the earlier repository-creation blocker; the old `mrbrave/edu-nomad` remains out of scope.

The Vercel create-project API returned `403 forbidden: You don't have permission to create the project`. Its CLI fallback had no existing credentials and requested device authentication. This remains an account-access blocker, not a reason to change or reuse an existing application. No Vercel project was created by those failed calls.

## Verification scope

TypeScript checks, ten focused tests, live register retrieval and a production build passed. Live Gemini/JEV requests, remote deployment and a signed-in RTO browser flow are not verified without the new project's access. The supported preview supervisor briefly reported healthy, but the browser connection was refused and the supervisor then reported stopped. Visual browser QA is therefore unverified; no substitute browser or server infrastructure was introduced.
