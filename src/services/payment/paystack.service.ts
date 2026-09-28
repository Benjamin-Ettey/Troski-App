import crypto from "crypto";

/**
 * Thin wrapper around the Paystack REST API. All Paystack access goes through
 * here so the secret key, request shaping, response parsing, amount conversion
 * and webhook verification live in one place.
 *
 * Built via a factory that takes the secret key + an injectable fetch, so tests
 * can supply a fake HTTP layer (no network, no module mocking) — same pattern as
 * the maps service. A default `paystackService` singleton is exported for app code.
 *
 * NOTE on amounts: Paystack works in the currency's minor unit. For GHS that is
 * pesewas (GHS 1 = 100). Callers pass amounts in whole GHS; we convert here.
 */

export class PaystackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaystackError";
  }
}

// Minimal shape of the fetch we depend on — keeps DI simple and avoids coupling
// to lib DOM/undici typings.
export type FetchLike = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<{ ok: boolean; status: number; json: () => Promise<any> }>;

export type PaystackConfig = {
  secretKey: string;
  baseUrl?: string;
  fetchFn?: FetchLike;
};

export type InitializeParams = {
  email: string;
  amount: number; // whole GHS
  reference: string;
  metadata?: Record<string, unknown>;
  channels?: string[]; // e.g. ["mobile_money", "card"]
};

export type InitializeResult = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

export type VerifyResult = {
  reference: string;
  status: string; // "success" | "failed" | "abandoned" | ...
  amount: number; // whole GHS
  currency: string;
  channel: string | null;
  paidAt: string | null;
  gatewayResponse: string | null;
  customerEmail: string | null;
};

export const toSubunit = (amountGhs: number): number =>
  Math.round(amountGhs * 100);

export const fromSubunit = (amountPesewas: number): number =>
  parseFloat((amountPesewas / 100).toFixed(2));

export const createPaystackService = ({
  secretKey,
  baseUrl = "https://api.paystack.co",
  fetchFn,
}: PaystackConfig) => {
  const doFetch: FetchLike = fetchFn ?? (fetch as unknown as FetchLike);

  const request = async (
    path: string,
    options: { method?: string; body?: Record<string, unknown> } = {},
  ): Promise<any> => {
    if (!secretKey) {
      throw new PaystackError("PAYSTACK_SECRET_KEY is not configured");
    }

    const res = await doFetch(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    let json: any;
    try {
      json = await res.json();
    } catch {
      throw new PaystackError(`Paystack returned a non-JSON response (${res.status})`);
    }

    // Paystack wraps everything as { status: boolean, message, data }.
    if (!res.ok || json?.status === false) {
      throw new PaystackError(
        json?.message || `Paystack request failed (HTTP ${res.status})`,
      );
    }

    return json;
  };

  /** Start a payment. Returns the URL/access code the client uses to pay. */
  const initializeTransaction = async (
    params: InitializeParams,
  ): Promise<InitializeResult> => {
    const json = await request("/transaction/initialize", {
      method: "POST",
      body: {
        email: params.email,
        amount: toSubunit(params.amount),
        currency: "GHS",
        reference: params.reference,
        metadata: params.metadata,
        channels: params.channels,
      },
    });

    return {
      authorizationUrl: json.data.authorization_url,
      accessCode: json.data.access_code,
      reference: json.data.reference,
    };
  };

  /** Confirm the true state of a payment with Paystack (source of truth). */
  const verifyTransaction = async (reference: string): Promise<VerifyResult> => {
    const json = await request(
      `/transaction/verify/${encodeURIComponent(reference)}`,
    );
    const d = json.data;
    return {
      reference: d.reference,
      status: d.status,
      amount: fromSubunit(d.amount),
      currency: d.currency,
      channel: d.channel ?? null,
      paidAt: d.paid_at ?? null,
      gatewayResponse: d.gateway_response ?? null,
      customerEmail: d.customer?.email ?? null,
    };
  };

  /**
   * Refund a transaction to source (the card/MoMo the passenger paid with).
   * Omit `amount` for a full refund. Paystack processes asynchronously and later
   * emits a refund webhook; this just requests it.
   */
  const refund = async (params: {
    reference: string;
    amount?: number;
  }): Promise<{ status: string; reference: string }> => {
    const json = await request("/refund", {
      method: "POST",
      body: {
        transaction: params.reference,
        ...(params.amount != null ? { amount: toSubunit(params.amount) } : {}),
      },
    });
    return {
      status: json.data?.status ?? "pending",
      reference: json.data?.transaction?.reference ?? params.reference,
    };
  };

  /**
   * Create a transfer recipient (a payout destination). For Ghana Mobile Money
   * pass type "mobile_money", the MoMo number as accountNumber, and the provider
   * bank code (MTN / VOD / ATL).
   */
  const createTransferRecipient = async (params: {
    name: string;
    accountNumber: string;
    bankCode: string;
    type?: string;
    currency?: string;
  }): Promise<{ recipientCode: string }> => {
    const json = await request("/transferrecipient", {
      method: "POST",
      body: {
        type: params.type ?? "mobile_money",
        name: params.name,
        account_number: params.accountNumber,
        bank_code: params.bankCode,
        currency: params.currency ?? "GHS",
      },
    });
    return { recipientCode: json.data.recipient_code };
  };

  /** Send money from the Paystack balance to a recipient (a driver payout). */
  const initiateTransfer = async (params: {
    amount: number;
    recipientCode: string;
    reference: string;
    reason?: string;
  }): Promise<{ status: string; transferCode: string; reference: string }> => {
    const json = await request("/transfer", {
      method: "POST",
      body: {
        source: "balance",
        amount: toSubunit(params.amount),
        recipient: params.recipientCode,
        reference: params.reference,
        reason: params.reason,
        currency: "GHS",
      },
    });
    return {
      status: json.data.status,
      transferCode: json.data.transfer_code,
      reference: json.data.reference ?? params.reference,
    };
  };

  /**
   * Verify a Paystack webhook. Paystack signs the RAW request body with
   * HMAC-SHA512 using the secret key and sends it as `x-paystack-signature`.
   * Pass the raw (unparsed) body.
   */
  const verifyWebhookSignature = (
    rawBody: string | Buffer,
    signature: string | undefined,
  ): boolean => {
    if (!secretKey || !signature) return false;
    const expected = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");

    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  };

  return {
    request,
    initializeTransaction,
    verifyTransaction,
    refund,
    createTransferRecipient,
    initiateTransfer,
    verifyWebhookSignature,
  };
};

export type PaystackService = ReturnType<typeof createPaystackService>;

export const isPaystackConfigured = (): boolean =>
  !!process.env.PAYSTACK_SECRET_KEY;

export const paystackService = createPaystackService({
  secretKey: process.env.PAYSTACK_SECRET_KEY || "",
});
