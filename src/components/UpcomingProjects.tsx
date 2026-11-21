import type { CSSProperties } from "react";
import { companyContent } from "@/lib/company-content";
import BrandModule from "./BrandModule";

const [think, care] = companyContent.products.items;
const projects = [
  {
    id: "octaclub",
    name: "OctaClub",
    color: "#a8d6bc",
    description: "A study platform for medical and technical learners, with course resources and tools for focused study.",
    areas: ["Medical education", "Technical education"],
    mark: 4,
  },
  {
    id: think.id,
    name: "THINK",
    color: "#ecd19d",
    description: "A workspace that brings learning resources, personal notes, and intelligent assistance together.",
    areas: ["Personal knowledge", "Intelligent assistance"],
    mark: 2,
  },
  {
    id: care.id,
    name: "OctaCare · Next",
    color: "#efaca8",
    description: "Tools to help patients and care teams stay connected throughout the care journey.",
    areas: ["Patient services", "Healthcare workflows"],
    mark: 1,
  },
] as const;

export default function UpcomingProjects() {
  return <div className="upcoming-list">
    {projects.map((project, index) => <article className="upcoming-project" key={project.id} id={`product-${project.id}`}
      data-reveal-item style={{ "--upcoming-ink": project.color, "--upcoming-delay": `${index * 85}ms` } as CSSProperties}>
      <div className="upcoming-project-name">
        <span className="upcoming-project-mark"><BrandModule index={project.mark}/></span>
        <h3>{project.name}</h3>
      </div>
      <div className="upcoming-project-details">
        <p>{project.description}</p>
        <ul>{project.areas.map(area => <li key={area}>{area}</li>)}</ul>
      </div>
    </article>)}
  </div>;
}
