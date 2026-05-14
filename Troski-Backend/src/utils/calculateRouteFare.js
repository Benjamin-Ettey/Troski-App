const calculateRouteFare = ({
  pickupZone,
  dropoffZone,
  distanceInKm,
  zonesConfig,
}) => {
  const routeKey = `${pickupZone}-${dropoffZone}`;
  const reverseRouteKey = `${dropoffZone}-${pickupZone}`;

  // 1. Determine Zone & Config (Fallback to REGIONAL_RURAL)
  const zone = zonesConfig[pickupZone] || zonesConfig.REGIONAL_RURAL;

  // 2. Determine Base Price
  // Check routes first (flat rates), then fallback to zone base fare
  const basePrice =
    zonesConfig.routes[routeKey] ||
    zonesConfig.routes[reverseRouteKey] ||
    zone.baseFare;

  // 3. Get Per Km Rate
  const perKmRate = zone.perKm || 0.85;

  // 4. Base Calculation
  let fare = basePrice + distanceInKm * perKmRate;

  // 5. Distance Surcharges (Long distance compensation)
  if (distanceInKm > 20) fare += 2;
  else if (distanceInKm > 12) fare += 1;

  // 6. Minimum Fare Check (CRITICAL FIX)
  const minFare = zone.minFare || 2.5;
  if (fare < minFare) fare = minFare;

  // 7. Add Platform Fee (Booking Fee)
  const platformFee = 0.3;
  let totalFare = fare + platformFee;

  totalFare = Math.round(totalFare * 2) / 2;

  const commissionRate = 0.1; // 10%
  const commissionAmount = (totalFare - platformFee) * commissionRate;

  const troskiEarnings = commissionAmount + platformFee;
  const driverEarnings = totalFare - troskiEarnings;

  return {
    pickupZone,
    basePrice,
    distanceInKm: parseFloat(distanceInKm.toFixed(2)),
    finalFare: totalFare, // What the passenger pays (Rounded)
    driverPay: parseFloat(driverEarnings.toFixed(2)), // What goes to driver wallet
    troskiProfit: parseFloat(troskiEarnings.toFixed(2)), // Your total take
    breakdown: {
      commission: parseFloat(commissionAmount.toFixed(2)),
      platformFee: platformFee,
    },
  };
};

module.exports = calculateRouteFare;
