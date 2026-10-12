"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { type FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import {
  createDemoSession,
  generateOtpCode,
  getDemoState,
  isValidEmail,
  saveDemoState,
  type Role,
} from "../lib/platform-data";

const quickRoles: Array<{ label: string; value: Role; email: string; name: string }> = [
  { label: "Client", value: "client", email: "alex@cityblock.io", name: "Alex Morgan" },
  { label: "Team", value: "team", email: "nina@talenthouse.dev", name: "Nina Flores" },
  { label: "Creator", value: "admin", email: "miranda@ityourhouse.dev", name: "Miranda Lee" },
];

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedRole = searchParams.get("role");
  const initialRole: Role = requestedRole === "client" || requestedRole === "team" || requestedRole === "admin" ? requestedRole : "client";
  const [name, setName] = useState("Alex Morgan");
  const [email, setEmail] = useState("alex@cityblock.io");
  const [role, setRole] = useState<Role>(initialRole);
  const [otpCode, setOtpCode] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Demo mode: send a six-digit verification code.");

  const currentState = useMemo(() => getDemoState(), []);

  useEffect(() => {
    if (currentState.session) {
      router.replace("/dashboard");
    }
  }, [currentState.session, router]);

  const handleSendOtp = () => {
    if (!name.trim() || !email.trim()) {
      setError("Please enter your full name and email.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Use a valid email address to receive the demo OTP.");
      return;
    }

    const code = generateOtpCode();
    setDemoOtp(code);
    setError("");
    setNotice(`Demo OTP generated for ${email}: ${code}. Use it to continue.`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("This email is invalid.");
      return;
    }

    if (!demoOtp) {
      setError("Generate an OTP before logging in.");
      return;
    }

    if (otpCode.trim() !== demoOtp) {
      setError("The OTP does not match. Review the demo code and try again.");
      return;
    }

    const currentState = getDemoState();
    const session = createDemoSession(role, email, name);
    saveDemoState({ ...currentState, session });
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),transparent_25%),#020817] px-4 py-10 text-slate-50 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-lg font-black text-slate-950">
              IT
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-cyan-300">IT Your</div>
              <div className="text-lg font-semibold text-white">IT House</div>
            </div>
          </Link>

          <Link href="/" className="text-sm font-medium text-slate-300 transition hover:text-white">
            Back to home
          </Link>
        </header>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_30px_80px_rgba(6,182,212,0.15)]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-200">
              <ShieldCheck className="h-4 w-4" />
              Secure demo access
            </div>

            <h1 className="text-3xl font-black tracking-[-0.05em] text-white md:text-4xl">
              Access your workspace
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
              Sign in with a demo email OTP and enter the role-specific dashboard designed for clients, team members, and administrators.
            </p>

            <div className="mt-8 space-y-4">
              {quickRoles.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setRole(item.value);
                    setName(item.name);
                    setEmail(item.email);
                    setError("");
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    role === item.value
                      ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-cyan-500/40"
                  }`}
                >
                  <div>
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-xs text-slate-400">{item.email}</div>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Full name</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
                  placeholder="Jane Smith"
                  type="text"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Email address</label>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
                  placeholder="name@company.com"
                  type="email"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Workspace role</label>
                <div className="flex gap-2">
                  {(["client", "team", "admin"] as Role[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setRole(item)}
                      className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                        role === item
                          ? "bg-cyan-500 text-slate-950"
                          : "border border-white/10 bg-slate-900 text-slate-200 hover:border-cyan-500/40"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-cyan-200">
                    <KeyRound className="h-5 w-5" />
                    <span className="font-medium">Email OTP</span>
                  </div>
                  <button type="button" onClick={handleSendOtp} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-500/20">
                    Send code
                  </button>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-200">Verification code</label>
                  <input
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value.replace(/[^\d]/g, ""))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
                    placeholder="123456"
                    inputMode="numeric"
                    maxLength={6}
                  />
                </div>
              </div>

              {notice ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-200">
                  {notice}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:brightness-110"
              >
                Enter workspace
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-slate-300">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              Demo mode is clearly labelled and stores session data only in the browser for local testing.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-50" /> }>
      <LoginForm />
    </Suspense>
  );
}
