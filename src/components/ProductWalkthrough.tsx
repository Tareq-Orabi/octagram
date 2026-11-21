"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type Kind = "care" | "fitness";
const actions = {
  care: [
    { label:"Open a new appointment", hint:"New appointment", x:246, y:57 },
    { label:"Confirm the appointment", hint:"Confirm", x:515, y:341 },
    { label:"Appointment saved", hint:"Saved ✓", x:380, y:260 },
    { label:"Review the overview", hint:"Overview", x:340, y:236 },
  ],
  fitness: [
    { label:"Explore the system", hint:"The system", x:404, y:47 },
    { label:"Meet the blueprint", hint:"Blueprint", x:404, y:193 },
    { label:"See the plan take shape", hint:"Your direction", x:335, y:282 },
    { label:"Preview a training week", hint:"Your week", x:274, y:304 },
  ],
} as const;

function CareScreen() {
  return <div className="care-app">
    <aside className="care-sidebar"><span className="care-mark">♡</span>{["▣","▤","▥","♧","♙","▧"].map((icon,n)=><i className={n===2?"care-nav-selected":""} key={n}>{icon}</i>)}<b>↪</b></aside>
    <div className="care-dashboard"><header className="care-topbar"><span>MANAGEMENT HUB</span><b className="care-new-button">＋ NEW APPOINTMENT</b><i>FINANCIAL REPORT</i><i>SPLIT VIEW</i></header>
      <div className="care-welcome"><div><h4>Welcome, team</h4><span>YOUR DAY, IN VIEW</span><p><i/> A clear picture of today’s appointments.</p></div><aside><span>ACTIVE SCHEDULE</span><b>14 November</b><i/></aside></div>
      <div className="care-schedule"><header><span className="care-date"><small>SAT</small>14</span><div><small>LIVE PULSE</small><strong>Today’s schedule</strong><span>CARE, WELL ORGANIZED</span></div><i>14 NOV ⌄</i></header>
        <div className="care-timeline"><div className="care-timeline-heading"><em>Timeline flow</em><span>← &nbsp; Nov 14 &nbsp; →</span><b>DAY <i>WEEK</i></b></div><div className="care-tree"><i className="care-tree-line"/>{["Consultation","Follow-up","Treatment session"].map((title,n)=><div className={`care-appointment care-appointment--${n}`} key={title}><small>{n===2?"BOOKED":"CONFIRMED"}<i>{10+n}:00 AM</i></small><strong>Sample patient</strong><span>{title}</span><b>{n===2?"New appointment":"View session"}</b></div>)}</div>
          <footer><span><i/> 2 confirmed</span><span><i/> 1 booked</span><b>NEXT FREE →</b></footer></div>
      </div>
      <div className="care-report"><header><span>FINANCIAL OVERVIEW</span><h4>A clearer view.</h4><p>Services, payments, and the bigger picture.</p></header><div className="care-report-columns"><div><em>Service overview</em><div className="care-chart">{[44,68,50,88,62,97,77].map((h,n)=><span key={n}><i style={{height:`${h}%`}}/><b style={{height:`${h*.7}%`}}/></span>)}</div><span className="care-chart-label">A sample week</span></div><div><em>Payment methods</em><div className="care-donut"/><p><i/> Cash <i/> Card <i/> Other</p></div></div><footer>Illustrative figures · sample data</footer></div>
      <div className="care-drawer"><span>NEW APPOINTMENT</span><h4>A moment for care.</h4><label>Patient<b>Sample patient <i>✓</i></b></label><label>Service<b>Consultation</b></label><label>Date & time<b>14 Nov · 12:00 PM</b></label><strong className="care-confirm">Confirm appointment ↗</strong></div>
      <div className="care-saved"><span>✓</span><div>Appointment saved<small>Everything, in the right place.</small></div></div>
    </div>
  </div>;
}

