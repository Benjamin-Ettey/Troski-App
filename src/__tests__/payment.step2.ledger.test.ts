import {
  accountTypeFor,
  applyDirection,
  computeEntryHash,
  driverWalletKey,
  isBalanced,
  signedDelta,
  verifyChain,
  type ChainEntry,
  type EntryInput,
} from "../services/payment/ledger.core";

const SECRET = "test_wallet_hash_secret";

describe("Payments Step 2 — account types", () => {
  it("resolves system + driver-wallet account types", () => {
    expect(accountTypeFor("escrow")).toBe("liability");
    expect(accountTypeFor("platform_revenue")).toBe("revenue");
    expect(accountTypeFor("gateway")).toBe("asset");
    expect(accountTypeFor(driverWalletKey("abc123"))).toBe("liability");
  });

  it("throws on an unknown account", () => {
    expect(() => accountTypeFor("mystery")).toThrow();
  });
});

describe("Payments Step 2 — balance direction", () => {
  it("liabilities grow on credit, shrink on debit", () => {
    expect(signedDelta("liability", "credit", 10)).toBe(10);
    expect(signedDelta("liability", "debit", 10)).toBe(-10);
    expect(applyDirection(6.03, "liability", "credit", 4)).toBe(10.03);
  });

  it("assets grow on debit, shrink on credit", () => {
    expect(signedDelta("asset", "debit", 10)).toBe(10);
    expect(signedDelta("asset", "credit", 10)).toBe(-10);
  });

  it("revenue grows on credit", () => {
    expect(signedDelta("revenue", "credit", 0.97)).toBe(0.97);
  });
});

describe("Payments Step 2 — posting balance rule (debits == credits)", () => {
  it("accepts a balanced release posting", () => {
    // Release GHS 7 escrow → driver 6.03 + platform 0.97
    const entries: EntryInput[] = [
      { account: "escrow", direction: "debit", amount: 7 },
      { account: driverWalletKey("d1"), direction: "credit", amount: 6.03 },
      { account: "platform_revenue", direction: "credit", amount: 0.97 },
    ];
    expect(isBalanced(entries)).toBe(true);
  });

  it("rejects an unbalanced posting", () => {
    const entries: EntryInput[] = [
      { account: "escrow", direction: "debit", amount: 7 },
      { account: driverWalletKey("d1"), direction: "credit", amount: 6 },
    ];
    expect(isBalanced(entries)).toBe(false);
  });

  it("rejects a single-sided or non-positive posting", () => {
    expect(
      isBalanced([{ account: "escrow", direction: "debit", amount: 7 }]),
    ).toBe(false);
    expect(
      isBalanced([
        { account: "escrow", direction: "debit", amount: 0 },
        { account: "gateway", direction: "credit", amount: 0 },
      ]),
    ).toBe(false);
  });
});

// Build a per-account chain the way the ledger service does.
const buildChain = (
  raw: Array<{ amount: number; balanceAfter: number }>,
  secret = SECRET,
): ChainEntry[] => {
  const chain: ChainEntry[] = [];
  let prev: string | null = null;
  raw.forEach((r, i) => {
    const base = {
      postingId: `posting_${i}`,
      type: "release",
      account: driverWalletKey("d1"),
      direction: "credit" as const,
      amount: r.amount,
      currency: "GHS",
      balanceAfter: r.balanceAfter,
      referenceKind: "booking",
      referenceId: `bk_${i}`,
      createdAtISO: new Date(1700000000000 + i * 1000).toISOString(),
      prevHash: prev,
    };
    const hash = computeEntryHash(secret, base);
    chain.push({ ...base, hash });
    prev = hash;
  });
  return chain;
};

describe("Payments Step 2 — hash chain", () => {
  it("hashing is deterministic", () => {
    const a = buildChain([{ amount: 5, balanceAfter: 5 }]);
    const b = buildChain([{ amount: 5, balanceAfter: 5 }]);
    expect(a[0].hash).toBe(b[0].hash);
  });

  it("verifies an intact chain", () => {
    const chain = buildChain([
      { amount: 6.03, balanceAfter: 6.03 },
      { amount: 4, balanceAfter: 10.03 },
      { amount: 2, balanceAfter: 12.03 },
    ]);
    expect(verifyChain(chain, SECRET)).toEqual({ valid: true, brokenAt: null });
  });

  it("detects a tampered amount", () => {
    const chain = buildChain([
      { amount: 6.03, balanceAfter: 6.03 },
      { amount: 4, balanceAfter: 10.03 },
    ]);
    // Attacker edits the first entry's amount but keeps its stored hash.
    chain[0].amount = 600;
    const result = verifyChain(chain, SECRET);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(0);
  });

  it("detects a reordered/broken link", () => {
    const chain = buildChain([
      { amount: 1, balanceAfter: 1 },
      { amount: 2, balanceAfter: 3 },
    ]);
    // Break the link between entry 0 and entry 1.
    chain[1].prevHash = "not_the_real_prev_hash";
    const result = verifyChain(chain, SECRET);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it("fails verification under a different secret", () => {
    const chain = buildChain([{ amount: 5, balanceAfter: 5 }]);
    expect(verifyChain(chain, "wrong_secret").valid).toBe(false);
  });
});
