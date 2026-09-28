import mongoose from "mongoose";
import LedgerEntry from "../models/LedgerEntry";
import {
  postTransaction,
  getBalance,
  getDriverWalletBalance,
  verifyAccountIntegrity,
} from "../services/payment/ledger.service";
import { driverWalletKey } from "../services/payment/ledger.core";
import { connectTestDb, clearDb, closeTestDb } from "./helpers/db";

const driverId = "64b7f0c2a1a1a1a1a1a1a1a1";
const wallet = driverWalletKey(driverId);

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

afterEach(async () => {
  await clearDb();
});

// A full charge → release cycle for a GHS 7 ride (driver 6.03, platform 0.97).
const runChargeAndRelease = async () => {
  await postTransaction({
    type: "charge",
    reference: { kind: "booking", id: "bk1" },
    entries: [
      { account: "gateway", direction: "debit", amount: 7 },
      { account: "escrow", direction: "credit", amount: 7 },
    ],
  });

  await postTransaction({
    type: "release",
    reference: { kind: "booking", id: "bk1" },
    entries: [
      { account: "escrow", direction: "debit", amount: 7 },
      { account: wallet, direction: "credit", amount: 6.03 },
      { account: "platform_revenue", direction: "credit", amount: 0.97 },
    ],
  });
};

describe("Payments Step 2 — ledger postings (DB)", () => {
  it("moves money correctly through charge → release", async () => {
    await runChargeAndRelease();

    expect(await getBalance("gateway")).toBe(7); // asset: money at Paystack
    expect(await getBalance("escrow")).toBe(0); // fully released
    expect(await getDriverWalletBalance(driverId)).toBe(6.03);
    expect(await getBalance("platform_revenue")).toBe(0.97);
  });

  it("debits the wallet on payout", async () => {
    await runChargeAndRelease();

    await postTransaction({
      type: "payout",
      reference: { kind: "withdrawal", id: "wd1" },
      entries: [
        { account: wallet, direction: "debit", amount: 6.03 },
        { account: "gateway", direction: "credit", amount: 6.03 },
      ],
    });

    expect(await getDriverWalletBalance(driverId)).toBe(0);
  });

  it("rejects an unbalanced posting", async () => {
    await expect(
      postTransaction({
        type: "charge",
        reference: { kind: "booking", id: "bad" },
        entries: [
          { account: "gateway", direction: "debit", amount: 7 },
          { account: "escrow", direction: "credit", amount: 6 },
        ],
      }),
    ).rejects.toThrow(/balanced/i);
  });

  it("passes integrity verification for a healthy wallet", async () => {
    await runChargeAndRelease();
    const result = await verifyAccountIntegrity(wallet);
    expect(result.valid).toBe(true);
    expect(result.chainValid).toBe(true);
    expect(result.balanceMatches).toBe(true);
  });

  it("detects tampering with a ledger entry", async () => {
    await runChargeAndRelease();

    // Simulate an attacker editing a stored amount directly in the DB.
    await LedgerEntry.updateOne(
      { account: wallet },
      { $set: { amount: 600, balanceAfter: 600 } },
    );

    const result = await verifyAccountIntegrity(wallet);
    expect(result.valid).toBe(false);
    expect(result.chainValid).toBe(false);
  });
});
