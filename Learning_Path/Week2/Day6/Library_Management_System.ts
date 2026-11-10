/*
Design and implement a library management system applying SOLID and OOP principles.
This file is cleaned and formatted for readability.
*/

import { fileURLToPath } from 'node:url';

enum LoanStatus {
  Active = 'Active',
  Returned = 'Returned',
  Overdue = 'Overdue',
}

interface HasId {
  readonly id: string;
}

interface Repository<T extends HasId> {
  save(item: T): void;
  update(item: T): void;
  findById(id: string): T | null;
  findAll(): T[];
  delete(id: string): boolean;
}

class InMemoryRepository<T extends HasId> implements Repository<T> {
  private store = new Map<string, T>();

  save(item: T): void {
    this.store.set(item.id, item);
  }

  update(item: T): void {
    this.store.set(item.id, item);
  }

  findById(id: string): T | null {
    return this.store.get(id) ?? null;
  }

  findAll(): T[] {
    return [...this.store.values()];
  }

  delete(id: string): boolean {
    return this.store.delete(id);
  }

  findWhere(predicate: (item: T) => boolean): T[] {
    return [...this.store.values()].filter(predicate);
  }
}

// Reservation queue for items
class ReservationQueue<T> {
  private queues = new Map<string, T[]>();

  enqueue(itemId: string, entry: T): void {
    const queue = this.queues.get(itemId) ?? [];
    queue.push(entry);
    this.queues.set(itemId, queue);
  }

  dequeue(itemId: string): T | null {
    const queue = this.queues.get(itemId);
    if (!queue || queue.length === 0) return null;
    return queue.shift() ?? null;
  }

  remove(itemId: string, predicate: (entry: T) => boolean): boolean {
    const queue = this.queues.get(itemId);
    if (!queue) return false;
    const index = queue.findIndex(predicate);
    if (index === -1) return false;
    queue.splice(index, 1);
    return true;
  }

  hasReservations(itemId: string): boolean {
    const queue = this.queues.get(itemId);
    return !!queue && queue.length > 0;
  }
}

interface Reservation {
  memberId: string;
  reservedAt: Date;
}

interface Notifier {
  sendNotification(member: Member, message: string): Promise<void>;
}

interface Entity {
  id: string;
  title: string;
  year: number;
}

abstract class LibraryItem implements Entity, HasId {
  id: string;
  title: string;
  year: number;
  private _available = true;

  constructor(id: string, title: string, year: number) {
    this.id = id;
    this.title = title;
    this.year = year;
  }

  get isAvailable(): boolean {
    return this._available;
  }

  markBorrowed(): void {
    if (!this._available) throw new Error(`${this.title} is already borrowed`);
    this._available = false;
  }

  markReturned(): void {
    this._available = true;
  }

  abstract get itemType(): string;

  abstract getSearchableText(): string;
}

class Book extends LibraryItem {
  ISBN: string;
  author: string;

  constructor(
    id: string,
    title: string,
    year: number,
    ISBN: string,
    author: string,
  ) {
    super(id, title, year);
    this.ISBN = ISBN;
    this.author = author;
  }

  get itemType() {
    return 'book';
  }

  getSearchableText(): string {
    return `${this.title} ${this.author} ${this.ISBN}`;
  }
}

class DVD extends LibraryItem {
  duration: number;
  director: string;

  constructor(
    id: string,
    title: string,
    year: number,
    duration: number,
    director: string,
  ) {
    super(id, title, year);
    this.duration = duration;
    this.director = director;
  }

  get itemType() {
    return 'DVD';
  }

  getSearchableText(): string {
    return `${this.title} ${this.director}`;
  }
}

// Borrowing policy
interface BorrowingPolicy {
  readonly maxItems: number;
  readonly loanDurationDays: number;
}

const StudentPolicy: BorrowingPolicy = { maxItems: 3, loanDurationDays: 14 };
const TeacherPolicy: BorrowingPolicy = { maxItems: 10, loanDurationDays: 30 };
const PublicPolicy: BorrowingPolicy = { maxItems: 5, loanDurationDays: 21 };

class Member implements HasId {
  public readonly id: string;
  public readonly name: string;
  public readonly email: string;
  public readonly phone: string;
  private _policy: BorrowingPolicy;
  private _activeLoans = new Set<string>();

  constructor(
    id: string,
    name: string,
    email: string,
    phone: string,
    policy: BorrowingPolicy,
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this._policy = policy;
  }

