import type {
  DashboardStats,
  DriverApplication,
  DriverStatus,
} from "../types/driver";

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// TEMPORARY mock data until the backend driver endpoints are connected.
// Replace the bodies of getApplications and getStats with real API calls;
// the screens won't need to change.
const mockApplications: DriverApplication[] = [
  { id: "APP-1001", fullName: "Kwame Mensah", phone: "+233 20 555 0101", email: "kwame.mensah@example.com", vehicleRegistration: "GR 4821-23", licenseNumber: "GHA-DL-100234", status: "pending", submittedAt: daysAgo(0) },
  { id: "APP-1002", fullName: "King Darius Quartey", phone: "+233 24 555 0102", email: "king.quartey@example.com", vehicleRegistration: "AS 1932-22", licenseNumber: "GHA-DL-100235", status: "pending", submittedAt: daysAgo(1) },
  { id: "APP-1003", fullName: "Kofi Boateng", phone: "+233 54 555 0103", email: "kofi.boateng@example.com", vehicleRegistration: "GT 7710-24", licenseNumber: "GHA-DL-100236", status: "needs_corrections", submittedAt: daysAgo(2) },
  { id: "APP-1004", fullName: "Benjamin Ettey", phone: "+233 20 555 0104", email: "benjamin.ettey@example.com", vehicleRegistration: "WR 3054-23", licenseNumber: "GHA-DL-100237", status: "pending", submittedAt: daysAgo(3) },
  { id: "APP-1005", fullName: "Yaw Asante", phone: "+233 27 555 0105", email: "yaw.asante@example.com", vehicleRegistration: "AS 6648-21", licenseNumber: "GHA-DL-100238", status: "approved", submittedAt: daysAgo(5) },
  { id: "APP-1006", fullName: "Kelvin Agyemang", phone: "+233 24 555 0106", email: "kelvin.agyemang@example.com", vehicleRegistration: "GE 2217-22", licenseNumber: "GHA-DL-100239", status: "pending", submittedAt: daysAgo(6) },
  { id: "APP-1007", fullName: "Kojo Appiah", phone: "+233 50 555 0107", email: "kojo.appiah@example.com", vehicleRegistration: "BA 5083-23", licenseNumber: "GHA-DL-100240", status: "rejected", submittedAt: daysAgo(8) },
  { id: "APP-1008", fullName: "Edward Twumasi", phone: "+233 20 555 0108", email: "edward.twumasi@example.com", vehicleRegistration: "AS 9014-24", licenseNumber: "GHA-DL-100241", status: "approved", submittedAt: daysAgo(10) },
  { id: "APP-1009", fullName: "Nana Yaw Darko", phone: "+233 55 555 0109", email: "nana.darko@example.com", vehicleRegistration: "GN 4471-22", licenseNumber: "GHA-DL-100242", status: "needs_corrections", submittedAt: daysAgo(12) },
  { id: "APP-1010", fullName: "Yaw Badu", phone: "+233 24 555 0110", email: "yaw.badu@example.com", vehicleRegistration: "GW 1360-23", licenseNumber: "GHA-DL-100243", status: "suspended", submittedAt: daysAgo(20) },
  { id: "APP-1011", fullName: "Samuel Tetteh", phone: "+233 27 555 0111", email: "samuel.tetteh@example.com", vehicleRegistration: "GR 8825-21", licenseNumber: "GHA-DL-100244", status: "approved", submittedAt: daysAgo(25) },
];

export async function getApplications(): Promise<DriverApplication[]> {
  await delay(600);
  return [...mockApplications].sort(
    (a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt)
  );
}

export async function getStats(): Promise<DashboardStats> {
  await delay(400);
  const count = (status: DriverStatus) =>
    mockApplications.filter((a) => a.status === status).length;

  return {
    pending: count("pending"),
    needsCorrections: count("needs_corrections"),
    approved: count("approved"),
    suspended: count("suspended"),
  };
}