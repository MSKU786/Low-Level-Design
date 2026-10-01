interface BulkPaymentRepository {
  createIfNotExists(record: BulkPaymentRecord): Promise<boolean>;
  findById(id: string): Promise<BulkPaymentRecord | null>;
  updateStatus(bulkPaymentId: string, status: BulkPaymentStatus): Promise<void>;
}

interface PaymentRepository {
  createIfNotExist(record: PaymentRecord): Promise<boolean>;
  findById(id: string): Promise<PaymentRecord | null>;
  updateStatus(bulkPaymentId: string, status: PaymentStatus): Promise<void>;
}

enum BulkPaymentStatus {
  PENDING,
  PROCESSING,
  COMPLETED,
  PARTIALLY_COMPLETED,
  FAILED,
}

enum PaymentStatus {
  COMPLETED,
  PENDING,
  FAILED,
  PROCESSING,
  ERROR,
}

interface PaymentRequest {
  readonly id: string;
  beneficiaryId: string;
  amount: number;
  currency: string;
}

interface BulkPaymentRequest {
  bulkPaymentId: string;
  payments: PaymentRequest[];
}

interface BulkPaymentRecord {
  readonly id: string;
  status: BulkPaymentStatus;
  bulkPaymentId: string;
  payments: string[];
}

interface PaymentRecord {
  readonly id: string;
  beneficiaryId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
}

interface PaymentResult {
  status: string;
  error: string | null;
}

interface PaymentResponse {
  id: string;
  status: string;
}

interface BulkPaymentResponse {
  bulkPaymentId: 'string';
  status: BulkPaymentResponse;
  payments: PaymentResponse[];
}

class BulkPaymentOrchstrator {


  constructor(private bulkReqRepo: BulkPaymentRepository,
    private paymentRepo: PaymentRepository,
    private paymentProvider: PaymentProvider
  ) {}

  processPayment(data: BulkPaymentRequest) {

    const {}
    // validate the request
    try {
        const {result, err} = this.validateRequest(data);

        if (err) {
          throw new Error(err);
        }

        const record : BulkPaymentRecord = {
          id: crypto.randomUUID(),
          status: BulkPaymentStatus.PENDING,
          bulkPaymentId: data.bulkPaymentId,
          payments: data.payments
        }

        const insertResponse = this.bulkReqRepo.createIfNotExists(record);

        if (!insertResponse) {
          throw new Error("Record already exist")
        }

        
        const payments = await this.processPaymentsBulk(data);



        const complted = payments.every(payment => payment.status === PaymentStatus.COMPLETED);
        const failed = payments.every(payment => payment.status === PaymentStatus.FAILED)

        const bulkResponse = {
          id: data.bulkPaymentId,
          payments,
          status: complted ? BulkPaymentStatus.COMPLETED : failed ? BulkPaymentStatus.FAILED : BulkPaymentStatus.PARTIALLY_COMPLETED
        }

        return bulkResponse;
    }

    // store in db
    // fanout new payments
    // store in db
    //  paralley process them
    //
  }


  async processPaymentsBulk(data: BulkPaymentRequest): PaymentResult[] {

    const payloadLength = data.payments.length;
    const paymentRequests = [];
    // Create payment records and process in parallel
    for (let i=0; i<payloadLength; i++) {
        const paymentRecord = {
          id: crypto.randomUUID(),
          beneficiaryId: data.beneficiaryId,
          amount: data.amount,
          currency: data.currency,
          status: PaymentStatus.PENDING
        }

        const insertStatus = this.paymentRepo.createIfNotExist(paymentRecord);

        if (!insertStatus) {
          console.log("Duplicate payment :", paymentRecord);
        }

        const request: PaymentRequest = {
          ...paymentRecord
        }

        paymentRequests.push(this.paymentProvider.sendPayment(request));
    }

    const results = await Promise.allSettled(paymentRequests)
    return results;
  }

}

class PaymentProvider {
  async sendPayment(payment: PaymentRequest): Promise<PaymentResult> {}
}