  get policy(): BorrowingPolicy {
    return this._policy;
  }

  get activeLoanCount(): number {
    return this._activeLoans.size;
  }

  canBorrow(): boolean {
    return this._activeLoans.size < this._policy.maxItems;
  }

  addLoan(loanId: string): void {
    if (!this.canBorrow()) throw new Error('Member capacity exhausted');
    this._activeLoans.add(loanId);
  }

  removeLoan(loanId: string): void {
    this._activeLoans.delete(loanId);
  }
}

class Loan implements HasId {
  public readonly id: string;
  public readonly itemId: string;
  public readonly memberId: string;
  public readonly borrowDate: Date;
  public readonly dueDate: Date;
  private _returnDate: Date | null = null;
  private _fine = 0;
  private _status: LoanStatus = LoanStatus.Active;

  constructor(
    id: string,
    itemId: string,
    memberId: string,
    loanDurationDays: number,
  ) {
    this.id = id;
    this.itemId = itemId;
    this.memberId = memberId;
    this.borrowDate = new Date();
    this.dueDate = new Date(
      Date.now() + loanDurationDays * 24 * 60 * 60 * 1000,
    );
  }

  get returnDate(): Date | null {
    return this._returnDate;
  }

  get fine(): number {
    return this._fine;
  }

  get status(): LoanStatus {
    return this._status;
  }

  get isOverdue(): boolean {
    const compareDate = this._returnDate ?? new Date();
    return compareDate > this.dueDate;
  }

  get daysOverDue(): number {
    if (!this.isOverdue) return 0;
    const compareDate = this._returnDate ?? new Date();
    const diff = compareDate.getTime() - this.dueDate.getTime();
    return Math.ceil(diff / (24 * 3600 * 1000));
  }

  markReturned(fine: number): void {
    if (this._status !== LoanStatus.Active) throw new Error('Invalid status');
    this._returnDate = new Date();
    this._fine = fine;
    this._status = LoanStatus.Returned;
  }

  markOverdue(): void {
    if (this._status === LoanStatus.Active) this._status = LoanStatus.Overdue;
  }
}

// Fine strategies
interface FineStrategy {
  calculate(daysOverDue: number): number;
}

class BookFine implements FineStrategy {
  calculate(daysOverDue: number): number {
    return daysOverDue * 2;
  }
}

class DVDFine implements FineStrategy {
  calculate(daysOverDue: number): number {
    return daysOverDue * 5;
  }
}

class FineRegistry {
  private strategies = new Map<string, FineStrategy>();

  register(itemType: string, strategy: FineStrategy): void {
    this.strategies.set(itemType, strategy);
  }

  getStrategy(itemType: string): FineStrategy {
    const strategy = this.strategies.get(itemType);
    if (!strategy) throw new Error('No fine strategy found');
    return strategy;
  }
}

class SearchService {
  constructor(private itemRepo: Repository<LibraryItem>) {}

  searchByText(query: string): LibraryItem[] {
    const q = query.trim().toLowerCase();
    return this.itemRepo
      .findAll()
      .filter((item) => item.getSearchableText().toLowerCase().includes(q));
  }

  searchByYear(year: number): LibraryItem[] {
    return this.itemRepo.findAll().filter((item) => item.year === year);
  }

  getAvailable(): LibraryItem[] {
    return (this.itemRepo as InMemoryRepository<LibraryItem>).findWhere(
      (item) => item.isAvailable,
    );
  }
}

class BorrowService {
  constructor(
    private itemRepo: Repository<LibraryItem>,
    private loanRepo: InMemoryRepository<Loan>,
    private memberRepo: Repository<Member>,
    private notifier: Notifier,
  ) {}

  async borrowBook(memberId: string, itemId: string): Promise<Loan> {
    const member = this.memberRepo.findById(memberId);
    if (!member) throw new Error(`Member ${memberId} not found`);

    const item = this.itemRepo.findById(itemId);
    if (!item) throw new Error(`Item ${itemId} not found`);

    if (!member.canBorrow())
      throw new Error(
        `${member.name} has reached borrowing limit (${member.policy.maxItems})`,
      );
    if (!item.isAvailable)
      throw new Error(`${item.title} is currently borrowed`);

    const loan = new Loan(
      `loan_${Date.now()}`,
      itemId,
      memberId,
      member.policy.loanDurationDays,
    );

    item.markBorrowed();
    member.addLoan(loan.id);

    this.loanRepo.save(loan);

    await this.notifier.sendNotification(
      member,
      `Borrowed: ${item.title} (loan id: ${loan.id})`,
    );

    return loan;
  }
}

