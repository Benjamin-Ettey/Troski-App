import crypto from "crypto";

/**
 * Pure double-entry accounting + hash-chain helpers. No database, no env — so
 * this is fully unit-testable offline. The DB-backed ledger service composes
 * these.
 *
 * Double-entry: every posting is a set of entries whose debits equal its
 * credits, so money is always conserved. Each account has a "normal side"
 * (assets/expenses grow on debit; liabilities/revenue grow on credit). A
 * driver's wallet is a liability (money the platform owes them).
 *
 * Hash chain: each account's entries form an HMAC chain — every entry signs the
 * previous entry's hash, so altering any past entry (or the order) breaks the
 * chain and is detectable.
 */

export type AccountType = "asset" | "liability" | "revenue" | "expense";
export type Direction = "debit" | "credit";

export type EntryInput = {
  account: string;
  direction: Direction;
  amount: number;
};

// System (chart-of-accounts) accounts and their types.
export const SYSTEM_ACCOUNTS: Record<string, AccountType> = {
  escrow: "liability", // passenger funds held in transit
  platform_revenue: "revenue", // Troski commission + platform fee
  gateway: "asset", // money physically at Paystack
};

export const DRIVER_WALLET_PREFIX = "driver_wallet:";

export const driverWalletKey = (driverId: string): string =>
  `${DRIVER_WALLET_PREFIX}${driverId}`;

export const accountTypeFor = (account: string): AccountType => {
  if (account.startsWith(DRIVER_WALLET_PREFIX)) return "liability";
  const type = SYSTEM_ACCOUNTS[account];
  if (!type) {
    throw new Error(`Unknown ledger account "${account}"`);
  }
  return type;
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Signed change this entry applies to its account's balance. */
export const signedDelta = (
  type: AccountType,
  direction: Direction,
  amount: number,
): number => {
  const growsOnDebit = type === "asset" || type === "expense";
  const isIncrease =
    growsOnDebit ? direction === "debit" : direction === "credit";
  return isIncrease ? amount : -amount;
};

export const applyDirection = (
  balance: number,
  type: AccountType,
  direction: Direction,
  amount: number,
): number => round2(balance + signedDelta(type, direction, amount));

/** A posting is valid only if it has >=2 entries, all positive, debits==credits. */
export const isBalanced = (entries: EntryInput[]): boolean => {
  if (entries.length < 2) return false;
  if (!entries.every((e) => e.amount > 0)) return false;
  const debits = entries
    .filter((e) => e.direction === "debit")
    .reduce((s, e) => s + e.amount, 0);
  const credits = entries
    .filter((e) => e.direction === "credit")
    .reduce((s, e) => s + e.amount, 0);
  return Math.abs(round2(debits) - round2(credits)) < 0.005;
};

export type HashableEntry = {
  postingId: string;
  type: string;
  account: string;
  direction: Direction;
  amount: number;
  currency: string;
  balanceAfter: number;
  referenceKind: string;
  referenceId: string;
  createdAtISO: string;
  prevHash: string | null;
};

/** Deterministic HMAC-SHA256 of an entry, chaining the previous entry's hash. */
export const computeEntryHash = (secret: string, e: HashableEntry): string => {
  const canonical = [
    e.prevHash ?? "",
    e.postingId,
    e.type,
    e.account,
    e.direction,
    e.amount.toFixed(2),
    e.currency,
    e.balanceAfter.toFixed(2),
    e.referenceKind,
    e.referenceId,
    e.createdAtISO,
  ].join("|");
  return crypto.createHmac("sha256", secret).update(canonical).digest("hex");
};

export type ChainEntry = HashableEntry & { hash: string };

/**
 * Recompute an account's chain and confirm each stored hash + link. Returns the
 * index of the first broken entry, or null if the chain is intact.
 */
export const verifyChain = (
  entries: ChainEntry[],
  secret: string,
): { valid: boolean; brokenAt: number | null } => {
  let prev: string | null = null;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if ((e.prevHash ?? null) !== prev) {
      return { valid: false, brokenAt: i };
    }
    const expected = computeEntryHash(secret, { ...e, prevHash: prev });
    if (expected !== e.hash) {
      return { valid: false, brokenAt: i };
    }
    prev = e.hash;
  }
  return { valid: true, brokenAt: null };
};
