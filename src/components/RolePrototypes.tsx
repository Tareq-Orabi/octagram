import type { ReactNode } from "react";
import RoleHeroGallery from "./RoleHeroGallery";
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

const studies: Record<number, { title: string; columns: [ReactNode[], ReactNode[]] }> = {
  0: { title: "Example project delivery studies", columns: [[<PilotRoadmap/>, <RiskReview/>], [<DeliveryBoard/>, <ClientBrief/>]] },
  2: { title: "Example AI agent workflow", columns: [[<AgentRouter/>, <AgentTool/>], [<AgentSources/>, <AgentChecks/>]] },
  3: { title: "Data model", columns: [
    [<SchemaTable name="patients" fields={[["id", "PK"], ["name", "text"]]}/>, <RelationStudy/>],
    [<SchemaTable name="appointments" fields={[["id", "PK"], ["patient_id", "FK"], ["starts_at", "time"]]}/>, <QueryStudy/>],
  ] },
};

export default function RolePrototypes({ index }: { index: number }) {
  if (index === 1) return <RoleHeroGallery />;
  const study = studies[index];

  return <aside className="team-role-wing team-role-wing--left" aria-label={study.title}>
    <div className="role-gallery">
      {study.columns.map((frames, column) => <div className="role-gallery-column" key={column}>
        <RoleReel frames={frames}/>
      </div>)}
    </div>
  </aside>;
}
