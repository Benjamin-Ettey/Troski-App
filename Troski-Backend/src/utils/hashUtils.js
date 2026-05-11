const crypto = require("crypto");

const generateBalanceHash = (balance, escrowBalance, phoneNumber) => {
  const secret = process.env.WALLET_HASH_SECRET;
  // We include phoneNumber to prevent someone from copying a valid hash from one user to another
  const data = `${balance}:${escrowBalance}:${phoneNumber}`;
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
};

const verifyWalletIntegrity = (wallet) => {
  const expectedHash = generateBalanceHash(
    wallet.balance,
    wallet.escrowBalance,
    wallet.phoneNumber,
  );
  return wallet.balanceHash === expectedHash;
};

module.exports = { generateBalanceHash, verifyWalletIntegrity };
