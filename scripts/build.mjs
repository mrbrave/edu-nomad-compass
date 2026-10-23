import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
// Builds are deterministic and never contact paid model providers.
const build=spawnSync(process.execPath,[require.resolve("next/dist/bin/next"),"build"],{stdio:"inherit",env:process.env});
process.exit(build.status??1);
