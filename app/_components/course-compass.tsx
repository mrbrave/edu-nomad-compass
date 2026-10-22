"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowUp, ArrowUpRight, BookOpen, Check, ChevronDown, Compass, Download, ExternalLink, FileCheck2, Globe2, LoaderCircle, Menu, Plus, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import type { Assessment, ChatResult, CourseContext, Product } from "@/lib/contracts";

const initial:CourseContext={qualificationCode:"BSB50420",objectives:"Develop frontline managers who can lead difficult conversations, manage team performance and support the professional development of their teams.",cohort:"Experienced team leaders and new managers in Australian small and medium businesses, with access to workplace teams and realistic management responsibilities."};
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

export function CourseCompass(){
  const [context,setContext]=useState<CourseContext>(initial);
  const [qualification,setQualification]=useState<Product|null>(null);
  const [selected,setSelected]=useState<string[]>(suggested);
  const [messages,setMessages]=useState<Message[]>([]);
  const [result,setResult]=useState<ChatResult|null>(null);
  const [draft,setDraft]=useState("");
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [filter,setFilter]=useState("");
  const [tab,setTab]=useState<"units"|"evidence">("units");
  const [sidebar,setSidebar]=useState(false);
  const [accessKey,setAccessKey]=useState("");
  const [needsKey,setNeedsKey]=useState(false);
  const bottom=useRef<HTMLDivElement>(null);
  const headers=()=>({"Content-Type":"application/json",...(accessKey?{Authorization:`Bearer ${accessKey}`}:{})});

  async function loadCourse(code:string){
    setLoading(true);setError("");
    try{
      const r=await fetch(`/api/register?code=${encodeURIComponent(code.trim())}`,{headers:headers()});
      const data=await r.json();if(!r.ok){if(r.status===401)setNeedsKey(true);throw new Error(data.error);}
      if(!["qualification","skillSet"].includes(data.type))throw new Error("Enter a qualification or skill set code.");
      setQualification(data);setContext(c=>({...c,qualificationCode:data.code}));
      setSelected(data.code==="BSB50420"?suggested:[]);setMessages([]);setResult(null);
    }catch(e){setError(e instanceof Error?e.message:"Could not load the course.");setQualification(null);}
    finally{setLoading(false);}
  }
  useEffect(()=>{void loadCourse(initial.qualificationCode);},[]); // One explicit initial register read.
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
      const r=await fetch("/api/chat",{method:"POST",headers:headers(),body:JSON.stringify({message:text,context,unitCodes:override??(auto?[]:selected),history})});
      const data=await r.json();if(!r.ok){if(r.status===401)setNeedsKey(true);throw new Error(data.error);}
      const response=data as ChatResult;setResult(response);setSelected(response.assessment.units.map(u=>u.code));
      setMessages(m=>[...m,{id:response.assessment.id,role:"assistant",content:response.reply,mode:response.replyType}]);
    }catch(e){setError(e instanceof Error?e.message:"The review failed. Please retry.");setDraft(text);setMessages(m=>m.filter(x=>x.id!==user.id));}
    finally{setBusy(false);}
  }
  function submit(e:FormEvent){e.preventDefault();void send(draft,!selected.length);}
  function download(assessment:Assessment){
    const md=`# EduNomad Course Compass — review\n\nReviewed: ${assessment.createdAt}\n\nQualification: ${assessment.qualification.code} — ${assessment.qualification.title} (release ${assessment.qualification.release})\n\n## Course context\n\n${assessment.context.objectives}\n\nCohort: ${assessment.context.cohort}\n\n## Assessment\n\nEvaluator: ${assessment.evaluator.model} — ${assessment.evaluator.status}\n\n${assessment.assessments.map(a=>`### ${a.code} — ${a.title}\n\nRegister: ${a.rules.label}. Fit index: ${a.fit??"not assessed"}/100. Confidence: ${a.confidence===null?"unavailable":Math.round(a.confidence*100)+"%"}.\n\nEvidence section: ${a.evidenceTitle??"unavailable"}.\n\n${[...a.rules.blockers,...a.rules.checksRequired].map(x=>"- "+x).join("\n")}`).join("\n\n")}\n\n## Chat explanation\n\n${result?.reply}\n\n## Limitations\n\n${assessment.limitations.map(x=>"- "+x).join("\n")}\n\n## Sources\n\n${assessment.sources.map(s=>`- [${s.title}](${s.url}) — release ${s.release}, retrieved ${s.retrievedAt}`).join("\n")}\n\n## Retrieved unit evidence\n\n${assessment.units.map(u=>`### ${u.code}\n\n${u.sections.map(s=>`#### ${s.title}\n\n${s.text}`).join("\n\n")}`).join("\n\n")}\n`;
    const url=URL.createObjectURL(new Blob([md],{type:"text/markdown"}));const a=document.createElement("a");a.href=url;a.download=`EduNomad-${assessment.qualification.code}-Review.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  return <div className="app-shell">
    <aside className={`sidebar ${sidebar?"open":""}`}>
      <a className="wordmark" href="/" aria-label="EduNomad Course Compass home"><span className="brand-symbol"><Compass size={26} strokeWidth={1.5}/></span><span>edu<span className="brand-light">nomad</span><small>LEARNING, WITHOUT LIMITS.</small></span></a>
      <button className="new-review" onClick={()=>{setMessages([]);setResult(null);setError("");setDraft("");setSidebar(false);}} disabled={busy}><Plus size={16}/> New review <span>⌘</span></button>
      <div className="sidebar-label">YOUR WORKSPACE</div>
      <div className="workspace-link"><Compass size={16}/> Course Compass <span className="small-tag">BETA</span></div>
      <div className="brief-heading"><span>COURSE BRIEF</span><span className="step-number">01</span></div>
      <form className="course-form" onSubmit={e=>{e.preventDefault();void loadCourse(context.qualificationCode);}}>
        <label htmlFor="qualification">Qualification or skill set</label>
        <div className="code-input"><input id="qualification" value={context.qualificationCode} onChange={e=>setContext(c=>({...c,qualificationCode:e.target.value.toUpperCase()}))} placeholder="e.g. BSB50420" maxLength={20} disabled={busy}/><button title="Load qualification" aria-label="Load qualification" disabled={busy||loading}>{loading?<LoaderCircle className="spin" size={15}/>:<ArrowUpRight size={17}/>}</button></div>
      </form>
      {qualification&&<div className="course-name">{qualification.title}<div><span className="status-dot"/>{qualification.status} · Release {qualification.release}</div></div>}
      <label htmlFor="objectives">What should learners achieve?</label>
      <textarea id="objectives" value={context.objectives} onChange={e=>updateContext("objectives",e.target.value)} maxLength={2400} rows={5} disabled={busy}/>
      <label htmlFor="cohort">Who are the learners?</label>
      <textarea id="cohort" value={context.cohort} onChange={e=>updateContext("cohort",e.target.value)} maxLength={1200} rows={4} disabled={busy}/>
      <p className="brief-hint">Your brief guides every assessment. Changing it starts a fresh conversation.</p>
      <div className="sidebar-bottom"><div className="profile-avatar">EN</div><div>EduNomad Studio<small>Course design workspace</small></div><ShieldCheck size={17}/></div>
    </aside>
    {sidebar&&<button className="overlay" onClick={()=>setSidebar(false)} aria-label="Close navigation"/>}
    <main className="main-shell">
      <header className="topbar"><div className="breadcrumbs"><button className="mobile-menu icon-button" onClick={()=>setSidebar(true)} aria-label="Open navigation"><Menu size={20}/></button><span>Workspace</span><span className="crumb-slash">/</span><strong>Course Compass</strong></div><div className="topbar-right"><span className="prototype-badge">RESEARCH PROTOTYPE</span><a href="https://training.gov.au/" target="_blank" rel="noreferrer"><Globe2 size={14}/> National register <ArrowUpRight size={13}/></a></div></header>
      <div className="workspace-header"><div><div className="eyebrow">COURSE DESIGN, WITH DIRECTION</div><h1>Course Compass<span>↗</span></h1><p>Turn your course goals into an evidence-led unit shortlist.</p></div><div className="evidence-badge"><span className="status-dot"/> Official register evidence</div></div>
      <div className="workspace-grid">
        <section className="chat-panel" aria-label="Course research chat">
          <div className="panel-top"><div><span className="active-indicator"/> Research conversation</div><span>{messages.length?"Course brief applied":"Start with your course brief"}</span></div>
          <div className="chat-scroll" aria-live="polite">
            {!messages.length?<div className="welcome"><div className="compass-illustration"><Compass size={62} strokeWidth={1}/><span className="orbit-dot"/></div><div className="eyebrow">A CLEARER PATH FORWARD</div><h2>Build the course<br/>your learners need.</h2><p>Explore official units, compare their demands and see how well they fit your goals.</p><div className="prompt-cards">{prompts.map((p,i)=><button key={p.title} disabled={busy||!qualification} onClick={()=>void send(p.text,i===0,i===2?["BSBLDR411"]:undefined)}><span className="prompt-icon">{i===0?<Sparkles size={17}/>:i===1?<FileCheck2 size={17}/>:<Search size={17}/>}</span><span>{p.title}<small>{i===0?"Let the agent build a shortlist":i===1?"Understand the evidence needed":"Check fit and register status"}</small></span><ArrowUpRight size={17}/></button>)}</div></div>:<div className="messages">{messages.map(m=><article key={m.id} className={`message ${m.role}`}><div className="message-avatar">{m.role==="user"?"You":<Compass size={19}/>}</div><div className="message-body"><div className="message-label">{m.role==="user"?"You":"Course Compass"}{m.mode==="evidence_only"&&<span>Evidence summary · AI unavailable</span>}</div><Text value={m.content}/></div></article>)}</div>}
            {busy&&<div className="working"><LoaderCircle size={17} className="spin"/><div>Reviewing your course context<small>Retrieving official evidence and assessing unit fit…</small></div></div>}
            <div ref={bottom}/>
          </div>
          {error&&<div className="error-message" role="alert"><span>{error}</span><button onClick={()=>setError("")} aria-label="Dismiss error"><X size={14}/></button></div>}
          {needsKey&&<form className="access-form" onSubmit={e=>{e.preventDefault();setNeedsKey(false);void loadCourse(context.qualificationCode);}}><label htmlFor="access">Prototype access key</label><input id="access" type="password" value={accessKey} onChange={e=>setAccessKey(e.target.value)} autoComplete="off"/><button>Unlock</button></form>}
          <form className="composer" onSubmit={submit}><textarea aria-label="Ask about course units" placeholder="Ask about unit fit, electives or assessment requirements…" value={draft} maxLength={3000} rows={2} disabled={busy} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send(draft,!selected.length);}}}/><div className="composer-bottom"><span><span className="tiny-dot"/>{selected.length?`${selected.length} units selected`:"Agent will find units"}</span><button aria-label="Send question" disabled={busy||!draft.trim()||!qualification}>{busy?<LoaderCircle size={17} className="spin"/>:<ArrowUp size={18}/>}</button></div></form>
          <div className="composer-note"><ShieldCheck size={12}/> Research support for RTO review. Final course decisions remain with your team.</div>
        </section>
        <aside className="evidence-panel" aria-label="Official unit evidence"><div className="evidence-tabs"><button className={tab==="units"?"active":""} onClick={()=>setTab("units")}><BookOpen size={15}/> Unit workspace {result&&<span>{result.assessment.units.length}</span>}</button><button className={tab==="evidence"?"active":""} onClick={()=>setTab("evidence")}><FileCheck2 size={15}/> Evidence trail</button></div>
          <div className="evidence-scroll">
            {tab==="units"?<>
              <div className="evidence-intro"><div className="eyebrow">{result?"YOUR LATEST ASSESSMENT":"YOUR STARTING POINT"}</div><h3>{result?"Fit, backed by evidence.":"Explore the possibilities."}</h3><p>{result?"Objective fit and register status are shown separately.":"Select up to four units, or let the agent shortlist them from your brief."}</p></div>
              {result&&<><div className={`evaluation-status ${result.assessment.evaluator.status}`}><span className="status-dot"/>{result.assessment.evaluator.status==="complete"?"JEV assessment complete":"Fit assessment unavailable"}</div><div className="unit-results">{result.assessment.assessments.map(a=>{const u=result.assessment.units.find(x=>x.code===a.code)!;return <div className="unit-card" key={a.code}><div className="unit-card-top"><span>{a.code}</span><span className={`register-label ${a.rules.status}`}>{a.rules.label}</span></div><h4>{a.title}</h4><div className="fit-row"><div><strong>{a.fit??"—"}</strong><span>/100<br/>objective fit</span></div><div className={`fit-label ${a.recommendation}`}>{a.recommendation==="strong"?"Strong fit":a.recommendation==="possible"?"Possible fit":a.recommendation==="weak"?"Limited fit":"Needs more evidence"}</div></div>{a.fit!==null&&<div className="fit-bar"><span style={{width:`${a.fit}%`}}/></div>}<div className="unit-metrics"><span>Cohort fit <b>{a.cohortFit??"—"}{a.cohortFit!==null&&"/100"}</b></span><span>Confidence <b>{a.confidence===null?"—":`${Math.round(a.confidence*100)}%`}</b></span></div>{a.evidenceTitle&&<p className="evidence-reference"><Check size={12}/> Supported by: {a.evidenceTitle}</p>}{a.rules.blockers.map(b=><p className="unit-warning" key={b}>{b}</p>)}{a.rules.status==="not_listed"&&<p className="unit-warning">Not listed in this qualification. Importing eligibility needs review.</p>}<details className="unit-detail"><summary>Inspect official content <ChevronDown size={13}/></summary><div className="unit-detail-content"><a href={`https://training.gov.au/training/details/${a.code}`} target="_blank" rel="noreferrer">Release {u.release} · {u.status} <ExternalLink size={12}/></a>{u.sections.map(s=><div key={s.id}><h5>{s.title}</h5><p>{s.text}</p></div>)}<h5>Checks still required</h5>{a.rules.checksRequired.map(c=><p key={c}>{c}</p>)}</div></details></div>;})}</div><p className="score-note">Fit is a rubric index. Confidence has not been calibrated for this use. Neither is a compliance probability.</p></>}
              {qualification&&<div className="register-browser"><div className="register-browser-heading"><h4>{result?"Review another selection":"Qualification units"}</h4><span>{qualification.grid.length} units</span></div><div className="unit-search"><Search size={14}/><input aria-label="Filter qualification units" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter by title or code"/></div><div className="grid-list">{qualification.grid.filter(u=>`${u.code} ${u.title}`.toLowerCase().includes(filter.toLowerCase())).map(u=><button className={`grid-unit ${selected.includes(u.code)?"selected":""}`} key={u.code} disabled={busy||(!selected.includes(u.code)&&selected.length>=4)} onClick={()=>toggle(u.code)}><span className="checkbox">{selected.includes(u.code)&&<Check size={11}/>}</span><span><b>{u.code}<em>{u.isEssential?"CORE":"ELECTIVE"}</em></b><span>{u.title}</span></span></button>)}</div><button className="review-selection" onClick={()=>void send("Review these units against the course objectives and learner cohort. Explain their strengths, gaps and assessment demands.")} disabled={!selected.length||busy}>Review {selected.length||"selected"} units <ArrowUpRight size={15}/></button><button className="auto-select" onClick={()=>void send(prompts[0].text,true)} disabled={busy}><Sparkles size={13}/> Let the agent choose</button></div>}
            </>:<><div className="evidence-intro"><div className="eyebrow">TRACEABLE BY DESIGN</div><h3>Follow the evidence.</h3><p>See what was retrieved, checked and assessed for the latest answer.</p></div>{result?<><ol className="trace-list">{result.trace.map((t,i)=><li key={i}><span>{i+1}</span>{t}</li>)}</ol><div className="source-heading">OFFICIAL SOURCES</div>{result.assessment.sources.map(s=><a className="source-link" key={s.id} href={s.url} target="_blank" rel="noreferrer"><FileCheck2 size={15}/><span>{s.title}<small>Release {s.release} · {new Date(s.retrievedAt).toLocaleDateString("en-AU")}</small></span><ExternalLink size={12}/></a>)}<details className="limitations"><summary>Review boundaries <ChevronDown size={13}/></summary>{result.assessment.limitations.map(l=><p key={l}>{l}</p>)}</details><button className="download-button" onClick={()=>download(result.assessment)}><Download size={15}/> Export review & evidence</button></>:<div className="empty-evidence"><FileCheck2 size={35} strokeWidth={1}/><h4>Your review trail will appear here.</h4><p>Every completed review includes register releases, source links and the assessment steps.</p></div>}</>}
          </div><div className="evidence-footer"><span className="status-dot"/> training.gov.au <span>Official source</span></div>
        </aside>
      </div>
    </main>
  </div>;
}
