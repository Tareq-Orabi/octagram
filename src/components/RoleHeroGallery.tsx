import Image from "next/image";
import type { CSSProperties } from "react";
import concreteLight from "@/assets/team/hero-concrete-light.webp";
import currentLab from "@/assets/team/hero-current-lab.webp";
import cymaticField from "@/assets/team/hero-cymatic-field.webp";
import dialogue from "@/assets/team/hero-dialogue.webp";
import glasshouse from "@/assets/team/hero-glasshouse.webp";
import particleAtlas from "@/assets/team/hero-particle-atlas.webp";
import projectionRoom from "@/assets/team/hero-projection-room.webp";
import softBodies from "@/assets/team/hero-soft-bodies.webp";
import timekeepers from "@/assets/team/hero-timekeepers.webp";
import vectorDrive from "@/assets/team/hero-vector-drive.webp";
import RoleReel from "./RoleReel";

const columns = [
  [
    { image: particleAtlas, alt: "Generative art homepage with a glowing particle sculpture and an invitation to explore the lab.", particles: true },
    { image: vectorDrive, alt: "Motion studio homepage with vermilion filaments speeding through a curved tunnel.", glow: "#f84d1a", delay: "-2s" },
    { image: concreteLight, alt: "Architecture studio homepage built around a sunlit concrete staircase." },
    { image: softBodies, alt: "Digital artist homepage with a translucent orange sculpture against cobalt blue." },
    { image: currentLab, alt: "Ocean simulation homepage with a turquoise swell shaped by luminous contour lines.", glow: "#1dddb0", delay: "-4s" },
  ],
  [
    { image: glasshouse, alt: "Glass exhibition homepage with burgundy serif type and an illuminated pink sculpture." },
    { image: dialogue, alt: "Design feedback landing page showing a comment thread anchored to an artboard." },
    { image: timekeepers, alt: "Independent watchmaker homepage with a dark green palette and detailed dial photography." },
    { image: projectionRoom, alt: "Film festival homepage with translucent projection frames stepping through amber and pink light.", glow: "#ff4fab", delay: "-6s" },
    { image: cymaticField, alt: "Sound design homepage showing an illuminated wave pattern on a vibrating surface.", glow: "#b57bff", delay: "-1s" },
  ],
];

export default function RoleHeroGallery() {
  return <aside className="team-role-wing team-role-wing--left team-role-wing--heroes" aria-label="Ten original homepage designs">
    <div className="role-gallery role-gallery--heroes">
      {columns.map((studies, column) => (
        <div className="role-gallery-column" key={column}>
          <RoleReel cycles={4} frames={studies.map(({ image, alt, particles, glow, delay }) => (
            <div className="role-study-surface role-hero-image" key={image.src}
              data-particles={particles} data-motion-light={Boolean(glow) || undefined}
              style={glow ? { "--hero-motion-light": glow, "--hero-motion-delay": delay } as CSSProperties : undefined}>
              <Image src={image} alt={alt} draggable={false} />
            </div>
          ))} />
        </div>
      ))}
    </div>
  </aside>;
}
