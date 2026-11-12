/** Approved company portfolio supplied by Octagram, October 2026. */
export interface Project {
  title: string;
  subtitle?: string;
  industry?: string;
  category?: string;
  client?: string;
  /** First overview paragraph, retained for compact project cards. */
  description: string;
  /** Complete overview; use this instead of description in expanded views. */
  overview?: string[];
  status?: string;
  capabilitiesLabel?: string;
  capabilities?: string[];
  engineering?: string[];
  value?: string[];
  focus?: string[];
  digitalExperience?: string[];
  image?: string;
  imageAlt?: string;
  url?: string;
}
export interface TeamMember {
  name: string;
  role: string;
  /** First approved biography paragraph. */
  description?: string;
  /** Remaining biography paragraphs, displayed after description. */
  bio?: string[];
  image?: string;
  imageAlt?: string;
  url?: string;
}
export interface SocialLink {
  label: string;
  url: string;
}
export interface SiteConfig {
  siteUrl: string;
  contactEmail: string;
  contactUrl: string;
  socialLinks: SocialLink[];
  projects: Project[];
  team: TeamMember[];
}
/** No email, employee portraits or unsupported project statuses are inferred. */
export const siteConfig: SiteConfig = {
  siteUrl: "https://octagramjo.com/",
  contactEmail: "",
  contactUrl: "https://www.instagram.com/octagram.jo/",
  socialLinks: [
    {
      label: "Instagram — @Octagram.jo",
      url: "https://www.instagram.com/octagram.jo/",
    },
  ],
  projects: [
    {
      title: "SIX SENSES",
      subtitle: "Clinic Management System",
      industry: "Healthcare",
      category: "Custom Software Development",
      description:
        "Six Senses is a specialized clinic management system developed to support the administrative, clinical, and financial operations of a healthcare facility.",
      overview: [
        "Six Senses is a specialized clinic management system developed to support the administrative, clinical, and financial operations of a healthcare facility.",
        "The solution brings essential operational workflows into a unified digital environment, enabling more structured management of appointments, patient information, treatment sessions, and financial activities.",
      ],
      status: "Delivered",
      capabilitiesLabel: "Core Capabilities",
      capabilities: [
        "Patient records and medical information management",
        "Appointment and treatment session scheduling",
        "Service and treatment package management",
        "Invoicing and payment tracking",
        "Financial and operational reporting",
        "Role-based administrative access",
        "Patient-facing digital services",
      ],
      engineering: [
        "The system incorporates structured backend architecture, centralized relational data management, API-based communication, and role-based access control.",
      ],
      value: [
        "An integrated digital foundation designed to simplify healthcare operations and improve the organization of essential clinical and administrative processes.",
      ],
      url: "https://sixsenses.clinic/",
    },
    {
      title: "OCTACLUB",
      status: "In development",
      subtitle: "Learning Platform · THINK AI",
      industry: "Medical & Technical Education",
      category: "Learning Platform",
      description:
        "Medical and technical learning across Jordanian universities. Self-learning, connected with THINK AI.",
      overview: [
        "Medical and technical learning across Jordanian universities. Self-learning, connected with THINK AI.",
        "Octaclub is the evolved version of the original academic platform, expanded to serve medical and technical disciplines across all Jordanian universities and support independent learning with THINK AI.",
      ],
      capabilitiesLabel: "Learning focus",
      capabilities: [
        "Medical disciplines",
        "Technical disciplines",
        "All Jordanian universities",
        "Self-directed learning",
        "THINK AI",
      ],
    },
    {
      title: "THAAERFIT",
      subtitle: "Online Fitness Coaching Website",
      industry: "Fitness & Wellness",
      category: "Web Development & Digital Experience",
      description:
        "ThaaerFit is a digital presence for an online fitness coaching service focused on strength training and nutrition planning.",
      overview: [
        "ThaaerFit is a digital presence for an online fitness coaching service focused on strength training and nutrition planning.",
        "The website presents the coaching brand and its services through an accessible online experience, helping prospective clients discover its fitness and coaching offerings.",
      ],
      value: [
        "A dedicated digital destination supporting the presentation of fitness coaching services and the connection between a coaching brand and its prospective clients.",
      ],
      digitalExperience: [
        "The project reflects the importance of combining clear service communication, consistent brand presentation, and an approachable online experience for independent service providers.",
      ],
      focus: [
        "Fitness coaching brand presentation",
        "Strength training service information",
        "Nutrition planning service information",
        "Online coaching digital experience",
        "Accessible website navigation and presentation",
      ],
      url: "https://thaaerfit.com/",
    },
  ],
  team: [
    {
      name: "TAREQ ORABI",
      role: "Chief Executive Officer (CEO) & Project Manager",
      description:
        "Responsible for Octagram's strategic direction, business development, project management, and overall operational leadership.",
      bio: [
        "His responsibilities include project coordination, client relationships, technical direction, planning, and ensuring alignment between business objectives and engineering execution.",
      ],
      url: "https://www.linkedin.com/in/tareq-orabi-bb67b839b/",
    },
    {
      name: "MAZEN ABU TAHOUN",
      role: "Deputy CEO & Frontend Lead",
      description:
        "Supports executive leadership while leading frontend engineering and digital interface development.",
      bio: [
        "His responsibilities include frontend architecture, user interface implementation, technical coordination, and translating product requirements into functional digital experiences.",
      ],
      url: "https://www.linkedin.com/in/mazen-abutahoun-7273b5235/",
    },
    {
      name: "ZAID ABU HAMMOUR",
      role: "Artificial Intelligence Lead",
      description:
        "Leads artificial intelligence initiatives and contributes to the development of intelligent software features and automation solutions.",
      bio: [
        "His focus includes evaluating AI technologies, exploring practical integrations, and developing intelligent capabilities aligned with product requirements.",
      ],
    },
    {
      name: "Zaid Altayeh",
      role: "Backend Lead",
      description:
        "Leads backend engineering and contributes to software architecture, server-side application development, API design, and database integration.",
      bio: [
        "His responsibilities focus on developing reliable technical foundations that support Octagram's software systems.",
      ],
      url: "https://www.linkedin.com/in/zaid-altayeh-152375364/",
    },
  ],
};
/** Permit local public assets, web destinations, and explicitly allowed email links. */
export function safeHref(
  value: string | undefined,
  contact = false,
): string | undefined {
  if (!value) return undefined;
  if (/^\/(?!\/)/.test(value) || /^\.\.?\//.test(value)) return value;
  try {
    const parsed = new URL(value);
    return ["https:", "http:", ...(contact ? ["mailto:"] : [])].includes(
      parsed.protocol,
    )
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}
export const contactEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
  siteConfig.contactEmail,
)
  ? siteConfig.contactEmail
  : "";
export const directContactHref = contactEmail
  ? `mailto:${contactEmail}`
  : safeHref(siteConfig.contactUrl, true);
