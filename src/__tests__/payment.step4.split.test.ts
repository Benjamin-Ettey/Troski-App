import { splitEarnings } from "../services/payment/payment.service";

// Offline: the earnings split uses the fare ratio and must always sum exactly to
// the held amount (no cent leakage), with the driver getting the larger share.
describe("Payments Step 4 — earnings split", () => {
  it("splits the held amount into driver + platform with no leakage", () => {
    const { driverShare, platformShare } = splitEarnings(
      7,
      "ACCRA_CBD",
      "NORTH_ACC",
      12,
    );
    expect(driverShare + platformShare).toBeCloseTo(7, 2);
    expect(driverShare).toBeGreaterThan(platformShare);
    expect(driverShare).toBeGreaterThan(0);
    expect(platformShare).toBeGreaterThan(0);
  });

  it("scales with the held amount", () => {
    const one = splitEarnings(7, "ACCRA_CBD", "NORTH_ACC", 12);
    const two = splitEarnings(14, "ACCRA_CBD", "NORTH_ACC", 12);
    expect(two.driverShare).toBeGreaterThan(one.driverShare);
    expect(two.driverShare + two.platformShare).toBeCloseTo(14, 2);
  });

  it("never leaks cents on an odd amount", () => {
    const { driverShare, platformShare } = splitEarnings(
      7.77,
      "KUMASI_CBD",
      "KUMASI_NORTH",
      5,
    );
    expect(driverShare + platformShare).toBeCloseTo(7.77, 2);
  });
});
