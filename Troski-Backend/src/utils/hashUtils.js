const crypto = require("crypto");

// HMAC-SHA256 over the wallet's mutable state, keyed by WALLET_HASH_SECRET.
// Including phoneNumber prevents an attacker with DB write access from
// copying a valid hash from one wallet onto another. Every read/write of
// a wallet's balance fields must verify and regenerate this hash.
const generateBalanceHash = (balance, escrowBalance, phoneNumber) => {
  const secret = process.env.WALLET_HASH_SECRET;
  if (!secret) {
    throw new Error("WALLET_HASH_SECRET env var not set");
  }
  const data = `${balance}:${escrowBalance}:${phoneNumber}`;
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
};

const verifyWalletIntegrity = (wallet) => {
  const expected = generateBalanceHash(
    wallet.balance,
    wallet.escrowBalance,
    wallet.phoneNumber,
  );
  return wallet.balanceHash === expected;
};

module.exports = { generateBalanceHash, verifyWalletIntegrity };
