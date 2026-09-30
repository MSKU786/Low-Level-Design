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


  constructor(private bulkReqRepo: BulkPaymentRepository) {}

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

        
        return record;
    }

    // store in db
    // fanout new payments
    // store in db
    //  paralley process them
    //
  }
}

class PaymentProvider {
  async sendPayment(payment: Payment): Promise<PaymentResult> {}
}
