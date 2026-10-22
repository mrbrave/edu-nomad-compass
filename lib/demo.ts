import type { ChatResult, CourseContext, Product } from "./contracts.ts";

export const DEMO_CONTEXT: CourseContext = {
  qualificationCode: "BSB50420",
  objectives: "Develop frontline managers who can lead difficult conversations, manage team performance and support the professional development of their teams.",
  cohort: "Experienced team leaders and new managers in Australian small and medium businesses, with access to workplace teams and realistic management responsibilities.",
};

const examples = [
  { code: "BSBCMM412", title: "Lead difficult conversations", fit: 88, cohortFit: 84, point: "Explore how learners prepare for, conduct and reflect on a difficult workplace conversation." },
  { code: "BSBLDR522", title: "Manage people performance", fit: 84, cohortFit: 82, point: "Discuss access to team responsibilities, performance expectations and opportunities to give feedback." },
  { code: "BSBPEF501", title: "Manage personal and professional development", fit: 79, cohortFit: 80, point: "Consider how learners identify development needs and plan opportunities to improve their practice." },
  { code: "BSBLDR411", title: "Demonstrate leadership in the workplace", fit: 72, cohortFit: 75, point: "Consider the level of leadership responsibility expected of the cohort; importing eligibility still needs a live check." },
];

// Curated illustrations only. These are not register extracts or model outputs.
export const DEMO_UNITS: Product[] = examples.map(({ code, title, point }) => ({
  code, title, type: "unit", status: "sample", release: "sample", grid: [], sources: [],
  prerequisites: [], prerequisiteStatus: "unavailable",
  sections: [{ id: `${code}-sample`, title: "Illustrative discussion points", type: "sample", text: `${point} This is authored demonstration content, not official unit text or assessment requirements.` }],
}));

export const DEMO_QUALIFICATION: Product = {
  code: "BSB50420", title: "Diploma of Leadership and Management", type: "qualification", status: "sample", release: "sample",
  sections: [], sources: [], prerequisites: [], prerequisiteStatus: "unavailable",
  grid: examples.slice(0, 3).map(({ code, title }) => ({ code, title, isEssential: false, usageRecommendation: "sample" })),
};

export function demoReview(message: string, selected: string[] = []): ChatResult {
  const codes = selected.length ? selected : examples.slice(0, 3).map(u => u.code);
  if (codes.some(code => !examples.some(u => u.code === code))) throw new Error("Choose one of the sample units, or switch to Studio for a live review.");
  const units = DEMO_UNITS.filter(u => codes.includes(u.code));
  const assessmentQuestion = /assessment|evidence|workplace/i.test(message);
  const details = units.map(u => {
    const item = examples.find(x => x.code === u.code)!;
    return `**${u.code} — ${u.title}**\n${item.point}`;
  }).join("\n\n");
  return {
    replyType: "demo",
    reply: `**Guided sample — no live AI or register request**\n\n${assessmentQuestion ? "This sample shows the questions a course designer might investigate before choosing units. It does not state official assessment requirements." : "This sample demonstrates how a course brief can lead to a shortlist discussion. The figures are fixed illustrations, not JEV results."}\n\n${details}\n\nSwitch to **Studio** to edit the brief, retrieve current official content and request a real assessment. Every sample response uses this prepared scenario; it is not an open-ended AI answer.`,
    assessment: {
      id: crypto.randomUUID(), createdAt: new Date().toISOString(), context: { ...DEMO_CONTEXT },
      qualification: DEMO_QUALIFICATION, units,
      assessments: units.map(u => {
        const item = examples.find(x => x.code === u.code)!;
        return { code: u.code, title: u.title, fit: item.fit, cohortFit: item.cohortFit, confidence: null,
          evidenceSufficiency: null, evidenceId: null, evidenceTitle: null, recommendation: "possible",
          rules: { code: u.code, status: "not_listed", label: "Sample · status unchecked", blockers: [], checksRequired: ["Check current register content, packaging rules and delivery context in Studio."] } };
      }),
      evaluator: { status: "sample", model: "Authored demonstration; no model called" },
      limitations: ["All figures are fixed illustrative values, not JEV assessments.", "Sample content is not a current register record, official evidence or a compliance decision.", "The demonstration uses one fixed brief and does not evaluate arbitrary user questions."], sources: [],
    },
    trace: ["Loaded the prepared sample brief from this application.", "Selected authored sample unit cards; no external service was contacted.", "Displayed fixed illustrative figures with no model confidence or official sources."],
  };
}
