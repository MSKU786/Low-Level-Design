import { describe, it, expect } from 'vitest';
import {
  InMemoryRepository,
  ReservationQueue,
  Book,
  DVD,
  Member,
  Loan,
  LoanStatus,
  StudentPolicy,
  BookFine,
  DVDFine,
  FineRegistry,
  SearchService,
  BorrowService,
  ReturnService,
  type Notifier,
  type Reservation,
  type LibraryItem,
} from './Library_Management_System';

// A notifier that records messages instead of printing them.
class CapturingNotifier implements Notifier {
  readonly messages: { name: string; message: string }[] = [];
  async sendNotification(member: Member, message: string): Promise<void> {
    this.messages.push({ name: member.name, message });
  }
}

const makeBook = (id = 'book_1') =>
  new Book(id, 'Clean Code', 2008, '9780132350884', 'Robert C. Martin');
const makeDvd = (id = 'dvd_1') =>
  new DVD(id, 'Inception', 2010, 148, 'Christopher Nolan');
const makeMember = (id = 'mem_1', name = 'Alice', policy = StudentPolicy) =>
  new Member(id, name, `${name.toLowerCase()}@example.com`, '123', policy);

// -------------------------------------------------------------------
// Encapsulation — LibraryItem guards its own availability
// -------------------------------------------------------------------
describe('LibraryItem availability', () => {
  it('is available until borrowed, then available again after return', () => {
    const book = makeBook();
    expect(book.isAvailable).toBe(true);
    book.markBorrowed();
    expect(book.isAvailable).toBe(false);
    book.markReturned();
    expect(book.isAvailable).toBe(true);
  });

  it('cannot be borrowed twice', () => {
    const book = makeBook();
    book.markBorrowed();
    expect(() => book.markBorrowed()).toThrow(/already borrowed/);
  });
});

// -------------------------------------------------------------------
// Encapsulation — Member enforces its borrowing policy
// -------------------------------------------------------------------
describe('Member borrowing limit', () => {
  it('allows loans up to the policy max, then rejects', () => {
    const member = makeMember(); // StudentPolicy.maxItems === 3
    member.addLoan('l1');
    member.addLoan('l2');
    member.addLoan('l3');
    expect(member.activeLoanCount).toBe(3);
    expect(member.canBorrow()).toBe(false);
    expect(() => member.addLoan('l4')).toThrow(/capacity exhausted/);
  });

  it('frees capacity when a loan is removed', () => {
    const member = makeMember();
    member.addLoan('l1');
    member.removeLoan('l1');
    expect(member.activeLoanCount).toBe(0);
    expect(member.canBorrow()).toBe(true);
  });
});

// -------------------------------------------------------------------
// Loan — overdue detection and status lifecycle
// -------------------------------------------------------------------
describe('Loan lifecycle', () => {
  it('a fresh loan is not overdue and has no fine', () => {
    const loan = new Loan('loan_1', 'book_1', 'mem_1', 14);
    expect(loan.isOverdue).toBe(false);
    expect(loan.daysOverDue).toBe(0);
    expect(loan.status).toBe(LoanStatus.Active);
  });

  it('a loan whose due date has passed is overdue', () => {
    // negative duration => due date in the past
    const loan = new Loan('loan_1', 'book_1', 'mem_1', -5);
    expect(loan.isOverdue).toBe(true);
    expect(loan.daysOverDue).toBeGreaterThanOrEqual(5);
  });

  it('cannot be returned twice', () => {
    const loan = new Loan('loan_1', 'book_1', 'mem_1', 14);
    loan.markReturned(0);
    expect(loan.status).toBe(LoanStatus.Returned);
    expect(() => loan.markReturned(0)).toThrow(/Invalid status/);
  });
});

// -------------------------------------------------------------------
// Polymorphism / OCP — fine strategies behind one contract
// -------------------------------------------------------------------
describe('Fine strategies', () => {
  it('charges per-day rates by item type', () => {
    expect(new BookFine().calculate(3)).toBe(6); // 3 * 2
    expect(new DVDFine().calculate(3)).toBe(15); // 3 * 5
  });

  it('registry resolves a strategy by item type and rejects unknown types', () => {
    const registry = new FineRegistry();
    registry.register('book', new BookFine());
    expect(registry.getStrategy('book')).toBeInstanceOf(BookFine);
    expect(() => registry.getStrategy('magazine')).toThrow(/No fine strategy/);
  });
});

// -------------------------------------------------------------------
// Generics — one repository and queue reused across types
// -------------------------------------------------------------------
describe('InMemoryRepository<T>', () => {
  it('saves, finds, lists, filters and deletes', () => {
    const repo = new InMemoryRepository<LibraryItem>();
    const book = makeBook('book_1');
    const dvd = makeDvd('dvd_1');
    repo.save(book);
    repo.save(dvd);
    expect(repo.findById('book_1')).toBe(book);
    expect(repo.findById('missing')).toBeNull();
    expect(repo.findAll()).toHaveLength(2);
    expect(repo.findWhere((i) => i.itemType === 'DVD')).toEqual([dvd]);
    expect(repo.delete('book_1')).toBe(true);
    expect(repo.findAll()).toHaveLength(1);
  });
});

