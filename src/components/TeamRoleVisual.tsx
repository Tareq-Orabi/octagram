"use client";

import { useEffect, useRef } from "react";

/** Illustrative workflows, not live metrics. All motion has a finite reading state. */
export default function TeamRoleVisual({ index }: { index: number }) {
  const art = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = art.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.dataset.roleState = "arrived";
      observer.disconnect();
    }, { threshold: .4 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div className={`team-role-visual team-role-visual--${index}`} ref={art} aria-hidden="true">
    <svg viewBox="0 0 460 174" fill="none" focusable="false">
      <path className="role-grid" d="M0 43H460M0 87H460M0 131H460M58 0V174M144 0V174M230 0V174M316 0V174M402 0V174" />
      {index === 0 ? <>
        <path className="role-wire" d="M62 116H146Q163 116 163 99V66Q163 49 180 49H275Q292 49 292 66V96Q292 113 309 113H398" />
        <path className="role-trace" pathLength="1" d="M62 116H146Q163 116 163 99V66Q163 49 180 49H275Q292 49 292 66V96Q292 113 309 113H398" />
        {[{ x: 38, y: 84, name: "PLAN" }, { x: 190, y: 17, name: "ALIGN" }, { x: 342, y: 81, name: "DELIVER" }].map((step, i) => <g key={step.name} className="role-node" style={{ animationDelay: `${i * 140}ms` }}>
          <rect x={step.x} y={step.y} width="80" height="58" rx="10" className="role-panel" />
          <path d={`M${step.x + 15} ${step.y + 16}h35m-35 8h23`} className="role-detail" />
          <text x={step.x + 15} y={step.y + 44}>{step.name}</text>
        </g>)}
        <circle cx="230" cy="49" r="5" className="role-status" />
      </> : index === 1 ? <>
        <g className="role-node"><rect x="43" y="20" width="252" height="136" rx="12" className="role-panel" />
          <path d="M43 44H295" className="role-wire" /><circle cx="56" cy="32" r="2" className="role-status" /><circle cx="65" cy="32" r="2" className="role-muted" />
          <rect x="60" y="59" width="44" height="79" rx="5" className="role-wash" />
          <path d="M70 72h23m-23 10h17m-17 10h21" className="role-detail" />
          <rect x="116" y="59" width="161" height="27" rx="5" className="role-wash" />
          {[0, 1, 2].map(n => <rect key={n} className="role-component" x={116 + n * 55} y="97" width="49" height="41" rx="5" style={{ animationDelay: `${n * 150}ms` }} />)}
        </g>
        <path className="role-wire" d="M299 87H324" /><path d="m318 81 6 6-6 6" className="role-detail" />
        <g className="role-phone"><rect x="337" y="31" width="78" height="124" rx="14" className="role-panel" />
          <path d="M363 40h26" className="role-detail" /><rect x="346" y="55" width="60" height="23" rx="4" className="role-wash" />
          <rect x="346" y="86" width="60" height="26" rx="4" className="role-component" /><path d="M349 124h49m-49 8h34" className="role-detail" />
        </g>
      </> : index === 2 ? <>
        <rect x="24" y="61" width="81" height="53" rx="10" className="role-panel" /><text x="40" y="92">INPUT</text>
        <g className="role-network">
          <path d="M105 87 175 43 235 69 295 35 354 87M105 87H175L235 69 295 119 354 87M105 87 175 132 235 105 295 119M175 43 235 105 295 35M175 132 235 69" className="role-wire" />
          <path d="M105 87 175 43 235 69 295 119 354 87" pathLength="1" className="role-trace" />
          {[[175, 43], [175, 87], [175, 132], [235, 69], [235, 105], [295, 35], [295, 119]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" className="role-neuron" style={{ animationDelay: `${i * 90}ms` }} />)}
        </g>
        <rect x="354" y="61" width="84" height="53" rx="10" className="role-panel" /><text x="367" y="92">OUTPUT</text>
      </> : <>
        <g className="role-node"><rect x="25" y="54" width="95" height="66" rx="10" className="role-panel" /><text x="50" y="83">API</text><path d="M49 97h44" className="role-detail" /></g>
        <path d="M120 87H181M279 87H344" className="role-wire" /><path d="M120 87H181M279 87H344" className="role-trace" pathLength="1" />
        <g className="role-node"><rect x="181" y="34" width="98" height="105" rx="10" className="role-panel" />
          {[0, 1, 2].map(n => <g key={n}><rect x="195" y={49 + n * 26} width="70" height="18" rx="4" className="role-wash" /><circle cx="252" cy={58 + n * 26} r="2" className="role-status" /></g>)}
        </g>
        <g className="role-node"><path d="M344 55c0-15 88-15 88 0v65c0 15-88 15-88 0z" className="role-panel" /><ellipse cx="388" cy="55" rx="44" ry="12" className="role-detail" /><path d="M344 83c0 15 88 15 88 0M344 108c0 15 88 15 88 0" className="role-detail" /></g>
        <text x="207" y="160">SERVER</text><text x="363" y="156">DATA</text>
      </>}
    </svg>
    <span className="role-visual-caption">{["A shared plan. A clear path to delivery.", "One interface, adapted to every screen.", "From an input to a useful output.", "Connected APIs, systems and data."][index]}</span>
  </div>;
}
