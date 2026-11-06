/**
 * Complete approved company portfolio copy, supplied in October 2026.
 * Paragraphs preserve the source wording and order. Project/member records
 * live in site-config.ts; their section introductions live here.
 */
export interface TextSection {
  label: string;
  title: string;
  paragraphs: string[];
  closing?: string;
}
export interface TitledDescription {
  title: string;
  description: string;
}
export interface CompanyService {
  id: string;
  number: string;
  title: string;
  offerings: string[];
}
export interface ProductInitiative {
  id: string;
  name: string;
  title: string;
  industry: string;
  category: string;
  paragraphs: string[];
  visionAreas: string[];
  ambition: string;
  status: "Product initiative under development.";
}
export interface EngineeringStage extends TitledDescription {
  number: string;
}
export interface CompanyContent {
  brand: {
    name: string;
    tagline: string;
    portfolioLabel: string;
    year: number;
    disciplineLine: string;
    heroTitle: string;
  };
  about: TextSection;
  vision: TextSection;
  mission: TextSection & {
    principlesIntro: string;
    principles: TitledDescription[];
  };
  services: TextSection & { items: CompanyService[] };
  projectsIntro: TextSection;
  products: TextSection & { items: ProductInitiative[] };
  approach: TextSection & { stages: EngineeringStage[] };
  teamIntro: TextSection;
  whyOctagram: TextSection & { reasons: TitledDescription[] };
  contact: TextSection & {
    collaborationIntro: string;
    collaborationAreas: string[];
    website: string;
    instagram: string;
    instagramLabel: string;
    location: string;
  };
  closing: { lead: string; headline: string; brand: string; tagline: string };
}

