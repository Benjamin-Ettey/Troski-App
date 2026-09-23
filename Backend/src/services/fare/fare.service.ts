export const calculateRouteFare = ({
  pickupZone,
  dropoffZone,
  distanceInKm,
  zonesConfig,
}: {
  pickupZone: string;
  dropoffZone: string;
  distanceInKm: number;
  zonesConfig: any;
}) => {
  const routeKey = `${pickupZone}-${dropoffZone}`;
  const reverseRouteKey = `${dropoffZone}-${pickupZone}`;

  const zone = zonesConfig[pickupZone] || zonesConfig.REGIONAL_RURAL;

  // Known route -> flat rate. Else fall back to zone base fare.
  const basePrice =
    (zonesConfig.routes && zonesConfig.routes[routeKey]) ||
    (zonesConfig.routes && zonesConfig.routes[reverseRouteKey]) ||
    zone.baseFare;

  const perKmRate = zone.perKm || 0.85; // default per km is 0.85 GHS if zone doesn't specify
  let fare = basePrice + distanceInKm * perKmRate;

  // Distance surcharges
  if (distanceInKm > 20) fare += 2;
  else if (distanceInKm > 12) fare += 1;

  // Minimum fare floor
  const minFare = zone.minFare || 2.5; // default min is 2.5 GHS if zone doesn't specify
  if (fare < minFare) fare = minFare;

  // Platform fee on top
  const platformFee = 0.3;
  let totalFare = fare + platformFee;

  // Round to nearest 0.5
  totalFare = Math.round(totalFare * 2) / 2;

  // Commission split
  const commissionRate = 0.1;
  const commissionAmount = (totalFare - platformFee) * commissionRate;
  const troskiEarnings = commissionAmount + platformFee;
  const driverEarnings = totalFare - troskiEarnings;

  return {
    pickupZone,
    basePrice,
    distanceInKm: parseFloat(distanceInKm.toFixed(2)),
    finalFare: totalFare,
    driverPay: parseFloat(driverEarnings.toFixed(2)),
    troskiProfit: parseFloat(troskiEarnings.toFixed(2)),
    breakdown: {
      commission: parseFloat(commissionAmount.toFixed(2)),
      platformFee,
    },
  };
};
