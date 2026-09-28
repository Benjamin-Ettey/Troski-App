import {
  createPaystackService,
  type FetchLike,
} from "../services/payment/paystack.service";
import {
  inferMomoProvider,
  providerToBankCode,
} from "../services/payment/payout.service";

const makeFetch = (payload: any) => {
  const calls: Array<{ url: string; init: any }> = [];
  const fn: FetchLike = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 200, json: async () => payload };
  };
  return { fn, calls };
};

describe("Payments Step 6 — MoMo provider inference", () => {
  it("maps Ghana prefixes to providers", () => {
    expect(inferMomoProvider("0241234567")).toBe("MTN");
    expect(inferMomoProvider("+233201234567")).toBe("VOD");
    expect(inferMomoProvider("0271234567")).toBe("ATL");
    expect(inferMomoProvider("233559999999")).toBe("MTN");
  });

  it("returns null for an unknown prefix", () => {
    expect(inferMomoProvider("0991234567")).toBeNull();
  });

  it("maps provider to bank code", () => {
    expect(providerToBankCode("MTN")).toBe("MTN");
    expect(providerToBankCode("VOD")).toBe("VOD");
  });
});

describe("Payments Step 6 — Paystack transfer requests (offline)", () => {
  it("creates a mobile_money transfer recipient", async () => {
    const { fn, calls } = makeFetch({
      status: true,
      data: { recipient_code: "RCP_1" },
    });
    const svc = createPaystackService({ secretKey: "sk_test", fetchFn: fn });

    const r = await svc.createTransferRecipient({
      name: "Kofi Driver",
      accountNumber: "0241234567",
      bankCode: "MTN",
    });

    expect(r.recipientCode).toBe("RCP_1");
    const body = JSON.parse(calls[0].init.body);
    expect(calls[0].url).toContain("/transferrecipient");
    expect(body.type).toBe("mobile_money");
    expect(body.account_number).toBe("0241234567");
    expect(body.bank_code).toBe("MTN");
    expect(body.currency).toBe("GHS");
  });

  it("initiates a transfer with amount in pesewas", async () => {
    const { fn, calls } = makeFetch({
      status: true,
      data: { status: "success", transfer_code: "TRF_1", reference: "payout_x" },
    });
    const svc = createPaystackService({ secretKey: "sk_test", fetchFn: fn });

    const r = await svc.initiateTransfer({
      amount: 6.03,
      recipientCode: "RCP_1",
      reference: "payout_x",
      reason: "payout",
    });

    expect(r.status).toBe("success");
    expect(r.transferCode).toBe("TRF_1");
    const body = JSON.parse(calls[0].init.body);
    expect(calls[0].url).toContain("/transfer");
    expect(body.source).toBe("balance");
    expect(body.amount).toBe(603);
    expect(body.recipient).toBe("RCP_1");
    expect(body.reference).toBe("payout_x");
  });
});
