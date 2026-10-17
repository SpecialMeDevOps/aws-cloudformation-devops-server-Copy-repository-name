import { readFileSync } from 'node:fs';

const [secretName, keyName, jsonField, namespace, ...extraFields] = process.argv.slice(2);
if (!secretName || !keyName) {
  throw new Error('Usage: node scripts/render-k8s-secret.mjs <secret-name> <key-name> [json-field] [namespace] [key=value ...]');
}

const input = readFileSync(0, 'utf8').trim();
const value = jsonField ? JSON.parse(input)[jsonField] : input;
if (typeof value !== 'string' || value.length < 1 || /[\r\n]/.test(value)) {
  throw new Error('The requested secret value is missing or malformed.');
}

const secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: secretName,
    namespace: namespace || process.env.K8S_APP_NAMESPACE,
  },
  type: 'Opaque',
  stringData: {
    [keyName]: value,
  },
};

for (const field of extraFields) {
  const separator = field.indexOf('=');
  const key = field.slice(0, separator);
  const fieldValue = field.slice(separator + 1);
  if (
    separator < 1 ||
    !/^[A-Za-z0-9._-]+$/.test(key) ||
    !fieldValue ||
    /[\r\n]/.test(fieldValue)
  ) {
    throw new Error('Additional secret fields must be non-empty key=value pairs with valid keys.');
  }
  secret.stringData[key] = fieldValue;
}

process.stdout.write(`${JSON.stringify(secret)}\n`);
