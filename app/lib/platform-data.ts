export type Role = "client" | "team" | "admin";

export interface DemoSession {
  name: string;
  email: string;
  role: Role;
}

export interface DemoProject {
  id: string;
  title: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  budget: number;
  deadline: string;
  summary: string;
  status: "New" | "Reviewing" | "Approved" | "In progress" | "Delivered";
  skills: string[];
  attachments: string[];
  assignee?: string;
}

export interface DemoTeamMember {
  name: string;
  role: string;
  availability: "Available" | "In sprint" | "Booked";
  skills: string[];
  location: string;
}

export interface DemoNotification {
  id: string;
  title: string;
  message: string;
  tone: "info" | "success" | "warning";
}

export const STORAGE_KEY = "it-your-it-house-demo";

export const teamMembers: DemoTeamMember[] = [
  {
    name: "Ava Chen",
    role: "Product Lead",
    availability: "Available",
    skills: ["Product strategy", "Discovery", "Roadmapping"],
    location: "Remote · APAC",
  },
  {
    name: "Noah Silva",
    role: "Platform Engineer",
    availability: "In sprint",
    skills: ["Next.js", "Infrastructure", "CI/CD"],
    location: "Remote · US",
  },
  {
    name: "Mila Hassan",
    role: "Security Analyst",
    availability: "Available",
    skills: ["AppSec", "Threat modeling", "SOC"],
    location: "Hybrid · EU",
  },
  {
    name: "Leo Hart",
    role: "Full Stack Developer",
    availability: "Booked",
    skills: ["TypeScript", "React", "Node.js"],
    location: "Remote · EU",
  },
];

export const seedProjects: DemoProject[] = [
  {
    id: "proj-1001",
    title: "Client Portal Refresh",
    category: "Web application",
    priority: "High",
    budget: 9500,
    deadline: "2026-11-10",
    summary: "Modernize the client portal with role-based workspaces, milestone tracking, and secure document delivery.",
    status: "Approved",
    skills: ["Next.js", "UX", "Security"],
    attachments: ["requirements.pdf", "brand-board.ai"],
    assignee: "Ava Chen",
  },
  {
    id: "proj-1002",
    title: "Ops Automation Suite",
    category: "Automation",
    priority: "Urgent",
    budget: 16000,
    deadline: "2026-10-24",
    summary: "Automate onboarding, approvals, and reporting workflows between client, project, and internal systems.",
    status: "Reviewing",
    skills: ["Automation", "Node.js", "Integrations"],
    attachments: ["workflow-map.pdf"],
  },
  {
    id: "proj-1003",
    title: "Security Hardening Sprint",
    category: "Cybersecurity",
    priority: "High",
    budget: 7600,
    deadline: "2026-10-18",
    summary: "Harden the platform against session abuse, broken access control, and dependency exposure.",
    status: "In progress",
    skills: ["Security", "Auditing", "Monitoring"],
    attachments: ["security-report.pdf"],
    assignee: "Mila Hassan",
  },
];

export const seedNotifications: DemoNotification[] = [
  {
    id: "note-01",
    title: "New client request",
    message: "The Client Portal Refresh request was received and matched to 3 eligible team members.",
    tone: "info",
  },
  {
    id: "note-02",
    title: "Security review",
    message: "Security hardening tasks are ready for admin signoff before deployment.",
    tone: "success",
  },
  {
    id: "note-03",
    title: "Deadline alert",
    message: "Ops automation work is approaching a critical delivery milestone in 4 days.",
    tone: "warning",
  },
];

export function calculateMatchScore(teamSkills: string[], projectSkills: string[]) {
  const normalizedTeam = new Set(teamSkills.map((skill) => skill.toLowerCase()));
  const normalizedProject = projectSkills.map((skill) => skill.toLowerCase());
  const overlap = normalizedProject.filter((skill) => normalizedTeam.has(skill)).length;
  const directMatch = (overlap / Math.max(normalizedProject.length, 1)) * 70;
  const bonus = Math.min(normalizedTeam.size / 8, 1) * 30;
  return Math.min(100, Math.round(directMatch + bonus));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function getDemoState() {
  if (typeof window === "undefined") {
    return {
      session: null,
      projects: seedProjects,
      notifications: seedNotifications,
      teamMembers,
    };
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        session: null,
        projects: seedProjects,
        notifications: seedNotifications,
        teamMembers,
      };
    }

    return JSON.parse(stored) as {
      session: DemoSession | null;
      projects: DemoProject[];
      notifications: DemoNotification[];
      teamMembers: DemoTeamMember[];
    };
  } catch {
    return {
      session: null,
      projects: seedProjects,
      notifications: seedNotifications,
      teamMembers,
    };
  }
}

export function saveDemoState(
  state: {
    session: DemoSession | null;
    projects: DemoProject[];
    notifications: DemoNotification[];
    teamMembers: DemoTeamMember[];
  },
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function createDemoSession(role: Role, email: string, name: string): DemoSession {
  return {
    role,
    email: email.trim(),
    name: name.trim() || email.split("@")[0],
  };
}
