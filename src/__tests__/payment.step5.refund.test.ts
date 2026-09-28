import {
  createPaystackService,
  type FetchLike,
} from "../services/payment/paystack.service";

const makeFetch = (payload: any) => {
  const calls: Array<{ url: string; init: any }> = [];
  const fn: FetchLike = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 200, json: async () => payload };
  };
  return { fn, calls };
};

describe("Payments Step 5 — Paystack refund request (offline)", () => {
  it("POSTs /refund with the transaction reference and amount in pesewas", async () => {
    const { fn, calls } = makeFetch({
      status: true,
      data: { status: "pending", transaction: { reference: "REF_1" } },
    });
    const svc = createPaystackService({ secretKey: "sk_test", fetchFn: fn });

    const r = await svc.refund({ reference: "REF_1", amount: 7 });

    expect(r.status).toBe("pending");
    expect(r.reference).toBe("REF_1");

    const sent = calls[0];
    expect(sent.url).toContain("/refund");
    expect(sent.init.method).toBe("POST");
    const body = JSON.parse(sent.init.body);
    expect(body.transaction).toBe("REF_1");
    expect(body.amount).toBe(700);
  });

  it("omits amount for a full refund", async () => {
    const { fn, calls } = makeFetch({
      status: true,
      data: { status: "pending" },
    });
    const svc = createPaystackService({ secretKey: "sk_test", fetchFn: fn });

    await svc.refund({ reference: "REF_2" });
    const body = JSON.parse(calls[0].init.body);
    expect(body.transaction).toBe("REF_2");
    expect(body.amount).toBeUndefined();
  });
});
