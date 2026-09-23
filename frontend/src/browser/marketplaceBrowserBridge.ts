import type { BridgeMarketplace, BridgeField, BridgeCommand } from "./types";

const ALLOWED_HOSTS: Record<BridgeMarketplace, string[]> = {
  amazon: ["sellercentral.amazon.in", "sellercentral.amazon.com"],
  flipkart: ["seller.flipkart.com"],
};

export function allowedMarketplaceHost(marketplace: BridgeMarketplace, hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^www\./, "");
  return ALLOWED_HOSTS[marketplace].some(x => h === x || h.endsWith("." + x));
}
export function selectorIsSafe(selector: string): boolean {
  if (!selector || selector.length > 500) return false;
  if (/[;{}<>]/.test(selector)) return false;
  return /^(\[(name|id|autocomplete)="[^"]+"\]|label="[^"]+"|[A-Za-z0-9_.:-]+)$/.test(selector);
}
export async function pageFingerprint(fields: BridgeField[]): Promise<string> {
  const normalized = fields.map(f => ({name:String(f.name||""),id:String(f.id||""),autocomplete:String(f.autocomplete||""),label:String(f.label||""),canonical:String(f.canonical||""),field:String(f.field||"")})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const bytes = new TextEncoder().encode(JSON.stringify(normalized));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
function locate(root: Document, command: BridgeCommand): HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement|null {
  if (!selectorIsSafe(command.selector)) return null;
  const s=command.selector; let el: Element|null=null;
  if (s.startsWith("[name=")||s.startsWith("[id=")||s.startsWith("[autocomplete=")) el=root.querySelector(s);
  else if (s.startsWith("label=")) { const label=s.slice(7,-1); const l=Array.from(root.querySelectorAll("label")).find(x=>x.textContent?.trim()===label); if(l){ const id=l.htmlFor; el=id?root.getElementById(id):l.querySelector("input,textarea,select"); } }
  else el=root.querySelector(s);
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement ? el : null;
}
export async function executeFillCommands(commands: BridgeCommand[], expectedFingerprint: string, marketplace: BridgeMarketplace, pageFields: BridgeField[], root: Document=document): Promise<Array<{sequence:number,state:"filled"|"failed"|"skipped",error?:string}>> {
  if(!allowedMarketplaceHost(marketplace,root.location.hostname)) throw new Error("Marketplace domain is not allowlisted");
  if(await pageFingerprint(pageFields)!==expectedFingerprint) throw new Error("Page fingerprint mismatch; refresh/re-plan before execution");
  const results=[] as Array<{sequence:number,state:"filled"|"failed"|"skipped",error?:string}>;
  for(const command of [...commands].sort((a,b)=>a.sequence-b.sequence)){
    if(!selectorIsSafe(command.selector)){results.push({sequence:command.sequence,state:"skipped",error:"Unsafe selector"});continue;}
    const el=locate(root,command);
    if(!el||el.disabled){results.push({sequence:command.sequence,state:"failed",error:"Safe target field not found or disabled"});continue;}
    try { if(el instanceof HTMLSelectElement) el.value=String(command.value??""); else { const proto=el instanceof HTMLInputElement?HTMLInputElement.prototype:HTMLTextAreaElement.prototype; const setter=Object.getOwnPropertyDescriptor(proto,"value")?.set; setter?.call(el,command.value==null?"":String(command.value)); } el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true})); results.push({sequence:command.sequence,state:"filled"}); }
    catch(e){results.push({sequence:command.sequence,state:"failed",error:String(e)});}
  } return results;
}
export async function postResults(apiBase:string,executionId:number,results:Array<{sequence:number,state:"filled"|"failed"|"skipped",error?:string}>):Promise<void>{ for(const result of results){ await fetch(apiBase.replace(/\/$/,"")+"/api/v1/browser-execution/"+executionId+"/result",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(result)}); } }
export async function validatePage(apiBase:string,executionId:number,pageUrl:string,pageFields:BridgeField[]):Promise<{valid:boolean;page_fingerprint:string}>{ const res=await fetch(apiBase.replace(/\/$/,"")+"/api/v1/browser-execution/"+executionId+"/validate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({page_url:pageUrl,page_fields:pageFields})}); const body=await res.json(); if(!res.ok) throw new Error(body.detail||"Browser page validation failed"); return body; }
