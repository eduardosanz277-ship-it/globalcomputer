/**
 * Verifica las reglas de estado Stripe vs admin.
 * Ejecutar: node scripts/verify-store-order-status-rules.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(
  join(root, "modules/commerce/store-order-status-rules.ts"),
  "utf8",
);

const transpiled = source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\*\*[\s\S]*?\*\/\s*$/gm, "")
  .replace(/export /g, "")
  .replace(/ as const/g, "")
  .replace(/: unknown/g, "")
  .replace(/: boolean/g, "")
  .replace(/ as readonly string\[\]/g, "");

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  `${transpiled}
this.resolveStatusAfterStripePayment = resolveStatusAfterStripePayment;
this.canStripePromoteToConfirmed = canStripePromoteToConfirmed;
`,
  sandbox,
);

const resolveStatusAfterStripePayment = sandbox.resolveStatusAfterStripePayment;
const canStripePromoteToConfirmed = sandbox.canStripePromoteToConfirmed;

let failed = 0;
function assert(name, actual, expected) {
  if (!Object.is(actual, expected)) {
    failed += 1;
    console.error(
      `FAIL ${name}: got ${JSON.stringify(actual)} expected ${JSON.stringify(expected)}`,
    );
    return;
  }
  console.log(`ok   ${name}`);
}

const resolveCases = [
  [null, "confirmed"],
  [undefined, "confirmed"],
  ["", "confirmed"],
  ["pending", "confirmed"],
  ["confirmed", "confirmed"],
  ["processing", "processing"],
  ["shipping", "shipping"],
  ["completed", "completed"],
  ["cancelled", "cancelled"],
];

for (const [current, expected] of resolveCases) {
  assert(
    `resolve(${JSON.stringify(current)})`,
    resolveStatusAfterStripePayment(current),
    expected,
  );
}

const promoteCases = [
  [null, true],
  [undefined, true],
  ["", true],
  ["pending", true],
  ["confirmed", false],
  ["processing", false],
  ["shipping", false],
  ["completed", false],
  ["cancelled", false],
];

for (const [current, expected] of promoteCases) {
  assert(
    `canPromote(${JSON.stringify(current)})`,
    canStripePromoteToConfirmed(current),
    expected,
  );
}

assert(
  "paid pending is not processing",
  resolveStatusAfterStripePayment("pending") === "processing",
  false,
);
assert(
  "retry on confirmed does not write status",
  canStripePromoteToConfirmed("confirmed"),
  false,
);
assert(
  "retry on processing does not write status",
  canStripePromoteToConfirmed("processing"),
  false,
);
assert(
  "pending payment promotes to confirmed",
  canStripePromoteToConfirmed("pending"),
  true,
);

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll store-order status rules passed.");
