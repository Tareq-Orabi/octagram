import Image, { type StaticImageData } from "next/image";
import cartierCurtain from "@/assets/team/cartier-curtain.webp";
import cartierWatch from "@/assets/team/cartier-watch-object.webp";
import diorCampaign from "@/assets/team/gris-dior-campaign.webp";
import lipStylo from "@/assets/team/lip-stylo-collection.webp";
import hotelsArchive from "@/assets/team/the-real-hotels-archive.webp";
import watchStudio from "@/assets/team/watch-studio.webp";
import type { ReactNode } from "react";
import RoleReel from "./RoleReel";

function PilotRoadmap() {
  return <div className="role-study-surface role-delivery-study role-delivery-study--roadmap">
    <span className="role-study-caption">Pilot roadmap</span>
    <strong>Clinic onboarding</strong>
    <ol>
      <li><i/>Discovery</li>
      <li><i/>Build</li>
      <li><i/>First clinic</li>
    </ol>
  </div>;
}

function DeliveryBoard() {
  return <div className="role-study-surface role-delivery-study role-delivery-study--board">
    <span className="role-study-caption">Delivery board</span>
    <dl>
      <div><dt>Intake</dt><dd>Ready</dd></div>
      <div><dt>Scheduling</dt><dd>In build</dd></div>
      <div><dt>Staff review</dt><dd>Next</dd></div>
    </dl>
  </div>;
}

function RiskReview() {
  return <div className="role-study-surface role-delivery-study role-delivery-study--risk">
    <span className="role-study-caption">Risk review</span>
    <div className="role-risk-grid" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
    <span>Migration rehearsal</span>
  </div>;
}

function ClientBrief() {
  return <div className="role-study-surface role-delivery-study role-delivery-study--brief">
    <span className="role-study-caption">Client brief</span>
    <strong>Intake &amp; scheduling</strong>
    <span>Confirm the pilot owner</span>
  </div>;
}

function WebsiteReference({ image, name, alt, motion = "still" }: {
  image: StaticImageData;
  name: string;
  alt: string;
  motion?: "still" | "pan" | "object";
}) {
  return <figure className="role-study-surface role-site-reference" data-camera={motion}>
    <Image src={image} alt={alt} draggable={false} sizes="(max-width: 767px) 25vw, 14vw"/>
    <figcaption>{name}</figcaption>
  </figure>;
}

function AgentRouter() {
  return <div className="role-study-surface role-agent-study role-agent-study--route">
    <span className="role-study-caption">Agent routing</span>
    <div className="role-agent-route">
      <span>Booking intent</span>
      <i aria-hidden="true"/>
      <strong>Schedule tool</strong>
      <i aria-hidden="true"/>
      <span>Check slots</span>
    </div>
  </div>;
}

function AgentTool() {
  return <div className="role-study-surface role-agent-study role-agent-study--tool">
    <span className="role-study-caption">Tool call</span>
    <code>find_slots</code>
    <code>{'{ "day": "Tue" }'}</code>
    <span className="role-agent-status">3 slots returned</span>
  </div>;
}

function AgentSources() {
  return <div className="role-study-surface role-agent-study role-agent-study--retrieve">
    <span className="role-study-caption">Retrieved sources</span>
    <ul>
      <li>Booking policy <b>01</b></li>
      <li>Clinic hours <b>02</b></li>
      <li>Service duration <b>03</b></li>
    </ul>
  </div>;
}

function AgentChecks() {
  return <div className="role-study-surface role-agent-study role-agent-study--checks">
    <span className="role-study-caption">Before booking</span>
    <ul>
      <li>Slot available <b>✓</b></li>
      <li>Policy checked <b>✓</b></li>
      <li>User approval <b>Pending</b></li>
    </ul>
  </div>;
}

function SchemaTable({ name, fields }: { name: string; fields: [string, string][] }) {
  return <div className="role-schema-table role-study-surface">
    <strong><i aria-hidden="true">▤</i> {name}</strong>
    {fields.map(([field, type]) => <div key={field}><code>{field}</code><span>{type}</span></div>)}
  </div>;
}

function QueryStudy() {
  return <div className="role-query-study role-study-surface">
    <span className="role-study-caption">Schedule query</span>
    <code><b>SELECT</b> starts_at<br/><b>FROM</b> appointments<br/><b>WHERE</b> patient_id = ?</code>
  </div>;
}

function RelationStudy() {
  return <div className="role-relation-study role-study-surface">
    <code>patients.id</code>
    <span className="role-schema-link"><i/>1 to many<i/></span>
    <code>appointments.patient_id</code>
  </div>;
}

const studies: { title: string; columns: [ReactNode[], ReactNode[]] }[] = [
  { title: "Example project delivery studies", columns: [[<PilotRoadmap/>, <RiskReview/>], [<DeliveryBoard/>, <ClientBrief/>]] },
  { title: "Design references", columns: [
    [
      <WebsiteReference image={diorCampaign} name="Gris Dior" alt="Gris Dior’s virtual campaign in a rose-colored landscape" motion="pan"/>,
      <WebsiteReference image={hotelsArchive} name="The Real Hotels" alt="The Real Hotels homepage with oversized cream lettering on black"/>,
      <WebsiteReference image={cartierWatch} name="Cartier" alt="A sculptural Cartier watch suspended above pale blue clouds" motion="object"/>,
    ],
    [
      <WebsiteReference image={watchStudio} name="Prägen Hätlen" alt="A sculptural watch study from Prägen Hätlen’s product showcase" motion="object"/>,
      <WebsiteReference image={cartierCurtain} name="Cartier" alt="The minimal Cartier Watches and Wonders landing page with a warm gold curtain"/>,
      <WebsiteReference image={lipStylo} name="Lip Stylo" alt="A red and coral display of individual lipstick shades on a dark luxury product site" motion="pan"/>,
    ],
  ] },
  { title: "Example AI agent workflow", columns: [[<AgentRouter/>, <AgentTool/>], [<AgentSources/>, <AgentChecks/>]] },
  { title: "Data model", columns: [
    [<SchemaTable name="patients" fields={[["id", "PK"], ["name", "text"]]}/>, <RelationStudy/>],
    [<SchemaTable name="appointments" fields={[["id", "PK"], ["patient_id", "FK"], ["starts_at", "time"]]}/>, <QueryStudy/>],
  ] },
];

export default function RolePrototypes({ index }: { index: number }) {
  const study = studies[index];

  return <aside className="team-role-wing team-role-wing--left" aria-label={study.title}>
    {index === 1 && <span className="role-reference-credit">Design references · Landing.love</span>}
    <div className="role-gallery">
      {study.columns.map((frames, column) => <div className="role-gallery-column" key={column}>
        <RoleReel frames={frames}/>
      </div>)}
    </div>
  </aside>;
}
