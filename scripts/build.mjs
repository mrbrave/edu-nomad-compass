import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);

// Opt-in, preview-only release check. Never run paid checks on production builds.
if(process.env.COMPASS_VERIFY_PIPELINE==="1"&&process.env.VERCEL_ENV==="preview"){
  const check=spawnSync(process.execPath,["--experimental-strip-types","scripts/check-workflow-live.ts"],{stdio:"inherit",env:process.env,timeout:150000});
  if(check.error)console.log('COMPASS_LIVE_CHECK {"kind":"live","caseId":"LIVE-01","outcome":"BLOCKED","reason":"Check timed out or could not start."}');
}
const build=spawnSync(process.execPath,[require.resolve("next/dist/bin/next"),"build"],{stdio:"inherit",env:process.env});
process.exit(build.status??1);
