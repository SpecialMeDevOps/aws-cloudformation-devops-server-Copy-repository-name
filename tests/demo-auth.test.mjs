import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateMatchScore,
  createDemoSession,
  generateOtpCode,
  isValidEmail,
} from "../app/lib/platform-data.ts";

test("validates email addresses and demo OTP format", () => {
  assert.equal(isValidEmail("hello@example.com"), true);
  assert.equal(isValidEmail("invalid-email"), false);

  const otp = generateOtpCode();
  assert.equal(typeof otp, "string");
  assert.equal(otp.length, 6);
  const asNumber = Number.parseInt(otp, 10);
  assert.equal(Number.isNaN(asNumber), false);
  assert.ok(asNumber >= 100000 && asNumber <= 999999);
});

test("creates a demo session for each role", () => {
  const clientSession = createDemoSession("client", "client@example.com", "Client User");
  const teamSession = createDemoSession("team", "team@example.com", "Team User");
  const adminSession = createDemoSession("admin", "admin@example.com", "Admin User");

  assert.equal(clientSession.role, "client");
  assert.equal(teamSession.role, "team");
  assert.equal(adminSession.role, "admin");
  assert.equal(clientSession.name, "Client User");
});

test("scores team matches deterministically", () => {
  assert.equal(calculateMatchScore(["Next.js", "React", "UX"], ["Next.js", "UX"]), 81);
  assert.equal(calculateMatchScore(["Security", "Auditing"], ["Security", "Monitoring"]), 43);
});
