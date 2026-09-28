import "dotenv/config";
import {
  paystackService,
  isPaystackConfigured,
} from "../src/services/payment/paystack.service";

/**
 * Manual Step 1 check: exercises the real Paystack integration in TEST MODE.
 * Initializes a small test transaction and prints the checkout URL you can open
 * to test-pay (use Paystack's test cards / test MoMo).
 *
 *   npx tsx scripts/paystack-check.ts
 *
 * Requires PAYSTACK_SECRET_KEY (sk_test_...) in .env.
 */
const main = async (): Promise<void> => {
  if (!isPaystackConfigured()) {
    console.error("PAYSTACK_SECRET_KEY is not set in .env — add your test key.");
    process.exit(1);
  }

  const reference = `troski_check_${Date.now()}`;
  console.log(`Initializing a GHS 1.00 test transaction (ref: ${reference})...\n`);

  const init = await paystackService.initializeTransaction({
    email: "test-rider@troski.app",
    amount: 1,
    reference,
    channels: ["mobile_money", "card"],
    metadata: { purpose: "step1-connectivity-check" },
  });

  console.log("✓ Paystack accepted the request.");
  console.log("  reference:  ", init.reference);
  console.log("  accessCode: ", init.accessCode);
  console.log("  checkout:   ", init.authorizationUrl);
  console.log(
    "\nOpen the checkout URL and pay with a Paystack test card/MoMo to see it succeed.",
  );
  console.log(
    `Then check status with: verifyTransaction("${reference}") in a later step.`,
  );
};

main().catch((e) => {
  console.error("\n✗ Paystack check failed:", e?.message || e);
  process.exit(1);
});
