import type { StaticImageData } from "next/image";
import web from "@/assets/services/web-development.webp";
import mobile from "@/assets/services/mobile-development.webp";
import software from "@/assets/services/custom-software.webp";
import automation from "@/assets/services/ai-automation.webp";
import design from "@/assets/services/ui-ux-design.webp";
import integration from "@/assets/services/api-integration.webp";
import deployment from "@/assets/services/server-deployment.webp";
import support from "@/assets/services/support-maintenance.webp";

export const serviceArtwork: Record<string, { image: StaticImageData; accent: string; ink: string }> = {
  "web-development": { image: web, accent: "#f5d7ac", ink: "#a65b35" },
  "mobile-development": { image: mobile, accent: "#9bf4cf", ink: "#2b857f" },
  "custom-software": { image: software, accent: "#b5c3ff", ink: "#546dd2" },
  "ai-automation": { image: automation, accent: "#a1e8ff", ink: "#3a57df" },
  "ui-ux-design": { image: design, accent: "#f5d4dd", ink: "#946bb6" },
  "api-integration": { image: integration, accent: "#9effdc", ink: "#2970ff" },
  "server-deployment": { image: deployment, accent: "#d5caff", ink: "#5962b9" },
  "support-maintenance": { image: support, accent: "#acf8b6", ink: "#538352" },
};