class ReturnService {
  constructor(
    private itemRepo: Repository<LibraryItem>,
    private loanRepo: InMemoryRepository<Loan>,
    private memberRepo: Repository<Member>,
    private fineRegistry: FineRegistry,
    private reservations: ReservationQueue<Reservation>,
    private notifier: Notifier,
  ) {}

  async returnItem(loanId: string): Promise<{ loan: Loan; fine: number }> {
    const loan = this.loanRepo.findById(loanId);
    if (!loan) throw new Error(`Loan ${loanId} not found`);

    if (
      loan.status !== LoanStatus.Active &&
      loan.status !== LoanStatus.Overdue
    ) {
      throw new Error(`Loan ${loanId} is already ${loan.status}`);
    }

    const item = this.itemRepo.findById(loan.itemId);
    if (!item) throw new Error(`Item ${loan.itemId} not found`);

    const member = this.memberRepo.findById(loan.memberId);
    if (!member) throw new Error(`Member ${loan.memberId} not found`);

    const fineStrategy = this.fineRegistry.getStrategy(item.itemType);
    const fine = loan.isOverdue ? fineStrategy.calculate(loan.daysOverDue) : 0;

    loan.markReturned(fine);
    item.markReturned();
    member.removeLoan(loan.id);

    this.loanRepo.update(loan);

    await this.notifier.sendNotification(
      member,
      `Returned: ${item.title}. Fine: ${fine}`,
    );

    if (this.reservations.hasReservations(item.id)) {
      const next = this.reservations.dequeue(item.id);
      if (next) {
        const nextMember = this.memberRepo.findById(next.memberId);
        if (nextMember)
          await this.notifier.sendNotification(
            nextMember,
            `Item available: ${item.title}`,
          );
      }
    }

    return { loan, fine };
  }
}

class ConsoleNotifier implements Notifier {
  async sendNotification(member: Member, message: string): Promise<void> {
    console.log(`Notify ${member.name} <${member.email}>: ${message}`);
  }
}

// --- Exports (for tests / reuse) ---
export {
  LoanStatus,
  InMemoryRepository,
  ReservationQueue,
  LibraryItem,
  Book,
  DVD,
  Member,
  Loan,
  StudentPolicy,
  TeacherPolicy,
  PublicPolicy,
  BookFine,
  DVDFine,
  FineRegistry,
  SearchService,
  BorrowService,
  ReturnService,
  ConsoleNotifier,
};
export type { Repository, Notifier, Reservation, BorrowingPolicy, Entity, HasId };

// --- Demo runner ---
function id(prefix: string) {
  return `${prefix}_${Math.floor(Math.random() * 10000)}`;
}

async function demo() {
  const itemRepo = new InMemoryRepository<LibraryItem>();
  const memberRepo = new InMemoryRepository<Member>();
  const loanRepo = new InMemoryRepository<Loan>();
  const reservations = new ReservationQueue<Reservation>();
  const notifier = new ConsoleNotifier();

  const fineRegistry = new FineRegistry();
  fineRegistry.register('book', new BookFine());
  fineRegistry.register('DVD', new DVDFine());

  const book1 = new Book(
    id('book'),
    'Clean Code',
    2008,
    '9780132350884',
    'Robert C. Martin',
  );
  const dvd1 = new DVD(id('dvd'), 'Inception', 2010, 148, 'Christopher Nolan');

  itemRepo.save(book1);
  itemRepo.save(dvd1);

  const alice = new Member(
    id('mem'),
    'Alice',
    'alice@example.com',
    '1234567890',
    StudentPolicy,
  );
  memberRepo.save(alice);

  const borrowService = new BorrowService(
    itemRepo,
    loanRepo,
    memberRepo,
    notifier,
  );
  const returnService = new ReturnService(
    itemRepo,
    loanRepo,
    memberRepo,
    fineRegistry,
    reservations,
    notifier,
  );

  console.log(
    'Available items before borrow:',
    itemRepo.findAll().map((i) => `${i.title} (${i.id})`),
  );

  const loan = await borrowService.borrowBook(alice.id, book1.id);
  console.log('Loan created:', loan.id, 'due:', loan.dueDate.toISOString());

  const res = await returnService.returnItem(loan.id);
  console.log('Return processed. Fine:', res.fine);
}

// Run the demo only when executed directly, not when imported by tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  demo().catch((err) => console.error('Demo error:', err));
}
