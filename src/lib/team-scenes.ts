/** Visual direction and practice labels grounded in the supplied team biographies. */
export const teamScenes = [
  {
    first: "Tareq", last: "Orabi", short: "Direction", color: "#fdaa7d", light: "#fff0df", deep: "#b75c35",
    statement: ["Clear", "direction."],
    skills: ["Project planning", "Client relationships", "Technical direction", "Business development", "Team coordination"],
    artwork: ["Direction, made tangible", "From priorities to a plan", "A considered next step", "The bigger picture"],
    code: ["understand the ambition", "align the priorities", "connect the disciplines", "guide the delivery"],
  },
  {
    first: "Mazen", last: "Abu Tahoun", short: "Frontend", color: "#9ec6b4", light: "#effcf4", deep: "#41978b",
    statement: ["Make it", "feel right."],
    skills: ["Building portfolios", "Landing pages", "Homepages", "Frontend architecture", "Interface implementation", "Product requirements", "Digital experiences", "Technical coordination"],
    artwork: ["Interfaces with presence", "Layers of experience", "Form in motion", "The details matter"],
    code: ["compose the interface", "connect the interaction", "adapt the experience", "refine the details"],
  },
  {
    first: "Zaid", last: "Abu Hammour", short: "Intelligence", color: "#cac56a", light: "#fff9d8", deep: "#8c7838",
    statement: ["Ideas into", "intelligence."],
    skills: ["Artificial intelligence", "Automation", "AI evaluation", "Practical integrations", "Intelligent features"],
    artwork: ["Connected intelligence", "Patterns into possibility", "A different perspective", "From signal to usefulness"],
    code: ["explore the context", "evaluate the technology", "integrate with purpose", "review the usefulness"],
  },
  {
    first: "Zaid", last: "Altayeh", short: "Backend", color: "#fd987a", light: "#ffebe1", deep: "#a94a39",
    statement: ["Built", "beneath it all."],
    skills: ["Backend engineering", "Software architecture", "Server-side development", "API design", "Database integration"],
    artwork: ["Foundations that connect", "Data with structure", "Systems working together", "Behind the experience"],
    code: ["shape the architecture", "design the API", "connect the database", "support the experience"],
  },
] as const;

export const TEAM_HOLD = .70;
export const clampTeam = (value: number) => Math.max(0, Math.min(1, value));
export const easeTeam = (value: number) => { const t = clampTeam(value); return t * t * t * (t * (t * 6 - 15) + 10); };

/** Native scroll has four reading holds, with one bounded travel between adjacent people. */
export function teamFrame(progress: number, count = 4) {
  const position = clampTeam(progress) * count;
  const from = Math.min(count - 1, Math.floor(position));
  const to = Math.min(count - 1, from + 1);
  const blend = to === from ? 0 : easeTeam((position - from - TEAM_HOLD) / (1 - TEAM_HOLD));
  const active = blend >= .5 ? to : from;
  return { from, to, blend, active, position };
}

export function teamChapterProgress(index: number, count = 4) {
  return index === 0 ? 0 : (Math.max(0, Math.min(count - 1, index)) + .12) / count;
}
