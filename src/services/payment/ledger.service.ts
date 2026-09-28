import mongoose, { ClientSession, Types } from "mongoose";
import LedgerAccount from "../../models/LedgerAccount";
import LedgerEntry from "../../models/LedgerEntry";
import {
  accountTypeFor,
  applyDirection,
  computeEntryHash,
  driverWalletKey,
  isBalanced,
  verifyChain,
  type ChainEntry,
  type EntryInput,
} from "./ledger.core";

const walletHashSecret = (): string => {
  const secret = process.env.WALLET_HASH_SECRET;
  if (!secret) {
    throw new Error("WALLET_HASH_SECRET is not configured");
  }
  return secret;
};

export type PostParams = {
  type: string; // charge | release | refund | payout | adjustment | reversal
  reference: { kind: string; id: string };
  entries: EntryInput[];
  currency?: string;
  meta?: Record<string, unknown>;
};

export type PostResult = {
  postingId: Types.ObjectId;
  entryIds: Types.ObjectId[];
};

/**
 * Post a balanced double-entry transaction: append immutable, hash-chained
 * entries and update each account's cached balance + chain head. Runs inside a
 * MongoDB transaction (its own, or a caller-provided session) so it is all-or-
 * nothing.
 */
export const postTransaction = async (
  params: PostParams,
  existingSession?: ClientSession,
): Promise<PostResult> => {
  const secret = walletHashSecret();

  if (!isBalanced(params.entries)) {
    throw new Error(
      "Ledger posting is not balanced (need >=2 entries, all > 0, debits == credits)",
    );
  }

  const currency = params.currency ?? "GHS";

  const runner = async (session: ClientSession): Promise<PostResult> => {
    const postingId = new Types.ObjectId();
    const createdAt = new Date();
    const createdAtISO = createdAt.toISOString();
    const entryIds: Types.ObjectId[] = [];

    for (const input of params.entries) {
      const type = accountTypeFor(input.account);

      let account = await LedgerAccount.findOne({ key: input.account }).session(
        session,
      );
      if (!account) {
        const [created] = await LedgerAccount.create(
          [{ key: input.account, type, balance: 0, currency, lastHash: null }],
          { session },
        );
        account = created;
      }

      const balanceAfter = applyDirection(
        account.balance ?? 0,
        type,
        input.direction,
        input.amount,
      );
      const prevHash = account.lastHash ?? null;

      const hash = computeEntryHash(secret, {
        postingId: postingId.toString(),
        type: params.type,
        account: input.account,
        direction: input.direction,
        amount: input.amount,
        currency,
        balanceAfter,
        referenceKind: params.reference.kind,
        referenceId: params.reference.id,
        createdAtISO,
        prevHash,
      });

      const [entry] = await LedgerEntry.create(
        [
          {
            postingId,
            type: params.type,
            account: input.account,
            accountType: type,
            direction: input.direction,
            amount: input.amount,
            currency,
            balanceAfter,
            reference: params.reference,
            meta: params.meta ?? {},
            prevHash,
            hash,
            createdAt,
          },
        ],
        { session },
      );

      account.balance = balanceAfter;
      account.lastHash = hash;
      await account.save({ session });

      entryIds.push(entry._id);
    }

    return { postingId, entryIds };
  };

  if (existingSession) {
    return runner(existingSession);
  }

  const session = await mongoose.startSession();
  try {
    let result!: PostResult;
    await session.withTransaction(async () => {
      result = await runner(session);
    });
    return result;
  } finally {
    session.endSession();
  }
};

export const getBalance = async (key: string): Promise<number> => {
  const account = await LedgerAccount.findOne({ key });
  return account?.balance ?? 0;
};

export const getDriverWalletBalance = (driverId: string): Promise<number> =>
  getBalance(driverWalletKey(driverId));

/**
 * Replay an account's entries to confirm (a) the hash chain is intact and
 * (b) the cached balance matches the last entry. Detects tampering.
 */
export const verifyAccountIntegrity = async (
  key: string,
): Promise<{
  valid: boolean;
  chainValid: boolean;
  brokenAt: number | null;
  balanceMatches: boolean;
  storedBalance: number;
  derivedBalance: number;
}> => {
  const secret = walletHashSecret();
  const entries = await LedgerEntry.find({ account: key }).sort({
    createdAt: 1,
    _id: 1,
  });

  const chain: ChainEntry[] = entries.map((e) => ({
    postingId: String(e.postingId),
    type: e.type as string,
    account: e.account as string,
    direction: e.direction as ChainEntry["direction"],
    amount: e.amount as number,
    currency: e.currency as string,
    balanceAfter: e.balanceAfter as number,
    referenceKind: (e.reference?.kind ?? "") as string,
    referenceId: (e.reference?.id ?? "") as string,
    createdAtISO: (e.createdAt as Date).toISOString(),
    prevHash: (e.prevHash ?? null) as string | null,
    hash: e.hash as string,
  }));

  const { valid: chainValid, brokenAt } = verifyChain(chain, secret);

  const account = await LedgerAccount.findOne({ key });
  const derivedBalance = entries.length
    ? (entries[entries.length - 1].balanceAfter as number)
    : 0;
  const storedBalance = account?.balance ?? 0;
  const balanceMatches = Math.abs(storedBalance - derivedBalance) < 0.005;

  return {
    valid: chainValid && balanceMatches,
    chainValid,
    brokenAt,
    balanceMatches,
    storedBalance,
    derivedBalance,
  };
};
