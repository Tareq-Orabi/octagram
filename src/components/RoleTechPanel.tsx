import type { CSSProperties } from "react";
import RoleReel from "./RoleReel";

const activityColors = {
  plan: "#ffbe83",
  sync: "#88cdfc",
  risk: "#f89a91",
  verify: "#97e4b1",
  review: "#dca6ff",
  ship: "#ffe190",
  get: "#65d8f6",
  post: "#97e1b5",
  patch: "#ffbd77",
  cache: "#c7adff",
  render: "#82daca",
  trace: "#aebcf4",
  route: "#d0a7ff",
  retrieve: "#79dce1",
  tool: "#7ba4fc",
  model: "#f6a4d1",
  eval: "#a6e9a3",
  approve: "#f1c377",
  auth: "#f6b67c",
  query: "#6bd5ea",
  log: "#aebbf1",
} as const;

type Activity = readonly [kind: keyof typeof activityColors, request: string, result: string];

const workflows: { label: string; rows: Activity[] }[] = [
  {
    label: "Example project delivery requests",
    rows: [
      ["plan", "clinic-pilot/scope", "Locked"],
      ["sync", "design → engineering", "Aligned"],
      ["risk", "data migration", "Mitigated"],
      ["review", "pilot walkthrough", "Approved"],
      ["verify", "release checklist", "Passed"],
      ["sync", "clinic team handoff", "Booked"],
      ["ship", "clinic-pilot/release", "Ready"],
    ],
  },
  {
    label: "Example frontend API requests",
    rows: [
      ["get", "/api/availability", "200 OK"],
      ["post", "/api/appointments", "201 Created"],
      ["patch", "/api/appointments/42", "204"],
      ["cache", "availability:today", "Hit"],
      ["render", "<Schedule />", "Ready"],
      ["get", "/api/appointments?day=tue", "200 OK"],
      ["trace", "booking interaction", "Complete"],
    ],
  },
  {
    label: "Example AI agent tool calls and evaluations",
    rows: [
      ["route", "intent.find_slot", "Scheduling"],
      ["retrieve", "clinic.booking_policy", "3 passages"],
      ["tool", "availability.lookup", "3 slots"],
      ["verify", "tool result vs. schedule", "Match"],
      ["model", "compose_grounded_reply", "Draft"],
      ["eval", "citations and policy", "Pass"],
      ["approve", "appointment.create", "Waiting"],
    ],
  },
  {
    label: "Example backend request lifecycle",
    rows: [
      ["get", "/appointments", "Received"],
      ["auth", "schedule.read", "Allowed"],
      ["cache", "appointments:tuesday", "Miss"],
      ["query", "appointments.starts_at", "6 rows"],
      ["verify", "response schema", "Valid"],
      ["log", "schedule.read audit", "Stored"],
      ["ship", "GET /appointments", "200 OK"],
    ],
  },
];

export default function RoleTechPanel({ index }: { index: number }) {
  const workflow = workflows[index];
  return <aside className="team-role-wing team-role-wing--right" aria-label={workflow.label}>
    <div className="role-workflow-rail">
      <RoleReel isWorkflow frames={workflow.rows.map(([kind, request, result], item) => (
        <div className="role-request-row role-live-motion" key={request}
          style={{ "--request-color": activityColors[kind], animationDelay: `${item * 1.15}s` } as CSSProperties}>
          <span className="role-request-verb">{kind}</span>
          <span className="role-request-result">{result}</span>
          <code>{request}</code>
        </div>
      ))}/>
    </div>
  </aside>;
}