function FitnessScreen() {
  return <div className="fitness-app"><header className="fitness-nav"><b><i/> THAER<span>.</span></b><small>THE COACH</small><small className="fitness-system-link">THE SYSTEM</small><small>PROOF</small><strong>START NOW</strong></header>
    <div className="fitness-home"><span className="fitness-eyebrow">01 / 04 · THE THRESHOLD</span><h4>YOU DIDN’T COME<br/>HERE TO BROWSE.</h4><p lang="ar" dir="rtl">أنت هنا لتتغيّر</p><div className="fitness-home-actions"><b>START THE WORK ↗</b><span>DISCOVER THE SYSTEM ↓</span></div><div className="fitness-ribbon"><span>BUILT NOT BORN &nbsp; ✦ &nbsp; NO SHORTCUTS &nbsp; ✦ &nbsp; EARN EVERY REP &nbsp; ✦ &nbsp; BUILT NOT BORN &nbsp; ✦ &nbsp; NO SHORTCUTS &nbsp; ✦ &nbsp; EARN EVERY REP &nbsp; ✦ &nbsp;</span></div></div>
    <div className="fitness-system"><div className="fitness-tunnel-lines"/><header>THE SYSTEM TUNNEL.</header><div className="fitness-behind-step"><b>INTAKE</b><span>01</span></div><div className="fitness-blueprint"><span>BUILD THE ROUTE</span><strong>BLUEPRINT.</strong><b>02</b><em lang="ar" dir="rtl">الخطة</em><p>Training and nutrition, shaped around your body, your schedule, and your goal.</p><i><span/></i></div><div className="fitness-feedback"><strong>FEEDBACK LOOP.</strong><span>03</span></div><footer><span>◇ INTAKE &nbsp; <b>◆ BLUEPRINT</b> &nbsp; ◇ FEEDBACK</span><strong>36<small>%</small></strong></footer></div>
    <div className="fitness-plan"><span>THE WORK / YOUR DIRECTION</span><h4>EVERY REP.<br/><em>WITH PURPOSE.</em></h4><div className="fitness-training-days">{["MON","TUE","WED","THU","FRI"].map((day,n)=><div key={day}><span>{day}</span><strong>{n%2===0?"STRENGTH":"RECOVERY"}</strong><i/></div>)}</div><p>A sample training week · built around a clear goal.</p></div>
  </div>;
}

/** A small local product walkthrough. No account, live patient data, or network calls. */
export default function ProductWalkthrough({ kind }: { kind:Kind }) {
  const root = useRef<HTMLDivElement>(null);
  const [step,setStep] = useState(0);
  const action = actions[kind][step];
  useEffect(() => {
    const element=root.current!, slide=element.closest<HTMLElement>(".deck-slide");
    const abort=new AbortController(), {signal}=abort;
    const media=matchMedia("(prefers-reduced-motion: reduce)");
    let visible=false, menu=false, timer=0;
    const advance=()=>{setStep(value=>(value+1)%4);timer=window.setTimeout(advance,3800);};
    const sync=()=>{
      clearTimeout(timer);
      const running=visible&&!document.hidden&&!menu&&!media.matches&&slide?.dataset.current==="true";
      element.dataset.walkthroughRunning=String(running);
      if(running)timer=window.setTimeout(advance,3800);
    };
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.1});observer.observe(element);
    const slides=new MutationObserver(sync);if(slide)slides.observe(slide,{attributes:true,attributeFilter:["data-current"]});
    document.addEventListener("visibilitychange",sync,{signal});media.addEventListener("change",sync,{signal});
    window.addEventListener("octagram:menu",event=>{menu=Boolean((event as CustomEvent<boolean>).detail);sync();},{signal});
    sync();
    return()=>{clearTimeout(timer);observer.disconnect();slides.disconnect();abort.abort();};
  },[]);
  return <div ref={root} className={`product-walkthrough product-walkthrough--${kind}`} data-demo-step={step} data-walkthrough-running="false" style={{"--cursor-x":`${action.x}px`,"--cursor-y":`${action.y}px`} as CSSProperties}>
    <div className="fit-demo" data-fit-demo aria-hidden="true"><div className="scaled-demo-frame"><div className="demo-perspective" data-tilt><div className="product-demo real-product-demo">
      <header className="real-demo-chrome"><span><i/><i/><i/></span><small>{kind==="care"?"octacare / clinic workspace":"octafitness / thaaerfit"}</small><b>↗</b></header>
      <div className="real-demo-viewport">{kind==="care"?<CareScreen/>:<FitnessScreen/>}</div>
      <svg className="walkthrough-cursor" viewBox="0 0 640 410"><g><circle key={step} className="walkthrough-tap" r="4"/><path className="walkthrough-pointer-body" transform="scale(.58)" d="M1.5 1.5 7 29l6-8 7.5 13 6-3.5-8-13 10-1.5Z" fill="#fffdf7" stroke="#342b2b" strokeWidth="1.6" strokeLinejoin="round"/></g></svg>
      <span className="walkthrough-action-cue" key={`cue-${step}`}><i/>{action.hint}</span>
    </div></div></div></div>
    <div className="project-demo-caption"><span className="walkthrough-action-label" key={step}><i aria-hidden="true"/>{action.label}</span><small>Sample demo</small></div>
  </div>;
}
