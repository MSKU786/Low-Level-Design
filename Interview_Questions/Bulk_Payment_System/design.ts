interface BulkPaymentRequest {
  bulkPaymentId: string;
  payments: PaymentRequest[];
}

interface PaymentRequest {}

interface BulkPaymentRecord {}

interface PaymentRecord {}

interface PaymentResult {}

interface BulkPaymentResponse {}

class BulkPaymentOrchstrator {
  constructor() {}

  processPayment() {
    // validate the request
    // store in db
    // fanout new payments
    // store in db
    //  paralley process them
    //
  }
}
