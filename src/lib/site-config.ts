/** Company facts and links supplied by Octagram with edited website copy. */
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
  workspace?: "terminal" | "design" | "ai";
  name: string;
  role: string;
  /** Short team introduction. */
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
      label: "Instagram",
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
        "A clinic management system that brings patient care and daily operations into one place.",
      overview: [
        "A clinic management system that brings patient care and daily operations into one place.",
        "Six Senses connects appointments, patient records, treatment sessions and finances to help clinic teams keep their work organized.",
      ],
      status: "Delivered",
      capabilitiesLabel: "Core Capabilities",
      capabilities: [
        "Patient records and medical information",
        "Appointment and treatment scheduling",
        "Service and treatment packages",
        "Invoicing and payment tracking",
        "Financial and operational reports",
        "Role-based access",
        "Digital services for patients",
      ],
      engineering: [
        "A shared relational database connects the clinic’s records, with APIs linking services and role-based controls managing access.",
      ],
      value: [
        "Designed to make daily clinical and administrative work easier to manage.",
      ],
      url: "https://sixsenses.clinic/",
    },
    {
      title: "OCTACLUB",
      subtitle: "Learning with THINK AI",
      industry: "Medical and Technical Education",
      category: "Learning Platform",
      status: "In development",
      description:
        "A learning platform in development for medical and technical students across all Jordanian universities.",
      overview: [
        "A learning platform in development for medical and technical students across all Jordanian universities.",
        "Evolving from our original academic platform, Octaclub is being developed to support university study and self-directed learning with THINK AI.",
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
      industry: "Fitness and Wellness",
      category: "Web Development",
      description:
        "A website for online fitness coaching in strength training and nutrition.",
      overview: [
        "A website for online fitness coaching in strength training and nutrition.",
        "ThaaerFit introduces the coaching brand and helps visitors explore its services in a clear and approachable way.",
      ],
      value: [
        "A place for prospective clients to learn about the coach and find the services that suit them.",
      ],
      digitalExperience: [
        "Consistent visuals and simple navigation keep the focus on the coaching services.",
      ],
      focus: [
        "Fitness coaching brand",
        "Strength training information",
        "Nutrition planning information",
        "Online coaching services",
        "Accessible navigation",
      ],
      url: "https://thaaerfit.com/",
    },
  ],
  team: [
    {
      name: "TAREQ ORABI",
      workspace: "terminal",
      role: "CEO and Project Manager",
      description:
        "Guides Octagram’s direction and manages projects and client relationships.",
      bio: [
        "Connects business goals with technical planning and keeps the team’s work coordinated.",
      ],
      url: "https://www.linkedin.com/in/tareq-orabi-bb67b839b/",
    },
    {
      name: "MAZEN ABU TAHOUN",
      workspace: "design",
      role: "Deputy CEO and Frontend Lead",
      description:
        "Supports the team’s direction and leads frontend development.",
      bio: [
        "Shapes interface architecture and turns product requirements into clear, usable screens.",
      ],
      url: "https://www.linkedin.com/in/mazen-abutahoun-7273b5235/",
    },
    {
      name: "ZAID ABU HAMMOUR",
      workspace: "ai",
      role: "Artificial Intelligence Lead",
      description:
        "Leads AI development and explores practical uses for automation.",
      bio: [
        "Evaluates AI tools and builds features around the needs of each product.",
      ],
    },
    {
      name: "ZAID AL TAIH",
      workspace: "terminal",
      role: "Backend Lead",
      description:
        "Leads backend development across application logic, APIs and databases.",
      bio: [
        "Builds and maintains the systems that keep our products connected and running.",
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