describe('ReservationQueue<T>', () => {
  it('is FIFO and reports whether reservations exist', () => {
    const q = new ReservationQueue<Reservation>();
    expect(q.hasReservations('book_1')).toBe(false);
    q.enqueue('book_1', { memberId: 'mem_1', reservedAt: new Date() });
    q.enqueue('book_1', { memberId: 'mem_2', reservedAt: new Date() });
    expect(q.hasReservations('book_1')).toBe(true);
    expect(q.dequeue('book_1')?.memberId).toBe('mem_1');
    expect(q.dequeue('book_1')?.memberId).toBe('mem_2');
    expect(q.dequeue('book_1')).toBeNull();
  });
});

// -------------------------------------------------------------------
// SearchService — composition over a generic repository
// -------------------------------------------------------------------
describe('SearchService', () => {
  const repo = new InMemoryRepository<LibraryItem>();
  const book = makeBook('book_1');
  const dvd = makeDvd('dvd_1');
  repo.save(book);
  repo.save(dvd);
  const search = new SearchService(repo);

  it('matches by searchable text (case-insensitive)', () => {
    expect(search.searchByText('martin')).toEqual([book]);
    expect(search.searchByText('nolan')).toEqual([dvd]);
  });

  it('matches by year and lists available items', () => {
    expect(search.searchByYear(2010)).toEqual([dvd]);
    book.markBorrowed();
    expect(search.getAvailable()).toEqual([dvd]);
    book.markReturned();
  });
});

// -------------------------------------------------------------------
// DIP / integration — Borrow + Return services wired from abstractions
// -------------------------------------------------------------------
describe('Borrow and return flow', () => {
  const build = () => {
    const itemRepo = new InMemoryRepository<LibraryItem>();
    const memberRepo = new InMemoryRepository<Member>();
    const loanRepo = new InMemoryRepository<Loan>();
    const reservations = new ReservationQueue<Reservation>();
    const notifier = new CapturingNotifier();
    const fineRegistry = new FineRegistry();
    fineRegistry.register('book', new BookFine());
    fineRegistry.register('DVD', new DVDFine());

    const book = makeBook('book_1');
    itemRepo.save(book);
    const alice = makeMember('mem_1');
    memberRepo.save(alice);

    const borrow = new BorrowService(itemRepo, loanRepo, memberRepo, notifier);
    const ret = new ReturnService(
      itemRepo,
      loanRepo,
      memberRepo,
      fineRegistry,
      reservations,
      notifier,
    );
    return { itemRepo, memberRepo, loanRepo, reservations, notifier, book, alice, borrow, ret };
  };

  it('borrowing marks the item unavailable and tracks the loan', async () => {
    const { borrow, book, alice, notifier } = build();
    const loan = await borrow.borrowBook(alice.id, book.id);
    expect(book.isAvailable).toBe(false);
    expect(alice.activeLoanCount).toBe(1);
    expect(loan.status).toBe(LoanStatus.Active);
    expect(notifier.messages[0].message).toMatch(/Borrowed/);
  });

  it('rejects borrowing an unavailable item', async () => {
    const { borrow, book, alice } = build();
    book.markBorrowed();
    await expect(borrow.borrowBook(alice.id, book.id)).rejects.toThrow(
      /currently borrowed/,
    );
  });

  it('rejects borrowing an unknown member', async () => {
    const { borrow, book } = build();
    await expect(borrow.borrowBook('nobody', book.id)).rejects.toThrow(
      /not found/,
    );
  });

  it('returning on time frees the item with no fine', async () => {
    const { borrow, ret, book, alice } = build();
    const loan = await borrow.borrowBook(alice.id, book.id);
    const result = await ret.returnItem(loan.id);
    expect(result.fine).toBe(0);
    expect(book.isAvailable).toBe(true);
    expect(alice.activeLoanCount).toBe(0);
    expect(loan.status).toBe(LoanStatus.Returned);
  });

  it('charges a fine when the returned loan is overdue', async () => {
    const { ret, loanRepo, book, alice } = build();
    // Seed an overdue loan directly (negative duration => due in the past).
    const loan = new Loan('loan_overdue', book.id, alice.id, -4);
    loanRepo.save(loan);
    book.markBorrowed();
    alice.addLoan(loan.id);

    const result = await ret.returnItem(loan.id);
    expect(result.fine).toBeGreaterThan(0);
    expect(result.fine).toBe(new BookFine().calculate(loan.daysOverDue));
  });

  it('notifies the next reservation holder on return', async () => {
    const { borrow, ret, reservations, memberRepo, book, alice, notifier } = build();
    const bob = makeMember('mem_2', 'Bob');
    memberRepo.save(bob);
    const loan = await borrow.borrowBook(alice.id, book.id);
    reservations.enqueue(book.id, { memberId: bob.id, reservedAt: new Date() });

    await ret.returnItem(loan.id);
    expect(
      notifier.messages.some(
        (m) => m.name === 'Bob' && /Item available/.test(m.message),
      ),
    ).toBe(true);
  });

  it('rejects returning an already-returned loan', async () => {
    const { borrow, ret, book, alice } = build();
    const loan = await borrow.borrowBook(alice.id, book.id);
    await ret.returnItem(loan.id);
    await expect(ret.returnItem(loan.id)).rejects.toThrow(/already Returned/);
  });
});
