import client from './client';

export interface PaymentInitiatePayload {
  courseId: string;
  amount: number;
  returnUrl?: string;
}

export interface PaymentInitiateResponse {
  paymentUrl: string;
  transactionId: string;
  amount: number;
}

export const PaymentsService = {
  initiate: (payload: PaymentInitiatePayload) =>
    client.post<PaymentInitiateResponse>('/payments/initiate', payload),
  verify: (transactionId: string, refId: string) =>
    client.post('/payments/verify', { transactionId, refId }),
};
