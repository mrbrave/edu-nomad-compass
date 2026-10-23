"use client";
export function StudioModeSwitch({mode,disabled,onChange}:{mode:"demo"|"studio";disabled?:boolean;onChange:(mode:"demo"|"studio")=>void}){
  return <div className="mode-switch" role="group" aria-label="Workspace mode">{(["demo","studio"] as const).map(value=><button key={value} type="button" aria-pressed={mode===value} disabled={disabled} onClick={()=>{if(value!==mode)onChange(value);}}>{value==="demo"?"Demo":"Studio"}</button>)}</div>;
}
