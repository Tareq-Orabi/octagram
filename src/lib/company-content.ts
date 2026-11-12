/** Company copy. Project facts and team records live in site-config.ts. */
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

/** Short, direct introductions; detailed project records remain intact. */
export const companyContent: CompanyContent = {
  "brand": {
    "name": "OCTAGRAM",
    "tagline": "Designing Impact. Engineering Beauty.",
    "portfolioLabel": "INDEPENDENT TEAM · JORDAN",
    "year": 2026,
    "disciplineLine": "Software · Design · AI",
    "heroTitle": "We turn complex ideas into software people enjoy using."
  },
  "about": {
    "label": "ABOUT US",
    "title": "A small team. A shared way of thinking.",
    "paragraphs": [
      "We're a software team from Jordan. We build websites, platforms, and tools that make everyday work easier.",
      "Designers and engineers work together from the start, asking questions, testing ideas, and paying attention to the details people notice.",
      "Behind each interface, we plan the systems that keep it running: clear architecture, useful integrations, and room to grow.",
      "Our work spans healthcare, education, coaching, and the ideas we're exploring next."
    ],
    "closing": "Thoughtful design. Solid engineering."
  },
  "vision": {
    "label": "OUR VISION",
    "title": "Useful today. Ready for tomorrow.",
    "paragraphs": [
      "We want to build products that people keep coming back to—because they solve something that matters.",
      "For us, progress means making technology clearer, more useful, and easier to live with."
    ]
  },
  "mission": {
    "label": "WHAT MATTERS",
    "title": "Make the complicated feel simple.",
    "paragraphs": [
      "A busy clinic. A student preparing for exams. A coach managing clients. We start with the people doing the work, then build around what they need."
    ],
    "principlesIntro": "The principles we work by:",
    "principles": [
      {
        "title": "Build it well",
        "description": "Reliable systems that are easy to maintain."
      },
      {
        "title": "Know the purpose",
        "description": "Technical choices that serve the actual goal."
      },
      {
        "title": "Think about people",
        "description": "Clear interfaces and fewer unnecessary steps."
      },
      {
        "title": "Keep learning",
        "description": "New technology, tested against real needs."
      },
      {
        "title": "Plan for change",
        "description": "Room to improve as the work grows."
      }
    ]
  },
  "services": {
    "label": "OCTAGRAM",
    "title": "Our Services.",
    "paragraphs": [],
    "items": [
      {
        "id": "web-development",
        "number": "01",
        "title": "Web Development",
        "offerings": [
          "Landing Pages",
          "Business & Corporate Websites",
          "Advanced CMS Websites",
          "E-Commerce Websites",
          "Custom Web Platforms"
        ]
      },
      {
        "id": "mobile-development",
        "number": "02",
        "title": "Mobile App Development",
        "offerings": [
          "Android Applications",
          "iOS Applications",
          "MVP Development",
          "Business Applications",
          "Custom Mobile Applications"
        ]
      },
      {
        "id": "custom-software",
        "number": "03",
        "title": "Custom Software & Management Systems",
        "offerings": [
          "Internal Management Systems",
          "Customer Relationship Management (CRM)",
          "Booking & Reservation Systems",
          "Operations Management Systems",
          "Employee Management Systems",
          "Inventory & Order Management",
          "Custom Enterprise Software"
        ]
      },
      {
        "id": "ai-automation",
        "number": "04",
        "title": "AI & Automation",
        "offerings": [
          "AI Chatbots",
          "AI Assistants",
          "Custom AI Solutions",
          "Workflow Automation",
          "Business Process Automation",
          "Intelligent System Integration"
        ]
      },
      {
        "id": "ui-ux-design",
        "number": "05",
        "title": "UI/UX Design",
        "offerings": [
          "Website UI/UX Design",
          "Mobile App UI/UX Design",
          "Landing Page Design",
          "Dashboard UI/UX Design",
          "User Experience Optimization"
        ]
      },
      {
        "id": "api-integration",
        "number": "06",
        "title": "API & System Integration",
        "offerings": [
          "API Integration",
          "Payment Gateway Integration",
          "WhatsApp Integration",
          "SMS Integration",
          "Third-Party Services Integration",
          "Multi-System Integration"
        ]
      },
      {
        "id": "server-deployment",
        "number": "07",
        "title": "Server & Deployment Services",
        "offerings": [
          "Server Setup & Configuration",
          "Web Hosting Setup",
          "Application Deployment",
          "Server Environment Configuration"
        ]
      },
      {
        "id": "support-maintenance",
        "number": "08",
        "title": "Technical Support & Maintenance",
        "offerings": [
          "Technical Support",
          "Software Maintenance",
          "System Updates",
          "Ongoing Technical Monitoring",
          "Technical Issue Resolution"
        ]
      }
    ]
  },
  "projectsIntro": {
    "label": "OUR PROJECTS",
    "title": "Built for the real world.",
    "paragraphs": [
      "Client work and products in development, across healthcare, learning, and coaching. Explore a card to see what goes into it."
    ]
  },
  "products": {
    "label": "IN THE MAKING",
    "title": "What we're working on next.",
    "paragraphs": [
      "Alongside client work, we're exploring our own products in education and healthcare. These are still in development."
    ],
    "items": [
      {
        "id": "think",
        "name": "THINK",
        "title": "A more connected way to learn.",
        "industry": "Educational Technology",
        "category": "Product Vision & Development Initiative",
        "paragraphs": [
          "THINK brings our education ideas together: organized resources, personal learning tools, and intelligent assistance.",
          "We're exploring how students and institutions could use these tools in one connected place."
        ],
        "visionAreas": [
          "Connected learning environments",
          "Personalized educational experiences",
          "Intelligent academic assistance",
          "Organized academic resources",
          "Learning progress and insights",
          "Institutional digital learning solutions"
        ],
        "ambition": "Make learning tools easier to access and more adaptable to different needs.",
        "status": "Product initiative under development."
      },
      {
        "id": "octacare",
        "name": "OCTACARE",
        "title": "Better connections in healthcare.",
        "industry": "Healthcare Technology",
        "category": "Product Vision & Development Initiative",
        "paragraphs": [
          "OctaCare explores how software can connect healthcare services, patients, and the teams behind them.",
          "We're looking at everyday workflows to understand where a more connected experience would help."
        ],
        "visionAreas": [
          "Connected healthcare experiences",
          "Healthcare management workflows",
          "Patient-centered digital services",
          "Intelligent healthcare software capabilities",
          "Integrated health technology solutions"
        ],
        "ambition": "Build practical tools that help healthcare services work together.",
        "status": "Product initiative under development."
      }
    ]
  },
  "approach": {
    "label": "HOW WE WORK",
    "title": "From the first conversation to launch.",
    "paragraphs": [
      "We ask questions before writing code, work in clear stages, and keep you involved as the product takes shape."
    ],
    "stages": [
      {
        "number": "01",
        "title": "Listen & understand",
        "description": "Your goals, your users, and the problem to solve."
      },
      {
        "number": "02",
        "title": "Plan the system",
        "description": "Workflows, architecture, and a practical order of work."
      },
      {
        "number": "03",
        "title": "Design & build",
        "description": "Interfaces and engineering developed together, one step at a time."
      },
      {
        "number": "04",
        "title": "Test & refine",
        "description": "Check the important journeys, performance, and reliability."
      },
      {
        "number": "05",
        "title": "Launch & improve",
        "description": "Prepare for real use, then plan the next improvements together."
      }
    ],
    "closing": "Understand it. Build it. Keep improving it."
  },
  "teamIntro": {
    "label": "OUR TEAM",
    "title": "The people building it.",
    "paragraphs": [
      "Four different strengths, one shared project. Meet the people behind the design, engineering, and decisions at Octagram."
    ],
    "closing": "Different skills. One team."
  },
  "whyOctagram": {
    "label": "WORKING TOGETHER",
    "title": "Good work needs a good working relationship.",
    "paragraphs": [
      "Here's what we bring to the table, from the first question to the final detail."
    ],
    "reasons": [
      {
        "title": "Solid foundations",
        "description": "We think about structure, reliability, and the person maintaining the code later."
      },
      {
        "title": "Built around your work",
        "description": "Your workflows shape the software and the priorities."
      },
      {
        "title": "One connected team",
        "description": "Design, frontend, backend, and AI expertise work together."
      },
      {
        "title": "The whole experience",
        "description": "We connect the small details to the bigger picture."
      },
      {
        "title": "Direct conversations",
        "description": "Clear questions, honest feedback, and decisions you can follow."
      },
      {
        "title": "Curiosity with purpose",
        "description": "We explore new ideas when they can make the product better."
      }
    ],
    "closing": "Let's build something worth using."
  },
  "contact": {
    "label": "LET’S TALK",
    "title": "What are you thinking about?",
    "paragraphs": [
      "Tell us what you're working on, what feels difficult, or what you'd like to make possible. We'll take it from there.",
      "We work with businesses, institutions, and partners on software, digital platforms, and new product ideas."
    ],
    "collaborationIntro": "We can help with:",
    "collaborationAreas": [
      "Custom software engineering",
      "Web and digital platform development",
      "Healthcare and educational technology",
      "Artificial intelligence and automation",
      "Digital product development",
      "Technology partnerships",
      "Digital transformation initiatives"
    ],
    "closing": "An idea is a good place to start.",
    "website": "https://octagramjo.com/",
    "instagram": "https://www.instagram.com/octagram.jo/",
    "instagramLabel": "@Octagram.jo",
    "location": "Jordan"
  },
  "closing": {
    "lead": "An idea becomes useful",
    "headline": "when someone builds it.",
    "brand": "OCTAGRAM",
    "tagline": "Designing Impact. Engineering Beauty."
  }
};
