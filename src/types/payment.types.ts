export interface InitializeChargePayload {
  bookingId: string;
  phoneNumber: string;
  provider: "mtn" | "tgo" | "vdc" | string;
}