export interface ChargeMobileMoneyParams {
  email: string;
  amount: number;
  reference: string;
  phoneNumber: string;
  provider: "mtn" | "tgo" | "vdc" | string;
  metadata?: Record<string, any>;
}

export interface ChargeMobileMoneyResult {
  status: string;
  reference: string;
  displayText?: string;
}

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
