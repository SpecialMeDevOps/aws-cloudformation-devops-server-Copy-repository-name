#!/bin/sh
set -eu

prometheus_url="${PROMETHEUS_URL:-http://127.0.0.1:9090}"
grafana_url="${GRAFANA_URL:-http://127.0.0.1:3001}"
targets_file="$(mktemp)"
diagnostics_file="$(mktemp)"
trap 'rm -f "$targets_file" "$diagnostics_file"' EXIT HUP INT TERM

curl --fail --silent --show-error "$prometheus_url/-/ready" >/dev/null

attempt=0
while [ "$attempt" -lt 12 ]; do
  curl --fail --silent --show-error "$prometheus_url/api/v1/targets?state=active" --output "$targets_file"
  if node - "$targets_file" >"$diagnostics_file" 2>&1 <<'NODE'
const fs = require('node:fs');

const response = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
if (response.status !== 'success') {
  console.error('Prometheus did not return a successful targets response.');
  process.exit(1);
}

const targets = response.data.activeTargets;
const expectedJobs = ['backend', 'application-probes', 'cadvisor'];
const missingJobs = expectedJobs.filter(
  (job) => !targets.some((target) => target.labels.job === job),
);
const downTargets = targets.filter((target) => target.health !== 'up');

if (missingJobs.length > 0 || downTargets.length > 0) {
  if (missingJobs.length > 0) {
    console.error(`Missing Prometheus scrape jobs: ${missingJobs.join(', ')}`);
  }
  for (const target of downTargets) {
    console.error(`Prometheus target is ${target.health}: ${target.labels.job}`);
  }
  process.exit(1);
}

console.log(`Prometheus is scraping ${targets.length} active targets successfully.`);
NODE
  then
    cat "$diagnostics_file"
    curl --fail --silent --show-error "$grafana_url/api/health" >/dev/null
    printf '%s\n' 'Grafana health check passed.'
    exit 0
  fi
  attempt=$((attempt + 1))
  sleep 5
done

cat "$diagnostics_file" >&2
printf '%s\n' 'Monitoring stack did not become healthy within 60 seconds.' >&2
exit 1
