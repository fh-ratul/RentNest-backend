export interface ICreateRentalRequest {
  propertyId: string;
  moveInDate: string;
  message?: string;
}

export interface IUpdateRentalStatus {
  status: "APPROVED" | "REJECTED" | "COMPLETED";
}

export type RentalStatus = "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "COMPLETED";
