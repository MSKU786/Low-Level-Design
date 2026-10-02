interface BulkPaymentRepository {
  createIfNotExists(record: BulkPaymentRecord): Promise<boolean>;
  findById(id: string): Promise<BulkPaymentRecord | null>;
  updateStatus(bulkPaymentId: string, status: BulkPaymentStatus): Promise<void>;
}

interface PaymentRepository {
  createIfNotExist(record: PaymentRecord): Promise<boolean>;
  findById(id: string): Promise<PaymentRecord | null>;
  updateStatus(paymentId: string, status: PaymentStatus): Promise<void>;
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
  status: PaymentStatus;
  id: string
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

  limit = 20;

  constructor(private bulkReqRepo: BulkPaymentRepository,
    private paymentRepo: PaymentRepository,
    private paymentProvider: PaymentProvider
  ) {}

  processPayment(data: BulkPaymentRequest) {
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
    const payments = data.payments;
    const paymentRequests = [];
    const results = [];
    // Create payment records and process in parallel
    for (let i=0; i<payloadLength; i++) {
        const paymentRecord = {
          id: payments[i].id,
          beneficiaryId: data.payments[i].beneficiaryId,
          amount: payments[i].amount,
          currency: payments[i].currency,
          status: PaymentStatus.PENDING,
          bulkPaymentId: data.bulkPaymentId
        }

        const insertStatus = this.paymentRepo.createIfNotExist(paymentRecord);

        if (!insertStatus) {
          console.log("Duplicate payment :", paymentRecord);
          continue;
        }

        const request: PaymentRequest = {
          ...paymentRecord
        }

        paymentRequests.push(request);
    }

    //const results = await Promise.allSettled(paymentRequests)
    for (let k=0; k<payloadLength ; k+=this.limit) {
      const paymentsSlice = paymentRequests.slice(k, k+this.limit);

      for (let i=0; i<this.limit; i++) {
        this.paymentRepo.updateStatus(paymentsSlice[i].id, PaymentStatus.PROCESSING);
        paymentsSlice[i].status = PaymentStatus.PROCESSING;
      }

      const res = await Promise.allSettled(paymentsSlice.map((p) => this.paymentProvider.sendPayment(p)));+
      res.map((r) => this.paymentRepo.updateStatus(r.id, r.status))

      results.push(...res)
    }

    return results;
  }

}

class PaymentProvider {
  async sendPayment(payment: PaymentRequest): Promise<PaymentResult> {
    const paymentResult: PaymentResult = {
      id: payment.id,
      status: Math.floor(Math.random()*100)%2 === 0 ? PaymentStatus.FAILED : PaymentStatus.COMPLETED
    }

    return Promise.resolve(paymentResult);
  }
}
