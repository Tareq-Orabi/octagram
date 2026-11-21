import type { CSSProperties } from "react";
import BrandModule from "./BrandModule";
import KineticLink from "./KineticLink";
import StageDeck from "./StageDeck";
import ProductWalkthrough from "./ProductWalkthrough";
import WorkShowcase from "./WorkShowcase";
import { safeHref, siteConfig, type Project } from "@/lib/site-config";
import { projectSummaries } from "@/lib/portfolio-details";

function ProjectNotes({ project, id }: { project: Project; id: string }) {
  return <dialog className="stage-read-dialog project-info-dialog" id={id} aria-labelledby={`${id}-title`}>
    <button type="button" className="stage-dialog-close" data-close-stage-dialog aria-label="Close project details">×</button>
    <h3 id={`${id}-title`}>{project.title}</h3><span>{project.subtitle}</span>
    {(project.overview ?? [project.description]).map(text=><p key={text}>{text}</p>)}
    <h4>{project.capabilitiesLabel || "Project focus"}</h4><ul>{(project.capabilities ?? project.focus ?? []).map(text=><li key={text}>{text}</li>)}</ul>
    {[...(project.engineering ?? []),...(project.digitalExperience ?? []),...(project.value ?? [])].map(text=><p key={text}>{text}</p>)}
  </dialog>;
}

export default function ProjectScenes() {
  const projects=siteConfig.projects.map((project,index)=>({project,index})).filter(item=>item.project.title!=="OCTACLUB");
  return <WorkShowcase count={projects.length}>
    <StageDeck id="project-stage" label="Project" labels={["OctaCare","OctaFitness"]} colors={["#e8aca4","#ff3348"]} className="project-deck" navigation="projects">
    {projects.map(({project,index})=>{
      const clinic=index===0, summary=projectSummaries[index], href=safeHref(project.url), slug=clinic?"six-senses":"thaaerfit";
      return <article className={`product-chapter ${clinic?"product-chapter--clinic":"product-chapter--coach"}`} key={project.title} aria-labelledby={`project-${slug}-title`} style={{"--project-color":clinic?"#e8aca4":"#ff3348","--project-light":clinic?"#fff1e5":"#ffe7a1","--project-glow":clinic?"#75483c":"#8b3c1c"} as CSSProperties}>
        <div className="project-stage-light" aria-hidden="true"/><div className="project-stage-dots" aria-hidden="true"/>
        <div className="project-scene-layout"><div className="project-scene-copy">
          <div className="project-identity"><span className="project-identity-icon"><BrandModule index={summary.module}/></span><span>{clinic?"Healthcare, connected":"Strength, with purpose"}<small>{clinic?"Built for Six Senses":"Built for ThaaerFit"}</small></span></div>
          <h3 id={`project-${slug}-title`}><span className="project-title-silver">Octa</span><span className="project-title-color">{clinic?"Care":"Fitness"}<i>.</i></span></h3>
          <p className="project-scene-subtitle">{clinic?"Clinic Management System":"Online Fitness Coaching"}</p>
          <p className="project-scene-description">{clinic?"Appointments, patient records, and clinic finances. One thoughtful workspace for the people behind the care.":"A bold digital home for strength training, nutrition, and the work that changes you."}</p>
          <div className="project-stage-actions">{href&&<KineticLink href={href} external className="button primary project-visit" ariaLabel={`Visit ${clinic?"OctaCare / Six Senses":"OctaFitness / ThaaerFit"} website (opens in a new tab)`}>Visit website</KineticLink>}<button type="button" className="project-more" data-open-stage-dialog={`project-info-${slug}`}>Explore the project <span aria-hidden="true">↗</span></button></div>
        </div><div className="project-demonstration"><ProductWalkthrough kind={clinic?"care":"fitness"}/></div></div>
        <ProjectNotes project={project} id={`project-info-${slug}`}/>
      </article>;
    })}
    </StageDeck>
  </WorkShowcase>;
}
