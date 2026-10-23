export interface WorkspaceCredits {
  status: "available" | "pending" | "exhausted" | "review_required" | "not_configured" | "misconfigured" | "unavailable" | "sample";
  remainingPercent: number | null; updatedAt: string | null; label: string; belowOnePercent?: boolean; liveEnabled?: boolean;
}
