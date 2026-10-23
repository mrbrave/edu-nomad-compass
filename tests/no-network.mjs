// Every deterministic test starts with networking disabled. Provider tests inject synthetic transports.
globalThis.fetch=async()=>{throw new Error('Network requests are disabled in the automated test suite.');};
