"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowUp, ArrowUpRight, BookOpen, Check, ChevronDown, Compass, Download, ExternalLink, FileCheck2, Globe2, LoaderCircle, Menu, Plus, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import type { Assessment, ChatResult, CourseContext, Product } from "@/lib/contracts";
import { DEMO_CONTEXT, DEMO_QUALIFICATION, demoReview } from "@/lib/demo";
import type { WorkspaceMode } from "@/lib/workspace-mode";
import type { WorkspaceCredits } from "@/lib/workspace";
import { WorkspaceAccess, CreditsCard } from "./workspace-access";

const initial:CourseContext=DEMO_CONTEXT;
const suggested=["BSBCMM412","BSBLDR522","BSBPEF501"];
const prompts=[{title:"Find the right electives",text:"Shortlist the strongest listed electives for this course and explain the evidence."},{title:"Check assessment demands",text:"Compare the assessment requirements of the selected units. What workplace evidence will learners need?"},{title:"Explore a different unit",text:"Would BSBLDR411 suit this cohort, and what needs checking before importing it?"}];
type Message={id:string;role:"user"|"assistant";content:string;mode?:string};

function Text({value}:{value:string}){
  function inline(s:string):ReactNode[]{return s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https:\/\/[^\s)]+\))/g).map((part,i)=>{
    const m=part.match(/^\[([^\]]+)\]\((https:\/\/[^\s)]+)\)$/);
    if(m){try{const u=new URL(m[2]);if(u.hostname==="training.gov.au")return <a key={i} href={u.href} target="_blank" rel="noreferrer">{m[1]} ↗</a>;}catch{}return m[1];}
    if(part.startsWith("**")&&part.endsWith("**"))return <strong key={i}>{part.slice(2,-2)}</strong>;return part;
  });}
  return <div className="reply-text">{value.split(/\n\n+/).map((p,i)=><p key={i}>{inline(p.replace(/^#{1,4} /gm,""))}</p>)}</div>;
}

export function CourseCompass({initialMode="demo"}:{initialMode?:WorkspaceMode}){
  const [mode,setMode]=useState<WorkspaceMode>(initialMode);
  if(mode==="studio")return <WorkspaceAccess key="studio" onDemo={()=>setMode("demo")}>{(key,credits,lock)=><CompassWorkspace mode={mode} onModeChange={setMode} accessKey={key} initialCredits={credits} onLock={lock}/>}</WorkspaceAccess>;
  return <CompassWorkspace key="demo" mode={mode} onModeChange={setMode} accessKey="" initialCredits={{status:"sample",remainingPercent:null,updatedAt:null,label:"Demo"}} onLock={()=>{}}/>;
}

function CompassWorkspace({mode,onModeChange,accessKey,initialCredits,onLock}:{mode:WorkspaceMode;onModeChange:(mode:WorkspaceMode)=>void;accessKey:string;initialCredits:WorkspaceCredits;onLock:()=>void}){
  const isDemo=mode==="demo";
  const [context,setContext]=useState<CourseContext>(initial);
  const [qualification,setQualification]=useState<Product|null>(isDemo?DEMO_QUALIFICATION:null);
  const [selected,setSelected]=useState<string[]>(suggested);
  const [messages,setMessages]=useState<Message[]>([]);
  const [result,setResult]=useState<ChatResult|null>(null);
  const [draft,setDraft]=useState("");
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [filter,setFilter]=useState("");
  const [tab,setTab]=useState<"units"|"evidence"|"workflow">("units");
  const [sidebar,setSidebar]=useState(false);
  const [credits,setCredits]=useState(initialCredits);
  const bottom=useRef<HTMLDivElement>(null);
  const navigation=useRef<HTMLElement>(null);
  const menuTrigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if(!sidebar)return;
    const pane=navigation.current;
    const controls=()=>Array.from(pane?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),textarea:not(:disabled)')??[]);
    controls()[0]?.focus();
    function keydown(event:KeyboardEvent){
      if(event.key==="Escape"){setSidebar(false);return;}
      if(event.key!=="Tab")return;
      const items=controls(),first=items[0],last=items.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
    document.addEventListener("keydown",keydown);
    return ()=>{document.removeEventListener("keydown",keydown);menuTrigger.current?.focus();};
  },[sidebar]);
  const headers=()=>({"Content-Type":"application/json",...(accessKey?{Authorization:`Bearer ${accessKey}`}:{})});

  async function refreshCredits(){
    try{const r=await fetch("/api/workspace",{headers:headers(),cache:"no-store"});if(r.status===401){onLock();return;}if(!r.ok)throw new Error();const data=await r.json();setCredits(data.credits);}catch{setCredits({status:"unavailable",remainingPercent:null,updatedAt:null,label:"Credits temporarily unavailable"});}
  }
  async function loadCourse(code:string){
    if(isDemo)return;
    setLoading(true);setError("");
    try{
      const r=await fetch(`/api/register?code=${encodeURIComponent(code.trim())}`,{headers:headers()});
      const data=await r.json();if(!r.ok){if(r.status===401)onLock();throw new Error(data.error);}
      if(!["qualification","skillSet"].includes(data.type))throw new Error("Enter a qualification or skill set code.");
      setQualification(data);setContext(c=>({...c,qualificationCode:data.code}));
      setSelected(data.code==="BSB50420"?suggested:[]);setMessages([]);setResult(null);
    }catch(e){setError(e instanceof Error?e.message:"Could not load the course.");setQualification(null);}
    finally{setLoading(false);}
  }
  useEffect(()=>{if(!isDemo)void loadCourse(initial.qualificationCode);},[]); // Demo makes no register or model requests; mode changes remount this workspace.
  useEffect(()=>{bottom.current?.scrollIntoView({behavior:"smooth"});},[messages,busy]);
  function updateContext(key:"objectives"|"cohort",value:string){setContext(c=>({...c,[key]:value}));setMessages([]);setResult(null);}
  function toggle(code:string){setSelected(c=>c.includes(code)?c.filter(x=>x!==code):c.length<4?[...c,code]:c);}
  async function send(text:string,auto=false,override?:string[]){
    if(!text.trim()||busy||!qualification)return;
    setError("");setBusy(true);setDraft("");
    const history=messages.slice(-10).map(({role,content})=>({role,content:content.slice(0,7000)}));
    const user:Message={id:crypto.randomUUID(),role:"user",content:text};
    setMessages(m=>[...m,user]);
    try{
      let response:ChatResult;
      if(isDemo){response=demoReview(text,override??(auto?[]:selected));}
      else{
        const r=await fetch("/api/chat",{method:"POST",headers:headers(),body:JSON.stringify({message:text,context,unitCodes:override??(auto?[]:selected),history})});
        const data=await r.json();if(!r.ok){if(r.status===401)onLock();throw new Error(data.error);}
        response=data as ChatResult;void refreshCredits();
      }setResult(response);setSelected(response.assessment.units.map(u=>u.code));
      setMessages(m=>[...m,{id:response.assessment.id,role:"assistant",content:response.reply,mode:response.replyType}]);
    }catch(e){setError(e instanceof Error?e.message:"The review failed. Please retry.");setDraft(text);setMessages(m=>m.filter(x=>x.id!==user.id));}
    finally{setBusy(false);}
  }
  function submit(e:FormEvent){e.preventDefault();void send(draft,!selected.length);}
  function download(assessment:Assessment){
    const md=`# EduNomad Course Compass — ${isDemo?"DEMO SAMPLE (illustrative only)":"Studio review"}\n\n${isDemo?"Prepared sample. No live register or model call. Figures are illustrations, not assessments.\n\n":""}Reviewed: ${assessment.createdAt}\n\nQualification: ${assessment.qualification.code} — ${assessment.qualification.title} (release ${assessment.qualification.release})\n\n## Course context\n\n${assessment.context.objectives}\n\nCohort: ${assessment.context.cohort}\n\n## Assessment\n\nEvaluator: ${assessment.evaluator.model} — ${assessment.evaluator.status}\n\n${assessment.assessments.map(a=>`### ${a.code} — ${a.title}\n\nRegister: ${a.rules.label}. Fit index: ${a.fit??"not assessed"}/100. Confidence: ${a.confidence===null?"unavailable":Math.round(a.confidence*100)+"%"}.\n\nEvidence section: ${a.evidenceTitle??"unavailable"}.\n\n${[...a.rules.blockers,...a.rules.checksRequired].map(x=>"- "+x).join("\n")}`).join("\n\n")}\n\n## Chat explanation\n\n${result?.reply}\n\n## Limitations\n\n${assessment.limitations.map(x=>"- "+x).join("\n")}\n\n## Workflow diagnostics\n\n${result?.stages?.map(s=>`- ${s.name}: ${s.status}, ${s.durationMs} ms${s.model?", "+s.model:""}`).join("\n")??"No live workflow in this sample."}\n\n## Sources\n\n${assessment.sources.map(s=>`- [${s.title}](${s.url}) — release ${s.release}, retrieved ${s.retrievedAt}`).join("\n")}\n\n## ${isDemo?"Authored sample content":"Retrieved unit evidence"}\n\n${assessment.units.map(u=>`### ${u.code}\n\n${u.sections.map(s=>`#### ${s.title}\n\n${s.text}`).join("\n\n")}`).join("\n\n")}\n`;
    const url=URL.createObjectURL(new Blob([md],{type:"text/markdown"}));const a=document.createElement("a");a.href=url;a.download=`EduNomad-${isDemo?"Demo-Sample":"Studio"}-${assessment.qualification.code}-Review.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  return <div className="app-shell">
    <aside ref={navigation} id="course-navigation" className={`sidebar ${sidebar?"open":""}`}>
      <a className="wordmark" href="/" aria-label="EduNomad Course Compass home"><span className="brand-symbol"><Compass size={26} strokeWidth={1.5}/></span><span>EDU-NOMAD<small>COURSE COMPASS</small></span></a>
      <button className="new-review" onClick={()=>{setMessages([]);setResult(null);setError("");setDraft("");setSidebar(false);}} disabled={busy}><Plus size={16}/> New review <span>⌘</span></button>
      <div className="sidebar-label">YOUR WORKSPACE</div>
      <div className="workspace-link"><Compass size={16}/> Course Compass <span className="small-tag">BETA</span></div>
      <div className="brief-heading"><span>COURSE BRIEF</span><span className="step-number">01</span></div>
      <form className="course-form" onSubmit={e=>{e.preventDefault();void loadCourse(context.qualificationCode);}}>
        <label htmlFor="qualification">Qualification or skill set</label>
        <div className="code-input"><input id="qualification" value={context.qualificationCode} onChange={e=>setContext(c=>({...c,qualificationCode:e.target.value.toUpperCase()}))} placeholder="e.g. BSB50420" maxLength={20} disabled={busy||isDemo}/><button title="Load qualification" aria-label="Load qualification" disabled={busy||loading||isDemo}>{loading?<LoaderCircle className="spin" size={15}/>:<ArrowUpRight size={17}/>}</button></div>
      </form>
      {qualification&&<div className="course-name">{qualification.title}<div><span className="status-dot"/>{isDemo?"Prepared scenario · status unchecked":`${qualification.status} · Release ${qualification.release}`}</div></div>}
      <label htmlFor="objectives">What should learners achieve?</label>
      <textarea id="objectives" value={context.objectives} onChange={e=>updateContext("objectives",e.target.value)} maxLength={2400} rows={5} disabled={busy||isDemo}/>
      <label htmlFor="cohort">Who are the learners?</label>
      <textarea id="cohort" value={context.cohort} onChange={e=>updateContext("cohort",e.target.value)} maxLength={1200} rows={4} disabled={busy||isDemo}/>
      <p className="brief-hint">{isDemo?"This guided sample uses a fixed brief. Switch to Studio to create your own.":"Your brief guides every assessment. Changing it starts a fresh conversation."}</p>
      <CreditsCard credits={credits} isDemo={isDemo} onRefresh={isDemo?undefined:()=>void refreshCredits()}/>
      <div className="sidebar-bottom"><div className="profile-avatar">EN</div><div>EduNomad {isDemo?"Demo":"Studio"}<small>{isDemo?"Guided sample workspace":"Live course research"}</small></div><ShieldCheck size={17}/></div>
    </aside>
    {sidebar&&<button className="overlay" onClick={()=>setSidebar(false)} aria-label="Close navigation"/>}
    <main className="main-shell">
      <header className="topbar"><div className="breadcrumbs"><button ref={menuTrigger} aria-expanded={sidebar} aria-controls="course-navigation" className="mobile-menu icon-button" onClick={()=>setSidebar(true)} aria-label="Open navigation"><Menu size={20}/></button><span>Workspace</span><span className="crumb-slash">/</span><strong>Course Compass</strong></div><div className="topbar-right"><div className="mode-switch" role="group" aria-label="Workspace mode">{(["demo","studio"] as const).map(value=><button key={value} type="button" aria-pressed={mode===value} disabled={busy||loading} onClick={()=>{if(value!==mode)onModeChange(value);}}>{value==="demo"?"Demo":"Studio"}</button>)}</div><span className="prototype-badge">RESEARCH PROTOTYPE</span><a href="https://training.gov.au/" target="_blank" rel="noreferrer"><Globe2 size={14}/> National register <ArrowUpRight size={13}/></a></div></header>
      <div className={`mode-notice ${mode}`} role="status"><span><strong>{isDemo?"Demo · guided sample":"Studio · live research"}</strong>{isDemo?"Prepared content and illustrative figures. No API keys or live requests.":"Current register evidence. AI assessment requires this project’s Gateway access."}</span><small>{isDemo?"Ready for your own brief? Choose Studio.":"Leaving Studio clears this review and locks access."}</small></div>
      <div className="workspace-header"><div><div className="eyebrow">COURSE DESIGN, WITH DIRECTION</div><h1>Course Compass<span>↗</span></h1><p>Let’s find the right units for your learners, one informed step at a time.</p></div><div className="evidence-badge"><span className="status-dot"/> {isDemo?"Illustrative sample content":"Official register evidence"}</div></div>
      <div className="workspace-grid">
        <section className="chat-panel" aria-label="Course research chat">
          <div className="panel-top"><div><span className="active-indicator"/> Research conversation</div><span>{messages.length?"Course brief applied":"Start with your course brief"}</span></div>
          <div className="chat-scroll" aria-live="polite">
            {!messages.length?<div className="welcome"><div className="compass-illustration"><Compass size={62} strokeWidth={1}/><span className="orbit-dot"/></div><div className="eyebrow">{isDemo?"EXPLORE A GUIDED SAMPLE":"A CLEARER PATH FORWARD"}</div><h2>A clearer path.<br/>A course that fits.</h2><p>{isDemo?"See how a shortlist review works using a prepared leadership scenario. Switch to Studio for your own course.":"Explore official units, compare their demands and see how well they fit your goals."}</p><div className="prompt-cards">{prompts.map((p,i)=><button key={p.title} disabled={busy||!qualification} onClick={()=>void send(p.text,i===0,i===2?["BSBLDR411"]:undefined)}><span className="prompt-icon">{i===0?<Sparkles size={17}/>:i===1?<FileCheck2 size={17}/>:<Search size={17}/>}</span><span>{isDemo?["Open sample shortlist","Explore sample discussion","Explore another sample unit"][i]:p.title}<small>{isDemo?"Prepared scenario · no live assessment":i===0?"Let the agent build a shortlist":i===1?"Understand the evidence needed":"Check fit and register status"}</small></span><ArrowUpRight size={17}/></button>)}</div></div>:<div className="messages">{messages.map(m=><article key={m.id} className={`message ${m.role}`}><div className="message-avatar">{m.role==="user"?"You":<Compass size={19}/>}</div><div className="message-body"><div className="message-label">{m.role==="user"?"You":"Course Compass"}{m.mode==="evidence_only"&&<span>Evidence summary · AI unavailable</span>}{m.mode==="demo"&&<span>Prepared sample · no live AI</span>}</div><Text value={m.content}/></div></article>)}</div>}
            {busy&&<div className="working"><LoaderCircle size={17} className="spin"/><div>Reviewing your course context<small>{isDemo?"Opening the prepared sample…":"Retrieving official evidence and assessing unit fit…"}</small></div></div>}
            <div ref={bottom}/>
          </div>
          {error&&<div className="error-message" role="alert"><span>{error}</span><button onClick={()=>setError("")} aria-label="Dismiss error"><X size={14}/></button></div>}

          <form className="composer" onSubmit={submit}><textarea aria-label="Ask about course units" placeholder={isDemo?"Try a question to explore the prepared sample…":"Ask about unit fit, electives or assessment requirements…"} value={draft} maxLength={3000} rows={2} disabled={busy} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send(draft,!selected.length);}}}/><div className="composer-bottom"><span><span className="tiny-dot"/>{selected.length?`${selected.length} units selected`:isDemo?"Sample shortlist will be shown":"Agent will find units"}</span><button aria-label="Send question" disabled={busy||!draft.trim()||!qualification}>{busy?<LoaderCircle size={17} className="spin"/>:<ArrowUp size={18}/>}</button></div></form>
          <div className="composer-note"><ShieldCheck size={12}/> Research support for RTO review. Final course decisions remain with your team.</div>
        </section>
        <aside className="evidence-panel" aria-label={isDemo?"Sample unit workspace":"Official unit evidence"}><div className="evidence-tabs"><button className={tab==="units"?"active":""} onClick={()=>setTab("units")}><BookOpen size={15}/> Unit workspace {result&&<span>{result.assessment.units.length}</span>}</button><button className={tab==="evidence"?"active":""} onClick={()=>setTab("evidence")}><FileCheck2 size={15}/> Evidence trail</button><button className={tab==="workflow"?"active":""} onClick={()=>setTab("workflow")}>Workflow</button></div>
          <div className="evidence-scroll">
            {tab==="units"?<>
              <div className="evidence-intro"><div className="eyebrow">{result?"YOUR LATEST ASSESSMENT":"YOUR STARTING POINT"}</div><h3>{isDemo?"A shortlist in action.":result?"Fit, backed by evidence.":"Explore the possibilities."}</h3><p>{isDemo?"Prepared unit cards show the review layout. Figures and content are illustrative; register status is unchecked.":result?"Objective fit and register status are shown separately.":"Select up to four units, or let the agent shortlist them from your brief."}</p></div>
              {result&&<><div className={`evaluation-status ${result.assessment.evaluator.status}`}><span className="status-dot"/>{isDemo?"Sample figures · not assessed by JEV":result.assessment.evaluator.status==="complete"?"JEV assessment complete":"Fit assessment unavailable"}</div><div className="unit-results">{result.assessment.assessments.map(a=>{const u=result.assessment.units.find(x=>x.code===a.code)!;return <div className="unit-card" key={a.code}><div className="unit-card-top"><span>{a.code}</span><span className={`register-label ${a.rules.status}`}>{a.rules.label}</span></div><h4>{a.title}</h4><div className="fit-row"><div><strong>{a.fit??"—"}</strong><span>/100<br/>{isDemo?"sample fit":"objective fit"}</span></div><div className={`fit-label ${a.recommendation}`}>{isDemo?"Illustrative figure":a.recommendation==="strong"?"Strong fit":a.recommendation==="possible"?"Possible fit":a.recommendation==="weak"?"Limited fit":"Needs more evidence"}</div></div>{a.fit!==null&&<div className="fit-bar"><span style={{width:`${a.fit}%`}}/></div>}<div className="unit-metrics"><span>{isDemo?"Sample cohort fit":"Cohort fit"} <b>{a.cohortFit??"—"}{a.cohortFit!==null&&"/100"}</b></span><span>Confidence <b>{a.confidence===null?"—":`${Math.round(a.confidence*100)}%`}</b></span></div>{a.evidenceTitle&&<p className="evidence-reference"><Check size={12}/> Supported by: {a.evidenceTitle}</p>}{a.rules.blockers.map(b=><p className="unit-warning" key={b}>{b}</p>)}{!isDemo&&a.rules.status==="not_listed"&&<p className="unit-warning">Not listed in this qualification. Importing eligibility needs review.</p>}<details className="unit-detail"><summary>{isDemo?"Inspect sample content":"Inspect official content"} <ChevronDown size={13}/></summary><div className="unit-detail-content">{!isDemo&&<a href={`https://training.gov.au/training/details/${a.code}`} target="_blank" rel="noreferrer">Release {u.release} · {u.status} <ExternalLink size={12}/></a>}{u.sections.map(s=><div key={s.id}><h5>{s.title}</h5><p>{s.text}</p></div>)}<h5>Checks still required</h5>{a.rules.checksRequired.map(c=><p key={c}>{c}</p>)}</div></details></div>;})}</div><p className="score-note">{isDemo?"Sample figures are authored illustrations. No JEV confidence or official status has been assigned.":"Fit is a rubric index. Confidence has not been calibrated for this use. Neither is a compliance probability."}</p></>}
              {qualification&&<div className="register-browser"><div className="register-browser-heading"><h4>{isDemo?"Sample units":result?"Review another selection":"Qualification units"}</h4><span>{qualification.grid.length} units</span></div><div className="unit-search"><Search size={14}/><input aria-label="Filter qualification units" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter by title or code"/></div><div className="grid-list">{qualification.grid.filter(u=>`${u.code} ${u.title}`.toLowerCase().includes(filter.toLowerCase())).map(u=><button className={`grid-unit ${selected.includes(u.code)?"selected":""}`} key={u.code} disabled={busy||(!selected.includes(u.code)&&selected.length>=4)} onClick={()=>toggle(u.code)}><span className="checkbox">{selected.includes(u.code)&&<Check size={11}/>}</span><span><b>{u.code}<em>{isDemo?"SAMPLE":u.isEssential?"CORE":"ELECTIVE"}</em></b><span>{u.title}</span></span></button>)}</div><button className="review-selection" onClick={()=>void send("Review these units against the course objectives and learner cohort. Explain their strengths, gaps and assessment demands.")} disabled={!selected.length||busy}>Review {selected.length||"selected"} units <ArrowUpRight size={15}/></button><button className="auto-select" onClick={()=>void send(prompts[0].text,true)} disabled={busy}><Sparkles size={13}/> {isDemo?"Open sample shortlist":"Let the agent choose"}</button></div>}
            </>:tab==="workflow"?<><div className="evidence-intro"><div className="eyebrow">REVIEW DIAGNOSTICS</div><h3>How this answer was built.</h3><p>{isDemo?"Demo uses prepared content and does not call a model.":"JEV assesses the evidence before Gemini explains it. These stages show the latest request, not a historical audit log."}</p></div><div className="workflow-stages">{result?.stages?.map((stage,i)=><div key={i} className={`workflow-stage ${stage.status}`}><div><strong>{stage.name==="jev"?"JEV assessment":stage.name==="explanation"?"Gemini explanation":stage.name==="planner"?"Gemini shortlist":stage.name==="register"?"Course retrieval":"Unit evidence"}</strong><span>{stage.status==="complete"?"Complete":"Unavailable"}</span></div><small>{stage.durationMs} ms{stage.model?` · ${stage.model}`:""}</small>{stage.inputTokens!==undefined&&<small>Input {stage.inputTokens} · Output {stage.outputTokens??"unavailable"} tokens</small>}</div>)??<p className="score-note">{isDemo?"No live workflow in Demo.":"Complete a review to inspect its workflow."}</p>}</div></>:<><div className="evidence-intro"><div className="eyebrow">TRACEABLE BY DESIGN</div><h3>{isDemo?"Follow the sample.":"Follow the evidence."}</h3><p>{isDemo?"This trail explains the prepared demonstration. No official records or model results were retrieved.":"See what was retrieved, checked and assessed for the latest answer."}</p></div>{result?<><ol className="trace-list">{result.trace.map((t,i)=><li key={i}><span>{i+1}</span>{t}</li>)}</ol><div className="source-heading">{isDemo?"NO LIVE SOURCES IN DEMO":"OFFICIAL SOURCES"}</div>{result.assessment.sources.map(s=><a className="source-link" key={s.id} href={s.url} target="_blank" rel="noreferrer"><FileCheck2 size={15}/><span>{s.title}<small>Release {s.release} · {new Date(s.retrievedAt).toLocaleDateString("en-AU")}</small></span><ExternalLink size={12}/></a>)}<details className="limitations"><summary>Review boundaries <ChevronDown size={13}/></summary>{result.assessment.limitations.map(l=><p key={l}>{l}</p>)}</details><button className="download-button" onClick={()=>download(result.assessment)}><Download size={15}/> {isDemo?"Export labelled demo sample":"Export review & evidence"}</button></>:<div className="empty-evidence"><FileCheck2 size={35} strokeWidth={1}/><h4>Your review trail will appear here.</h4><p>{isDemo?"Open a sample review to see its demonstration trail.":"Every completed review includes register releases, source links and the assessment steps."}</p></div>}</>}
          </div><div className="evidence-footer"><span className="status-dot"/> {isDemo?"Prepared demonstration":"training.gov.au"} <span>{isDemo?"No live sources":"Official source"}</span></div>
        </aside>
      </div>
    </main>
  </div>;
}
