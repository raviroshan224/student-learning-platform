import client from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
  Payment,
  InitiatePaymentPayload,
  InitiatePaymentResponse,
  VerifyPaymentPayload,
  EPayCallbackPayload,
  PaymentQueryParams,
} from "@/types/models/payment";

export const PaymentService = {
  initiate: (payload: InitiatePaymentPayload) =>
    client.post<ApiResponse<InitiatePaymentResponse>>("/payments/initiate", payload),

  verify: (payload: VerifyPaymentPayload) =>
    client.post<ApiResponse<Payment>>("/payments/verify", payload),

  ePayCallback: (payload: EPayCallbackPayload) =>
    client.post<ApiResponse<Payment>>("/payments/epay/callback", payload),

  verifyReceipt: (paymentId: string, receiptFile: File) => {
    const form = new FormData();
    form.append("receipt", receiptFile);
    return client.post<ApiResponse<Payment>>(`/payments/${paymentId}/verify-receipt`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getHistory: (params?: PaymentQueryParams) =>
    client.get<PaginatedResponse<Payment>>("/payments", { params }),

  getById: (id: string) =>
    client.get<ApiResponse<Payment>>(`/payments/${id}`),
};
