"use client";

import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  FileText,
  LogOut,
  MessageSquareText,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateMatchScore,
  formatCurrency,
  getDemoState,
  saveDemoState,
  teamMembers,
  type DemoNotification,
  type DemoProject,
  type DemoSession,
  type Role,
} from "../lib/platform-data";

const roleLabels: Record<Role, string> = {
  client: "Client workspace",
  team: "Team member workspace",
  admin: "Creator / Admin center",
};

const defaultProjectForm = {
  title: "",
  summary: "",
  category: "Web application",
  skills: "Next.js, design systems, automation",
  budget: "6000",
  deadline: "",
  priority: "High",
};

export default function DashboardPage() {
  const router = useRouter();
  const initialState = useMemo(() => getDemoState(), []);
  const [session] = useState<DemoSession | null>(initialState.session);
  const [renderRole, setRenderRole] = useState<Role>(initialState.session?.role ?? "client");
  const [projects, setProjects] = useState<DemoProject[]>(initialState.projects);
  const [notifications, setNotifications] = useState<DemoNotification[]>(initialState.notifications);
  const [projectForm, setProjectForm] = useState(defaultProjectForm);
  const [projectError, setProjectError] = useState("");
  const notificationIdRef = useRef(1);
  const projectIdRef = useRef(1);

  useEffect(() => {
    if (!session) {
      router.replace("/login");
    }
  }, [router, session]);

  const projectMatches = useMemo(
    () =>
      projects.map((project) => ({
        project,
        members: teamMembers
          .map((member) => ({
            ...member,
            score: calculateMatchScore(member.skills, project.skills),
          }))
          .sort((left, right) => right.score - left.score),
      })),
    [projects],
  );

  const refreshState = (nextProjects: DemoProject[], nextNotifications = notifications) => {
    const nextState = getDemoState();
    const patchedState = { ...nextState, projects: nextProjects, notifications: nextNotifications };
    saveDemoState(patchedState);
    setProjects(nextProjects);
    setNotifications(nextNotifications);
  };

  const handleLogout = () => {
    const nextState = getDemoState();
    saveDemoState({ ...nextState, session: null });
    router.push("/login");
  };

  const handleProjectCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!projectForm.title.trim() || !projectForm.summary.trim() || !projectForm.deadline) {
      setProjectError("Project title, requirements, and deadline are required.");
      return;
    }

    const nextProjectId = `proj-${projectIdRef.current}`;
    projectIdRef.current += 1;

    const nextProject: DemoProject = {
      id: nextProjectId,
      title: projectForm.title.trim(),
      category: projectForm.category,
      priority: projectForm.priority as DemoProject["priority"],
      budget: Number(projectForm.budget) || 0,
      deadline: projectForm.deadline,
      summary: projectForm.summary.trim(),
      status: "New",
      skills: projectForm.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      attachments: ["brief.pdf"],
    };

    const nextProjects = [nextProject, ...projects];
    const nextNotificationId = `note-${notificationIdRef.current}`;
    notificationIdRef.current += 1;

    const nextNotifications: DemoNotification[] = [
      {
        id: nextNotificationId,
        title: "Project request created",
        message: `${nextProject.title} was submitted and is now visible to the matching queue.`,
        tone: "success",
      },
      ...notifications,
    ].slice(0, 6) as DemoNotification[];

    refreshState(nextProjects, nextNotifications);
    setProjectForm(defaultProjectForm);
    setProjectError("");
  };

  const handleOpportunityAction = (projectId: string, action: "accept" | "decline") => {
    const nextProjects: DemoProject[] = projects.map((project) =>
      project.id === projectId
        ? {
            ...project,
            status: action === "accept" ? "In progress" : "Reviewing",
            assignee: action === "accept" ? "Noah Silva" : undefined,
          }
        : project,
    );

    const nextNotificationId = `note-${notificationIdRef.current}`;
    notificationIdRef.current += 1;

    const nextNotifications: DemoNotification[] = [
      {
        id: nextNotificationId,
        title: action === "accept" ? "Opportunity accepted" : "Opportunity declined",
        message:
          action === "accept"
            ? "You accepted the project and it is now in your delivery queue."
            : "You declined the project and it has been returned to the review pool.",
        tone: action === "accept" ? "success" : "warning",
      },
      ...notifications,
    ].slice(0, 6) as DemoNotification[];

    refreshState(nextProjects, nextNotifications);
  };

  const handleProjectReview = (projectId: string, action: "approve" | "assign") => {
    const nextProjects: DemoProject[] = projects.map((project) => {
      if (project.id !== projectId) {
        return project;
      }

      if (action === "approve") {
        return { ...project, status: "Approved" } as DemoProject;
      }

      return { ...project, status: "In progress", assignee: "Ava Chen" } as DemoProject;
    });

    const nextNotificationId = `note-${notificationIdRef.current}`;
    notificationIdRef.current += 1;

    const nextNotifications: DemoNotification[] = [
      {
        id: nextNotificationId,
        title: action === "approve" ? "Project approved" : "Project assigned",
        message:
          action === "approve"
            ? "The project has moved into the approved queue and matching is live."
            : "The project has been assigned to the recommended lead for active delivery.",
        tone: "info",
      },
      ...notifications,
    ].slice(0, 6) as DemoNotification[];

    refreshState(nextProjects, nextNotifications);
  };

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_25%),#020817] px-4 py-6 text-slate-50 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-full border border-white/10 bg-slate-950/70 p-3 backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-lg font-black text-slate-950">
                IT
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-cyan-300">IT Your</div>
                <div className="text-lg font-semibold">IT House</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {(["client", "team", "admin"] as Role[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRenderRole(role)}
                  className={`rounded-full px-3 py-2 text-sm font-medium capitalize transition ${
                    renderRole === role
                      ? "bg-cyan-500 text-slate-950"
                      : "border border-white/10 bg-white/5 text-slate-200 hover:border-cyan-500/40"
                  }`}
                >
                  {roleLabels[role]}
                </button>
              ))}

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-500/40 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Welcome back</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">{session.name}</h1>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100">
            <Shield className="h-4 w-4" />
            {roleLabels[session.role]} · Demo mode
          </div>
        </div>

        {renderRole === "client" && (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Client workspace</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Submit a new project request</h2>
                </div>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                  Project intake open
                </div>
              </div>

              <form onSubmit={handleProjectCreate} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm text-slate-200">
                    <span className="mb-2 block">Project title</span>
                    <input
                      value={projectForm.title}
                      onChange={(event) => setProjectForm({ ...projectForm, title: event.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-500/50"
                      placeholder="Client portal refresh"
                    />
                  </label>

                  <label className="block text-sm text-slate-200">
                    <span className="mb-2 block">Service category</span>
                    <select
                      value={projectForm.category}
                      onChange={(event) => setProjectForm({ ...projectForm, category: event.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-500/50"
                    >
                      <option>Web application</option>
                      <option>Automation</option>
                      <option>Cybersecurity</option>
                      <option>Strategy</option>
                    </select>
                  </label>
                </div>

                <label className="block text-sm text-slate-200">
                  <span className="mb-2 block">Project requirements</span>
                  <textarea
                    value={projectForm.summary}
                    onChange={(event) => setProjectForm({ ...projectForm, summary: event.target.value })}
                    className="min-h-[110px] w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-500/50"
                    placeholder="Outline the business goals, blockers, and expected outcomes."
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm text-slate-200">
                    <span className="mb-2 block">Required skills</span>
                    <input
                      value={projectForm.skills}
                      onChange={(event) => setProjectForm({ ...projectForm, skills: event.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-500/50"
                      placeholder="Next.js, UX, security"
                    />
                  </label>

                  <label className="block text-sm text-slate-200">
                    <span className="mb-2 block">Budget</span>
                    <input
                      value={projectForm.budget}
                      onChange={(event) => setProjectForm({ ...projectForm, budget: event.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-500/50"
                      placeholder="7500"
                      type="number"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm text-slate-200">
                    <span className="mb-2 block">Deadline</span>
                    <input
                      value={projectForm.deadline}
                      onChange={(event) => setProjectForm({ ...projectForm, deadline: event.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-500/50"
                      type="date"
                    />
                  </label>

                  <label className="block text-sm text-slate-200">
                    <span className="mb-2 block">Priority</span>
                    <select
                      value={projectForm.priority}
                      onChange={(event) => setProjectForm({ ...projectForm, priority: event.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-500/50"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </label>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-slate-950/60 p-4 text-sm text-slate-300">
                  <FileText className="h-4 w-4 text-cyan-300" />
                  <input type="file" multiple className="w-full text-sm text-slate-300" />
                </label>

                {projectError ? (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{projectError}</div>
                ) : null}

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:brightness-110"
                >
                  Save project request
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </form>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Status</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Project queue</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  {projects.length} active
                </div>
              </div>

              <div className="space-y-4">
                {projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-white">{project.title}</h3>
                      <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-200">
                        {project.status}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-300">{project.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                      <span className="rounded-full bg-slate-900/80 px-2 py-1">{project.category}</span>
                      <span className="rounded-full bg-slate-900/80 px-2 py-1">{formatCurrency(project.budget)}</span>
                      <span className="rounded-full bg-slate-900/80 px-2 py-1">{project.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {renderRole === "team" && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Team member</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Open opportunities</h2>
                </div>
                <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                  Match-ready
                </div>
              </div>

              <div className="space-y-4">
                {projectMatches.map(({ project, members }) => (
                  <div key={project.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{project.title}</h3>
                        <p className="mt-1 text-sm text-slate-300">{project.summary}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpportunityAction(project.id, "accept")}
                          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpportunityAction(project.id, "decline")}
                          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-500/40"
                        >
                          Decline
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                      {project.skills.map((skill) => (
                        <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 space-y-2">
                      {members.slice(0, 2).map((member) => (
                        <div key={member.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                          <div>
                            <div className="font-medium text-white">{member.name}</div>
                            <div className="text-xs text-slate-400">{member.role}</div>
                          </div>
                          <div className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-200">
                            {member.score}% fit
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Profile</p>
                  <h2 className="mt-1 text-xl font-bold text-white">Availability</h2>
                </div>
              </div>

              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.name} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-medium text-white">{member.name}</div>
                        <div className="text-xs text-slate-400">{member.role}</div>
                      </div>
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-emerald-200">
                        {member.availability}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}

        {renderRole === "admin" && (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Admin</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Approval queue</h2>
                </div>
                <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                  Ready for review
                </div>
              </div>

              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-white">{project.title}</h3>
                        <p className="mt-1 text-sm text-slate-300">{project.summary}</p>
                      </div>
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200">
                        {project.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                      <span className="rounded-full bg-slate-900/80 px-2 py-1">{project.category}</span>
                      <span className="rounded-full bg-slate-900/80 px-2 py-1">{project.priority}</span>
                      <span className="rounded-full bg-slate-900/80 px-2 py-1">{formatCurrency(project.budget)}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleProjectReview(project.id, "approve")}
                        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProjectReview(project.id, "assign")}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-500/40"
                      >
                        Assign lead
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Analytics</p>
                  <h2 className="mt-1 text-xl font-bold text-white">Command center</h2>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Delivery health</p>
                  <div className="mt-2 text-3xl font-black text-white">92%</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Active workload</p>
                  <div className="mt-2 text-3xl font-black text-white">14</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Alerts</p>
                  <div className="mt-2 text-xl font-bold text-amber-200">3 items need review</div>
                </div>
              </div>
            </aside>
          </div>
        )}

        <footer className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-slate-400 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-black text-slate-950">
              IT
            </div>
            <span>IT Your IT House</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">
              <Bell className="h-3.5 w-3.5" />
              {notifications.length} notifications
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">
              <MessageSquareText className="h-3.5 w-3.5" />
              Messages 12
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
