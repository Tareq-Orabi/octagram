/**
 * Website copy based on the company portfolio, edited for a clear and calm voice.
 * Project and member records
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
  status: "In development";
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
  products: { items: ProductInitiative[] };
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

/** Render each section’s paragraphs in order. */
export const companyContent: CompanyContent = {
  brand: {
    name: "OCTAGRAM",
    tagline: "Designing impact and engineering beauty",
    portfolioLabel: "COMPANY PORTFOLIO 2026",
    year: 2026,
    disciplineLine: "Software engineering and thoughtful design",
    heroTitle: "We turn ideas into software people enjoy using.",
  },
  about: {
    label: "ABOUT OCTAGRAM",
    title: "Good ideas deserve thoughtful software",
    paragraphs: [
      "We are Octagram, a software team based in Jordan.",
      "We bring design and engineering together to help people build useful digital products.",
      "We start by understanding the need, then shape software that is clear to use and practical to maintain.",
      "Our work spans healthcare, education and online services. We build with care for the people who use it.",
    ],
    closing: "Thoughtful software starts with understanding people",
  },
  vision: {
    label: "OUR VISION",
    title: "A little more possible",
    paragraphs: [
      "We want to build technology that opens up new ways to learn and work.",
      "Our ambition is to grow through useful products and lasting relationships.",
      "We see progress in the everyday things software helps people do.",
    ],
  },
  mission: {
    label: "OUR MISSION",
    title: "Make the complex feel simple",
    paragraphs: [
      "We help businesses and teams turn everyday challenges into practical software.",
      "Clear thinking and careful design guide how we build.",
    ],
    principlesIntro: "What guides our work",
    principles: [
      {
        title: "Careful engineering",
        description: "Build software that is reliable and easy to maintain.",
      },
      {
        title: "Clear purpose",
        description: "Keep technical decisions connected to your goals.",
      },
      {
        title: "People first",
        description: "Design around the people who will use the product.",
      },
      {
        title: "Keep learning",
        description:
          "Explore new tools where they can make a useful difference.",
      },
      {
        title: "Room to grow",
        description: "Leave space for the product to evolve as needs change.",
      },
    ],
  },
  services: {
    label: "OCTAGRAM",
    title: "Our services",
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
    title: "Ideas taking shape",
    paragraphs: [
      "A selection of our work and the products we are developing. Each starts with a practical need.",
    ],
  },
  products: {
    items: [
      {
        id: "think",
        name: "THINK",
        title: "More room to learn",
        industry: "Educational Technology",
        category: "Product initiative",
        paragraphs: [
          "THINK is an education initiative exploring how AI and learning resources can work together.",
          "We are exploring ways to bring study materials, personal guidance and learning progress into one place.",
        ],
        visionAreas: [
          "Connected learning spaces",
          "Personalized learning",
          "AI study assistance",
          "Organized study resources",
          "Learning progress and insights",
          "Tools for educational institutions",
        ],
        ambition: "Help people find a way to learn that fits their needs.",
        status: "In development",
      },
      {
        id: "octacare",
        name: "OCTACARE",
        title: "Care that feels connected",
        industry: "Healthcare Technology",
        category: "Product initiative",
        paragraphs: [
          "OCTACARE is a healthcare initiative exploring better connections between patients and care teams.",
          "We are looking at how software can support daily workflows and make services easier to navigate.",
        ],
        visionAreas: [
          "Connected care experiences",
          "Healthcare management",
          "Patient services",
          "AI support for healthcare workflows",
          "Connected health systems",
        ],
        ambition:
          "Make everyday healthcare tasks simpler for patients and care teams.",
        status: "In development",
      },
    ],
  },
  approach: {
    label: "OUR ENGINEERING APPROACH",
    title: "From the first conversation",
    paragraphs: [
      "We begin with your goals and the people the product is for.",
      "Then we work through five stages with space to review and refine along the way.",
    ],
    stages: [
      {
        number: "01",
        title: "Understand",
        description:
          "Listen to your goals and learn about your users, daily challenges and technical needs.",
      },
      {
        number: "02",
        title: "Plan",
        description:
          "Map the workflows and system structure, then agree on priorities and scope.",
      },
      {
        number: "03",
        title: "Design and build",
        description:
          "Bring the interface and underlying systems together through steady iterations.",
      },
      {
        number: "04",
        title: "Test and refine",
        description:
          "Review key workflows, performance and security needs before release.",
      },
      {
        number: "05",
        title: "Launch and grow",
        description:
          "Prepare for launch and plan ongoing support around the agreed scope.",
      },
    ],
    closing: "A clear next step at every stage",
  },
  teamIntro: {
    label: "OUR TEAM",
    title: "The people behind Octagram",
    paragraphs: [
      "We are a small team with different skills and a shared care for our work.",
      "Together we bring experience in design, software engineering, AI and project delivery.",
    ],
  },
  whyOctagram: {
    label: "WHY OCTAGRAM",
    title: "Care in the way we build",
    paragraphs: [
      "Good work comes from understanding your needs and paying attention to the details. Here is how we approach it.",
    ],
    reasons: [
      {
        title: "Solid foundations",
        description:
          "We give the structure behind your product as much care as the experience on screen.",
      },
      {
        title: "Built around your needs",
        description: "Your workflows and priorities guide what we build.",
      },
      {
        title: "A connected team",
        description: "Frontend, backend and AI work together from the start.",
      },
      {
        title: "The whole experience",
        description:
          "We consider how each feature fits into the way people use your product.",
      },
      {
        title: "Direct conversations",
        description:
          "Work closely with the people building your software, with clear updates along the way.",
      },
      {
        title: "Curiosity with purpose",
        description:
          "We explore new ideas carefully and choose tools for the value they bring.",
      },
    ],
    closing: "Something useful today with room for tomorrow",
  },
  contact: {
    label: "LET’S TALK",
    title: "Start with a conversation",
    paragraphs: [
      "Have an idea or a challenge in mind? Tell us a little about it and we can explore the next step together.",
      "We welcome new projects and thoughtful partnerships across software, education and healthcare.",
    ],
    collaborationIntro: "Ways we can work together",
    collaborationAreas: [
      "Custom software engineering",
      "Web and digital platform development",
      "Healthcare and educational technology",
      "Artificial intelligence and automation",
      "Digital product development",
      "Technology partnerships",
      "Digital transformation initiatives",
    ],
    closing: "Let’s build something useful together",
    website: "https://octagramjo.com/",
    instagram: "https://www.instagram.com/octagram.jo/",
    instagramLabel: "@Octagram.jo",
    location: "Jordan",
  },
  closing: {
    lead: "GOOD IDEAS",
    headline: "GROW WITH CARE",
    brand: "OCTAGRAM",
    tagline: "Designing impact and engineering beauty",
  },
};