/** Render each section's paragraphs in order, preserving complete approved copy. */
export const companyContent: CompanyContent = {
  brand: {
    name: "OCTAGRAM",
    tagline: "Designing Impact. Engineering Beauty.",
    portfolioLabel: "COMPANY PORTFOLIO | 2026",
    year: 2026,
    disciplineLine:
      "Software Engineering • Digital Innovation • Artificial Intelligence",
    heroTitle: "From Ambitious Ideas to Exceptional Digital Experiences.",
  },
  about: {
    label: "ABOUT OCTAGRAM",
    title: "Engineering Ideas. Creating Impact.",
    paragraphs: [
      "Octagram is a Jordan-based software engineering and digital innovation team dedicated to transforming ambitious ideas into sophisticated digital solutions.",
      "We bring together technical expertise, strategic thinking, and creative design to develop modern software systems that address real-world challenges.",
      "Our work extends beyond conventional software development. We approach each project as an interconnected digital ecosystem, combining thoughtful architecture, intelligent functionality, intuitive experiences, and long-term technical sustainability.",
      "From healthcare management systems and educational platforms to online services and emerging digital products, we engineer technology with purpose.",
    ],
    closing: "We Don't Simply Develop Software. We Engineer Possibilities.",
  },
  vision: {
    label: "OUR VISION",
    title: "Shaping Tomorrow Through Technology.",
    paragraphs: [
      "Our vision is to establish Octagram as a recognized force in software engineering and digital innovation, creating technologies that challenge conventional approaches and expand what digital systems can achieve.",
      "We aspire to develop meaningful digital products and intelligent ecosystems that empower organizations, enhance human experiences, and contribute to technological progress.",
      "We believe exceptional technology is defined not only by its capabilities, but by the lasting impact it creates.",
    ],
  },
  mission: {
    label: "OUR MISSION",
    title: "Turning Complexity Into Opportunity.",
    paragraphs: [
      "Our mission is to empower businesses, institutions, and innovators through reliable, intelligent, and purpose-built software solutions.",
      "We combine engineering discipline, strategic problem-solving, and human-centered design to transform complex requirements into practical digital experiences.",
    ],
    principlesIntro: "Our commitment centers on five principles:",
    principles: [
      {
        title: "Engineering Excellence",
        description:
          "Building reliable, maintainable, and scalable software systems.",
      },
      {
        title: "Strategic Thinking",
        description: "Connecting technical decisions with business objectives.",
      },
      {
        title: "Human-Centered Design",
        description: "Creating intuitive and meaningful digital experiences.",
      },
      {
        title: "Continuous Innovation",
        description:
          "Exploring modern technologies and their practical applications.",
      },
      {
        title: "Long-Term Value",
        description:
          "Developing solutions designed to evolve alongside organizational needs.",
      },
    ],
  },
  services: {
    label: "OCTAGRAM",
    title: "Our Services.",
    paragraphs: [],
    items: [
      {
        id: "web-development",
        number: "01",
        title: "Web Development",
        offerings: [
          "Landing Pages",
          "Business & Corporate Websites",
          "Advanced CMS Websites",
          "E-Commerce Websites",
          "Custom Web Platforms",
        ],
      },
      {
        id: "mobile-development",
        number: "02",
        title: "Mobile App Development",
        offerings: [
          "Android Applications",
          "iOS Applications",
          "MVP Development",
          "Business Applications",
          "Custom Mobile Applications",
        ],
      },
      {
        id: "custom-software",
        number: "03",
        title: "Custom Software & Management Systems",
        offerings: [
          "Internal Management Systems",
          "Customer Relationship Management (CRM)",
          "Booking & Reservation Systems",
          "Operations Management Systems",
          "Employee Management Systems",
          "Inventory & Order Management",
          "Custom Enterprise Software",
        ],
      },
      {
        id: "ai-automation",
        number: "04",
        title: "AI & Automation",
        offerings: [
          "AI Chatbots",
          "AI Assistants",
          "Custom AI Solutions",
          "Workflow Automation",
          "Business Process Automation",
          "Intelligent System Integration",
        ],
      },
      {
        id: "ui-ux-design",
        number: "05",
        title: "UI/UX Design",
        offerings: [
          "Website UI/UX Design",
          "Mobile App UI/UX Design",
          "Landing Page Design",
          "Dashboard UI/UX Design",
          "User Experience Optimization",
        ],
      },
      {
        id: "api-integration",
        number: "06",
        title: "API & System Integration",
        offerings: [
          "API Integration",
          "Payment Gateway Integration",
          "WhatsApp Integration",
          "SMS Integration",
          "Third-Party Services Integration",
          "Multi-System Integration",
        ],
      },
      {
        id: "server-deployment",
        number: "07",
        title: "Server & Deployment Services",
        offerings: [
          "Server Setup & Configuration",
          "Web Hosting Setup",
          "Application Deployment",
          "Server Environment Configuration",
        ],
      },
      {
        id: "support-maintenance",
        number: "08",
        title: "Technical Support & Maintenance",
        offerings: [
          "Technical Support",
          "Software Maintenance",
          "System Updates",
          "Ongoing Technical Monitoring",
          "Technical Issue Resolution",
        ],
      },
    ],
  },
  projectsIntro: {
    label: "SELECTED PROJECTS",
    title: "Ideas Engineered Into Real-World Solutions.",
    paragraphs: [
      "Our work reflects a commitment to solving practical challenges through software engineering, thoughtful design, and purpose-built technology.",
    ],
  },
  products: {
    label: "PRODUCT INNOVATION",
    title: "Beyond Projects. Toward Products.",
    paragraphs: [
      "Octagram's ambitions extend beyond commissioned software development.",
      "We aim to create independent digital products that explore opportunities in education, healthcare, and connected digital services.",
      "Our product initiatives reflect a long-term commitment to innovation, scalable architecture, and meaningful technology.",
    ],
    items: [
      {
        id: "think",
        name: "THINK",
        title: "Rethinking the Future of Education.",
        industry: "Educational Technology",
        category: "Product Vision & Development Initiative",
        paragraphs: [
          "THINK represents Octagram's broader vision for a connected and intelligent educational technology ecosystem.",
          "The initiative explores the integration of academic resources, personalized learning experiences, intelligent assistance, and modern educational workflows within a unified digital environment.",
        ],
        visionAreas: [
          "Connected learning environments",
          "Personalized educational experiences",
          "Intelligent academic assistance",
          "Organized academic resources",
          "Learning progress and insights",
          "Institutional digital learning solutions",
        ],
        ambition:
          "To explore educational technology that is more accessible, adaptable, and capable of supporting different learning needs.",
        status: "Product initiative under development.",
      },
      {
        id: "octacare",
        name: "OCTACARE",
        title: "Exploring the Future of Digital Healthcare.",
        industry: "Healthcare Technology",
        category: "Product Vision & Development Initiative",
        paragraphs: [
          "OctaCare represents Octagram's long-term ambition to explore connected healthcare technology and intelligent digital health experiences.",
          "The initiative focuses on identifying opportunities to improve how healthcare services, users, and operational workflows interact through technology.",
        ],
        visionAreas: [
          "Connected healthcare experiences",
          "Healthcare management workflows",
          "Patient-centered digital services",
          "Intelligent healthcare software capabilities",
          "Integrated health technology solutions",
        ],
        ambition:
          "To contribute to a more connected and efficient digital healthcare landscape through purpose-built software products.",
        status: "Product initiative under development.",
      },
    ],
  },
  approach: {
    label: "OUR ENGINEERING APPROACH",
    title: "From Vision to Execution.",
    paragraphs: [
      "Successful software requires structured thinking, technical discipline, and a clear understanding of business requirements.",
      "Our development approach follows five interconnected stages.",
    ],
    stages: [
      {
        number: "01",
        title: "Discovery & Strategy",
        description:
          "Understanding the client's objectives, users, operational challenges, and technical requirements.",
      },
      {
        number: "02",
        title: "Architecture & Planning",
        description:
          "Transforming requirements into structured workflows, technical specifications, system architecture, and implementation priorities.",
      },
      {
        number: "03",
        title: "Design & Development",
        description:
          "Building functional software through coordinated interface design, backend engineering, and iterative development.",
      },
      {
        number: "04",
        title: "Quality & Validation",
        description:
          "Testing critical functionality, reviewing system behavior, and addressing reliability, performance, and security requirements.",
      },
      {
        number: "05",
        title: "Deployment & Evolution",
        description:
          "Preparing software for operational environments and supporting future improvements according to each project's requirements and agreed scope.",
      },
    ],
    closing:
      "Our Principle: Understand the Problem. Engineer the Solution. Build for What Comes Next.",
  },
  teamIntro: {
    label: "OUR TEAM",
    title: "The Minds Behind Octagram.",
    paragraphs: [
      "Behind every digital solution is a team combining technical expertise, leadership, and a shared commitment to meaningful innovation.",
      "Octagram brings together complementary specializations across software engineering, artificial intelligence, digital product development, and technical management.",
    ],
    closing: "Different Expertise. Shared Ambition. One Direction.",
  },
  whyOctagram: {
    label: "WHY OCTAGRAM?",
    title: "More Than Development. A Commitment to Engineering.",
    paragraphs: [
      "We believe strong digital solutions emerge from a combination of technical discipline, business understanding, and creative problem-solving.",
    ],
    reasons: [
      {
        title: "Engineering-Driven Thinking",
        description:
          "We prioritize system structure, maintainability, reliability, and thoughtful architectural decisions.",
      },
      {
        title: "Tailored Digital Solutions",
        description:
          "We develop software around actual organizational requirements rather than relying on a one-size-fits-all approach.",
      },
      {
        title: "Integrated Expertise",
        description:
          "Our team brings together backend engineering, frontend development, artificial intelligence, and digital product thinking.",
      },
      {
        title: "Product-Oriented Mindset",
        description:
          "We consider the complete digital experience, not simply individual features or isolated technical tasks.",
      },
      {
        title: "Direct Collaboration",
        description:
          "We value transparent communication, clear requirements, and close collaboration with stakeholders.",
      },
      {
        title: "Ambition to Innovate",
        description:
          "We approach ambitious ideas as opportunities for serious exploration, structured planning, and purposeful engineering.",
      },
    ],
    closing:
      "Our Focus Is Not Simply on What Technology Can Do Today, but on What It Can Make Possible Tomorrow.",
  },
  contact: {
    label: "CONTACT & COLLABORATION",
    title: "Let's Engineer What's Next.",
    paragraphs: [
      "Every remarkable digital product begins with an idea, a challenge, or a vision for something better.",
      "Whether you are a business looking to modernize operations, an institution planning a digital platform, or a strategic partner exploring new opportunities, Octagram brings the engineering perspective required to turn ideas into practical solutions.",
    ],
    collaborationIntro: "We welcome collaboration in:",
    collaborationAreas: [
      "Custom software engineering",
      "Web and digital platform development",
      "Healthcare and educational technology",
      "Artificial intelligence and automation",
      "Digital product development",
      "Technology partnerships",
      "Digital transformation initiatives",
    ],
    closing: "Your Vision. Our Engineering.",
    website: "https://octagramjo.com/",
    instagram: "https://www.instagram.com/octagram.jo/",
    instagramLabel: "@Octagram.jo",
    location: "Jordan",
  },
  closing: {
    lead: "THE FUTURE IS NOT ONLY IMAGINED.",
    headline: "IT IS ENGINEERED.",
    brand: "OCTAGRAM",
    tagline: "Designing Impact. Engineering Beauty.",
  },
};
