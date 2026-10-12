"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Code2,
  Cpu,
  Lock,
  MessageSquareText,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Platform", href: "#platform" },
  { label: "Projects", href: "#projects" },
  { label: "Security", href: "#security" },
  { label: "Talent", href: "#talent" },
  { label: "Insights", href: "#insights" },
];

const stats = [
  { label: "Live projects", value: "124" },
  { label: "Active clients", value: "48" },
  { label: "Avg. response", value: "2.4h" },
  { label: "Uptime", value: "99.98%" },
];

const services = [
  "Product Strategy",
  "Web & Mobile Apps",
  "Cloud Architecture",
  "AI Automation",
  "Cybersecurity",
  "DevOps",
];

const pipelines = [
  { icon: Briefcase, label: "Discovery", status: "Complete" },
  { icon: Code2, label: "Build", status: "Live" },
  { icon: Shield, label: "Security", status: "Verified" },
  { icon: TrendingUp, label: "Launch", status: "On track" },
];

const team = [
  { name: "Ava Chen", role: "Product Lead", availability: "Available" },
  { name: "Noah Silva", role: "Platform Engineer", availability: "In sprint" },
  { name: "Mila Hassan", role: "Security Analyst", availability: "Available" },
];

const activity = [
  "Client onboarding scheduled for 2:00 PM",
  "AI agent processed sprint health check",
  "Deployment pipeline passed QA gates",
  "New team member accepted a product role",
];

const roles = [
  {
    title: "Client Workspace",
    description: "Track requirements, files, milestones, delivery progress, and communication in one place.",
    icon: Users,
  },
  {
    title: "Team Matchmaking",
    description: "Qualified talent gets matched to projects based on availability, skills, and project fit.",
    icon: Sparkles,
  },
  {
    title: "Creator Command Center",
    description: "Control project approvals, assignments, AI insights, team capacity, and operational health.",
    icon: Cpu,
  },
];

const securityStack = ["SAST", "Dependency scanning", "Secrets management", "Rate limiting", "Audit logs"];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_25%),radial-gradient(circle_at_right,_rgba(168,85,247,0.2),_transparent_22%),#020817] text-slate-50">
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-6 lg:px-8">
        <header className="sticky top-0 z-20 mb-8 rounded-full border border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-lg font-black shadow-lg shadow-cyan-500/30">
                IT
              </div>
              <div>
                <div className="text-sm uppercase tracking-[0.35em] text-cyan-300">IT Your</div>
                <div className="text-lg font-semibold">IT House</div>
              </div>
            </div>

            <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href} className="transition hover:text-white">
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button className="rounded-full border border-white/10 p-2 text-slate-200 transition hover:border-cyan-400/40 hover:text-white" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </button>
              <Link
                href="/login"
                className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
              >
                Login
              </Link>
            </div>
          </div>
        </header>

        <section id="platform" className="grid items-center gap-10 pb-12 pt-6 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-cyan-200">
              <Zap className="h-3.5 w-3.5" />
              Living digital operations
            </div>

            <div className="space-y-5">
              <h1 className="max-w-xl text-5xl font-black leading-[0.96] tracking-[-0.06em] text-white md:text-6xl">
                The digital IT company your projects can feel inside.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-300">
                Experience a real client workspace, real team coordination, and live infrastructure visibility from one immersive platform built for modern digital delivery.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/login?role=client"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:brightness-110"
              >
                Book a consult
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View live dashboard
              </Link>
            </div>

            <div className="grid max-w-xl gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-cyan-500/25 via-indigo-500/10 to-fuchsia-500/25 blur-3xl" />
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-5 shadow-[0_30px_80px_rgba(6,182,212,0.15)] backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Mission control</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Project status</h2>
                </div>
                <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  Stable
                </div>
              </div>

              <div className="space-y-4">
                {pipelines.map(({ icon: Icon, label, status }, idx) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${idx % 2 === 0 ? "bg-cyan-500/15 text-cyan-300" : "bg-indigo-500/15 text-indigo-300"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{label}</div>
                        <div className="text-xs text-slate-400">#{idx + 1} workflow</div>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200">
                      <CircleDashed className="h-3.5 w-3.5 text-cyan-300" />
                      {status}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-cyan-100">Delivery health</p>
                  <span className="text-sm font-semibold text-cyan-300">92%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="projects" className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Capabilities</p>
                <h3 className="mt-2 text-2xl font-bold text-white">From strategy to secure launch</h3>
              </div>
              <Link href="/dashboard?role=client" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300">
                Explore services <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              {services.map((service) => (
                <div key={service} className="rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-sm text-slate-200">
                  {service}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 p-6">
            <div className="mb-4 flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.3em]">Operational status</span>
            </div>
            <div className="space-y-4 text-sm text-slate-200">
              {activity.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-emerald-500/10 bg-black/10 p-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-3">
          {roles.map(({ title, description, icon: Icon }) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 text-cyan-300">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
              <p className="text-sm leading-7 text-slate-300">{description}</p>
            </motion.article>
          ))}
        </section>

        <section id="security" className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Security</p>
                <h3 className="text-xl font-bold text-white">DevSecOps by default</h3>
              </div>
            </div>

            <div className="space-y-3">
              {securityStack.map((item) => (
                <div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  <span>{item}</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">Enabled</span>
                </div>
              ))}
            </div>
          </div>

          <div id="talent" className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Team</p>
                <h3 className="mt-2 text-2xl font-bold text-white">Available specialists</h3>
              </div>
              <Link href="/dashboard?role=team" className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-500/40 hover:text-white">
                View roster
              </Link>
            </div>

            <div className="space-y-3">
              {team.map(({ name, role, availability }) => (
                <div key={name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-bold text-white">
                      {name.split(" ").map((part) => part[0]).join("")}
                    </div>
                    <div>
                      <div className="font-medium text-white">{name}</div>
                      <div className="text-sm text-slate-400">{role}</div>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                    {availability}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="insights" className="mt-12 rounded-[2rem] border border-white/10 bg-slate-950/60 p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Insights</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Operational intelligence</h3>
            </div>
            <Link href="/dashboard?role=admin" className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
              Open command center
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Retention</p>
              <div className="mt-3 text-3xl font-bold text-white">96.4%</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Match quality</p>
              <div className="mt-3 text-3xl font-bold text-white">91%</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Release confidence</p>
              <div className="mt-3 text-3xl font-bold text-white">A+</div>
            </div>
          </div>
        </section>

        <footer className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-slate-400 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-black text-slate-950">
              IT
            </div>
            <span>IT Your IT House</span>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">
            <MessageSquareText className="h-3.5 w-3.5" />
            Connect • Build • Grow
          </div>
        </footer>
      </div>
    </main>
  );
}
