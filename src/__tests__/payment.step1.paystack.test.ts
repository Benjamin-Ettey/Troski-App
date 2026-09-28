import crypto from "crypto";
import {
  createPaystackService,
  PaystackError,
  toSubunit,
  fromSubunit,
  type FetchLike,
} from "../services/payment/paystack.service";

const SECRET = "sk_test_dummy_secret";

// Build a fake fetch that returns a canned Paystack-shaped JSON response and
// records the calls so we can assert request shaping.
const makeFetch = (payload: any, ok = true, status = 200) => {
  const calls: Array<{ url: string; init: any }> = [];
  const fn: FetchLike = async (url, init) => {
    calls.push({ url, init });
    return { ok, status, json: async () => payload };
  };
  return { fn, calls };
};

describe("Payments Step 1 — amount conversion (GHS <-> pesewas)", () => {
  it("converts GHS to the minor unit", () => {
    expect(toSubunit(7)).toBe(700);
    expect(toSubunit(6.03)).toBe(603);
    expect(toSubunit(0.3)).toBe(30);
  });

  it("converts back from the minor unit", () => {
    expect(fromSubunit(700)).toBe(7);
    expect(fromSubunit(603)).toBe(6.03);
  });
});

describe("Payments Step 1 — webhook signature verification", () => {
  const svc = createPaystackService({ secretKey: SECRET });
  const body = JSON.stringify({ event: "charge.success", data: { reference: "r1" } });
  const validSig = crypto
    .createHmac("sha512", SECRET)
    .update(body)
    .digest("hex");

  it("accepts a correctly signed body", () => {
    expect(svc.verifyWebhookSignature(body, validSig)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const tampered = body.replace("r1", "r2");
    expect(svc.verifyWebhookSignature(tampered, validSig)).toBe(false);
  });

  it("rejects a bad signature", () => {
    expect(svc.verifyWebhookSignature(body, "deadbeef")).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(svc.verifyWebhookSignature(body, undefined)).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    const unconfigured = createPaystackService({ secretKey: "" });
    expect(unconfigured.verifyWebhookSignature(body, validSig)).toBe(false);
  });
});

describe("Payments Step 1 — initializeTransaction", () => {
  it("sends amount in the minor unit + GHS + auth header, and parses the result", async () => {
    const { fn, calls } = makeFetch({
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/abc",
        access_code: "ACCESS_1",
        reference: "REF_1",
      },
    });
    const svc = createPaystackService({ secretKey: SECRET, fetchFn: fn });

    const result = await svc.initializeTransaction({
      email: "rider@example.com",
      amount: 7,
      reference: "REF_1",
    });

    expect(result).toEqual({
      authorizationUrl: "https://checkout.paystack.com/abc",
      accessCode: "ACCESS_1",
      reference: "REF_1",
    });

    // Request shaping
    const sent = calls[0];
    expect(sent.url).toContain("/transaction/initialize");
    expect(sent.init.method).toBe("POST");
    expect(sent.init.headers.Authorization).toBe(`Bearer ${SECRET}`);
    const bodyObj = JSON.parse(sent.init.body);
    expect(bodyObj.amount).toBe(700);
    expect(bodyObj.currency).toBe("GHS");
    expect(bodyObj.email).toBe("rider@example.com");
  });
});

describe("Payments Step 1 — verifyTransaction", () => {
  it("normalizes the verify payload (amount back to GHS)", async () => {
    const { fn } = makeFetch({
      status: true,
      message: "Verification successful",
      data: {
        reference: "REF_1",
        status: "success",
        amount: 700,
        currency: "GHS",
        channel: "mobile_money",
        paid_at: "2026-09-28T10:00:00Z",
        gateway_response: "Approved",
        customer: { email: "rider@example.com" },
      },
    });
    const svc = createPaystackService({ secretKey: SECRET, fetchFn: fn });

    const r = await svc.verifyTransaction("REF_1");
    expect(r.status).toBe("success");
    expect(r.amount).toBe(7);
    expect(r.channel).toBe("mobile_money");
    expect(r.customerEmail).toBe("rider@example.com");
  });
});

describe("Payments Step 1 — error handling", () => {
  it("throws PaystackError when the API reports status:false", async () => {
    const { fn } = makeFetch({ status: false, message: "Invalid key" }, true, 200);
    const svc = createPaystackService({ secretKey: SECRET, fetchFn: fn });
    await expect(svc.verifyTransaction("REF_X")).rejects.toBeInstanceOf(
      PaystackError,
    );
  });

  it("throws PaystackError on a non-2xx response", async () => {
    const { fn } = makeFetch({ status: false, message: "Server error" }, false, 500);
    const svc = createPaystackService({ secretKey: SECRET, fetchFn: fn });
    await expect(
      svc.initializeTransaction({ email: "a@b.com", amount: 5, reference: "R" }),
    ).rejects.toBeInstanceOf(PaystackError);
  });

  it("throws when no secret key is configured", async () => {
    const svc = createPaystackService({ secretKey: "" });
    await expect(svc.verifyTransaction("R")).rejects.toBeInstanceOf(
      PaystackError,
    );
  });
});
