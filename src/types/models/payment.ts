export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type PaymentMethod = "esewa" | "khalti" | "bank_transfer" | "free";

export interface Payment {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InitiatePaymentPayload {
  courseId: string;
  method: PaymentMethod;
}

export interface InitiatePaymentResponse {
  paymentId: string;
  amount: number;
  redirectUrl?: string;
  esewaParams?: Record<string, string>;
}

export interface VerifyPaymentPayload {
  paymentId: string;
  transactionId: string;
  method: PaymentMethod;
}

export interface EPayCallbackPayload {
  oid: string;
  amt: string;
  refId: string;
}

export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  userId?: string;
}
