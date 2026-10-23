import { createGateway } from "ai";

export function gatewayAuthentication(env:Record<string,string|undefined>=process.env){
  const oidc=env.VERCEL_OIDC_TOKEN?.trim();
  const key=env.AI_GATEWAY_API_KEY?.trim();
  // Hosted requests belong to this project's identity, rather than an unrelated
  // or placeholder key. Local/external runtimes can use their own Gateway key.
  if(oidc&&(env.VERCEL_ENV==="preview"||env.VERCEL_ENV==="production"))return {token:oidc,method:"oidc" as const};
  if(key&&!/^(placeholder|replace[-_ ]?me|your[_-]?(api[_-]?)?key|changeme)$/i.test(key))return {token:key,method:"api-key" as const};
  if(oidc)return {token:oidc,method:"oidc" as const};
  throw new Error("AI access is not configured for this project.");
}

export function gatewayModel(id:string){
  const auth=gatewayAuthentication();
  return createGateway({apiKey:auth.token,headers:{"ai-gateway-auth-method":auth.method}})(id);
}
