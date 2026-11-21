import { mainTrack, portalEnd, portalMouth, stationDistances } from "./assembly-track";

export const assemblyDuration = 15;
export const conveyorSpeed = 1.58;
export const launchTime = (mainTrack.length - (portalMouth - portalEnd)) / conveyorSpeed;
export const exitTime = mainTrack.length / conveyorSpeed;
export const carrierVariants = [
  { name: "Prism", color: 0xff9870, highlight: 0xff448f },
  { name: "Circuit", color: 0x399dff, highlight: 0x3cffd0 },
  { name: "Ring", color: 0xb862ff, highlight: 0xf25dff },
] as const;
const arrive = stationDistances.map(distance => distance / conveyorSpeed);

export const assemblyStations = [
  { start: 0, arrive: arrive[0], done: arrive[0] + .43, color: "#ac86ff", note: "Project brief captured",
    readout: ["Capture the project brief", "Identify who it serves", "and what they need."] },
  { start: 2.46, arrive: arrive[1], done: arrive[1] + .51, color: "#ffc45d", note: "System plan ready",
    readout: ["Plan the system", "Map the workflows and", "decide what to build first."] },
  { start: 4.90, arrive: arrive[2], done: arrive[2] + .70, color: "#59ffd2", note: "Build ready for testing",
    readout: ["Design and build", "Shape the interface and", "assemble a working product."] },
  { start: 8.87, arrive: arrive[3], done: arrive[3] + .43, color: "#69c5ff", note: "Checks passed",
    readout: ["Test and refine", "Check the critical journeys,", "speed, and reliability."] },
  { start: 11.03, arrive: launchTime, done: exitTime, color: "#ff79d7", note: "Release dispatched",
    readout: ["Launch and improve", "Send the release out and", "plan the next improvement."] },
] as const;

export function assemblyTime(seconds: number) {
  const position = seconds % assemblyDuration;
  return position < 0 ? position + assemblyDuration : position;
}

export function assemblyStep(time: number) {
  return assemblyStations.findLastIndex(station => time >= station.start);
}
