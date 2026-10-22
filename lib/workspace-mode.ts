export type WorkspaceMode = "demo" | "studio";

export function defaultWorkspaceMode(value: string | undefined): WorkspaceMode {
  return value?.trim().toLowerCase() === "studio" ? "studio" : "demo";
}
