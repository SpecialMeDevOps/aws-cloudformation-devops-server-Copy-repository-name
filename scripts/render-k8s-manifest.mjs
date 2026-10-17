import { readFileSync } from 'node:fs';

const [templatePath] = process.argv.slice(2);
if (!templatePath) {
  throw new Error('Usage: node scripts/render-k8s-manifest.mjs <template-path>');
}

const substitutions = {
  __APP_NAMESPACE__: process.env.K8S_APP_NAMESPACE,
  __BACKEND_IMAGE__: process.env.BACKEND_IMAGE_URI,
  __BUILD_NUMBER__: process.env.BUILD_NUMBER,
  __FRONTEND_IMAGE__: process.env.FRONTEND_IMAGE_URI,
};
let rendered = readFileSync(templatePath, 'utf8');

for (const [placeholder, value] of Object.entries(substitutions)) {
  if (rendered.includes(placeholder)) {
    if (!value || /[\r\n]/.test(value)) {
      throw new Error(`Missing or invalid value for ${placeholder}.`);
    }
    rendered = rendered.replaceAll(placeholder, value);
  }
}

if (/__[A-Z0-9_]+__/.test(rendered)) {
  throw new Error('Unresolved placeholder remains in the Kubernetes manifest.');
}

process.stdout.write(rendered);
