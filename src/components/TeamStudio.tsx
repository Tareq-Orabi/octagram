import type { CSSProperties } from "react";
import type { TeamMember } from "@/lib/site-config";
import { teamScenes } from "@/lib/team-scenes";
import StageDeck from "./StageDeck";
import RolePrototypes from "./RolePrototypes";
import RoleTechPanel from "./RoleTechPanel";
import KineticLink from "./KineticLink";

function NameWord({ text, offset }: { text: string; offset: number }) {
  return <span className="team-name-word">{[...text].map((letter,index)=>letter === " " ? <span className="team-name-space" key={index}>&nbsp;</span>
    : <span className="team-name-cell" key={index} style={{"--letter-index":offset+index} as CSSProperties}><span className="team-name-reserve">{letter}</span><span className="team-name-glyph">{letter}</span></span>)}</span>;
}

export default function TeamStudio({ members }: { members: TeamMember[] }) {
  return <StageDeck id="team-stage" label="Team member" labels={members.map(person=>person.name)} colors={teamScenes.map(person=>person.color)} className="team-deck" sharedTilt>
    {members.map((member,index)=>{
      const scene=teamScenes[index];
      return <article className="team-member-panel" key={member.name} aria-labelledby={`team-person-${index}`} style={{"--profile-color":scene.color,"--profile-light":scene.light,"--profile-deep":scene.deep} as CSSProperties}>
        <div className="member-floor-light" aria-hidden="true" />
        <div className="team-center-copy">
          <p className="team-position"><i />{member.role}</p>
          <h3 className="team-gradient-name" id={`team-person-${index}`} aria-label={member.name}><span aria-hidden="true"><NameWord text={scene.first} offset={0}/><NameWord text={scene.last} offset={scene.first.length}/></span></h3>
          <p className="team-description">{member.description}</p>
          <div className="team-person-actions">{member.url ? <KineticLink href={member.url} external className="team-profile-link" ariaLabel={`${member.name} on LinkedIn`}>Meet on LinkedIn</KineticLink> : <KineticLink href="#contact" className="team-profile-link">Let’s talk</KineticLink>}
            <button type="button" className="team-bio-trigger" data-open-stage-dialog={`team-bio-${index}`}>About the role <span aria-hidden="true">＋</span></button></div>
          <div className="team-skills" aria-label={`${member.name} skills`} tabIndex={0}><div className="team-skills-track">{[0,1].map(copy=><div className="team-skills-group" key={copy} aria-hidden={copy===1 ? true : undefined}>{scene.skills.map(skill=><span key={skill}><i>✦</i>{skill}</span>)}</div>)}</div></div>
        </div>
        <RolePrototypes index={index} />
        <RoleTechPanel index={index} />
        <dialog className="stage-read-dialog" id={`team-bio-${index}`} aria-labelledby={`team-bio-title-${index}`}><button type="button" className="stage-dialog-close" data-close-stage-dialog aria-label="Close biography">×</button><h3 id={`team-bio-title-${index}`}>{scene.first} {scene.last}</h3><span>{member.role}</span><p>{member.description}</p>{member.bio?.map(text=><p key={text}>{text}</p>)}</dialog>
      </article>;
    })}
  </StageDeck>;
}
