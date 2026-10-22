import { CourseCompass } from "./_components/course-compass";
import { defaultWorkspaceMode } from "@/lib/workspace-mode";

// Read the server-only default at request time; never send credentials to the UI.
export const dynamic = "force-dynamic";
export default function Page(){return <CourseCompass initialMode={defaultWorkspaceMode(process.env.COMPASS_DEFAULT_MODE)}/>;}
