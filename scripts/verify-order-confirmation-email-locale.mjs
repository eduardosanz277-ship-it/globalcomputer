/**
 * Verifica locale, plantilla y subject del correo de confirmación Stripe.
 * Ejecutar: node scripts/verify-order-confirmation-email-locale.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(
  join(root, "lib/email/order-confirmation-locale.ts"),
  "utf8",
);

const transpiled = source
  .replace(/export type EmailLocale = "es" \| "en";\s*/g, "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^export /gm, "")
  .replace(/session: \{[\s\S]*?\}\s*\|\s*null\s*\|\s*undefined/g, "session")
  .replace(/:\s*EmailLocale\s*\|\s*null/g, "")
  .replace(/:\s*EmailLocale\s*\|\s*undefined/g, "")
  .replace(/:\s*EmailLocale/g, "")
  .replace(/\?: unknown/g, "")
  .replace(/:\s*unknown/g, "")
  .replace(/:\s*boolean/g, "")
  .replace(/:\s*string\s*\|\s*null/g, "")
  .replace(/:\s*string/g, "");

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  `${transpiled}
this.resolveOrderConfirmationEmailLocale = resolveOrderConfirmationEmailLocale;
this.resolveCheckoutOrderLocale = resolveCheckoutOrderLocale;
this.orderConfirmationTemplateId = orderConfirmationTemplateId;
this.localePatchForExistingOrder = localePatchForExistingOrder;
this.isUsableCustomerEmail = isUsableCustomerEmail;
this.isPlaceholderCustomerEmail = isPlaceholderCustomerEmail;
this.stripeSessionCustomerEmail = stripeSessionCustomerEmail;
this.EMAIL_DEFAULT_LOCALE = EMAIL_DEFAULT_LOCALE;
this.PLACEHOLDER_CUSTOMER_EMAIL = PLACEHOLDER_CUSTOMER_EMAIL;
`,
  sandbox,
);

const {
  resolveOrderConfirmationEmailLocale,
  resolveCheckoutOrderLocale,
  orderConfirmationTemplateId,
  localePatchForExistingOrder,
  isUsableCustomerEmail,
  isPlaceholderCustomerEmail,
  stripeSessionCustomerEmail,
  EMAIL_DEFAULT_LOCALE,
  PLACEHOLDER_CUSTOMER_EMAIL,
} = sandbox;

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

assert("fallback default is en", EMAIL_DEFAULT_LOCALE, "en");

const localeCases = [
  ["es", "es"],
  ["en", "en"],
  ["ES", "es"],
  ["EN", "en"],
  ["es-419", "es"],
  ["en-US", "en"],
  ["auto", "en"],
  [null, "en"],
  [undefined, "en"],
  ["", "en"],
  ["fr", "en"],
];

for (const [input, expected] of localeCases) {
  assert(
    `emailLocale(${JSON.stringify(input)})`,
    resolveOrderConfirmationEmailLocale(input),
    expected,
  );
}

assert(
  "checkout metadata en beats payload es",
  resolveCheckoutOrderLocale("en", "es"),
  "en",
);
assert(
  "checkout payload used when metadata missing",
  resolveCheckoutOrderLocale(null, "en"),
  "en",
);
assert(
  "checkout unknown falls back to en not es",
  resolveCheckoutOrderLocale(null, null),
  "en",
);
assert(
  "template en",
  orderConfirmationTemplateId("en"),
  "order-confirmation-en",
);

assert(
  "update existing es when checkout is en",
  localePatchForExistingOrder("es", "en"),
  "en",
);
assert(
  "update existing en when checkout is es",
  localePatchForExistingOrder("en", "es"),
  "es",
);
assert(
  "no patch when same locale",
  localePatchForExistingOrder("en", "en"),
  undefined,
);
assert(
  "fill locale when missing",
  localePatchForExistingOrder(null, "en"),
  "en",
);
assert(
  "fill locale when auto",
  localePatchForExistingOrder("auto", "es"),
  "es",
);

assert(
  "placeholder not usable",
  isUsableCustomerEmail(PLACEHOLDER_CUSTOMER_EMAIL),
  false,
);
assert(
  "real email usable",
  isUsableCustomerEmail("guest@example.com"),
  true,
);
assert(
  "placeholder detected",
  isPlaceholderCustomerEmail("cliente@globalcomputer.com"),
  true,
);
assert(
  "stripe email preferred",
  stripeSessionCustomerEmail({
    customer_details: { email: "paid@example.com" },
    customer_email: "alt@example.com",
  }),
  "paid@example.com",
);
assert(
  "stripe ignores placeholder",
  stripeSessionCustomerEmail({
    customer_details: { email: PLACEHOLDER_CUSTOMER_EMAIL },
  }),
  null,
);

const templateSource = readFileSync(
  join(root, "lib/email/templates/orderConfirmationTemplate.ts"),
  "utf8",
);

assert(
  "subject ES branch is explicit",
  templateSource.includes('if (locale === "es")'),
  true,
);
assert(
  "subject ES copy",
  templateSource.includes("`Pedido confirmado — ${orderNumber}`"),
  true,
);
assert(
  "subject EN copy",
  templateSource.includes("`Order confirmed — ${orderNumber}`"),
  true,
);

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll order-confirmation email locale checks passed.");
