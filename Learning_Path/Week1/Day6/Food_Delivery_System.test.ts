import { describe, it, expect } from "vitest";
import {
  Order,
  OrderStatus,
  Restaurant,
  OrderService,
  DefaultValidator,
  DefaultPricing,
  DefaultPaymentProcessor,
  InMemoryOrderRepo,
  ConsoleNotifier,
  StandardDelivery,
  NoDiscount,
  UPIPayment,
  type OrderItem,
} from "./Food_Delivery_System";

const pizza = (qty: number, available = 10): OrderItem => ({
  menuItem: { id: "m1", name: "Pizza", price: 200, available },
  quantity: qty,
});

// -------------------------------------------------------------------
// State machine — the guard that OCP/LSP lean on, plus the #4 regression
// -------------------------------------------------------------------
describe("Order state machine", () => {
  const newOrder = () => new Order("o1", "c1", "r1", [pizza(1)], { total: 0 });

  it("walks the happy path PLACED -> ... -> DELIVERED", () => {
    const order = newOrder();
    expect(order.getStatus()).toBe(OrderStatus.PLACED);
    order.markConfirmed();
    order.markPreparing();
    order.markOutForDelivery();
    order.markDelivered();
    expect(order.getStatus()).toBe(OrderStatus.DELIVERED);
  });

  it("rejects an invalid transition (PLACED -> PREPARING)", () => {
    const order = newOrder();
    expect(() => order.markPreparing()).toThrow(/Invalid transition/);
  });

  it("can fail an order that is still active", () => {
    const order = newOrder();
    order.markConfirmed();
    order.markFailed();
    expect(order.getStatus()).toBe(OrderStatus.FAILED);
  });

  // Regression for the #4 fix: markFailed used to set the status directly,
  // so a terminal order could be "failed". It must now be rejected.
  it("cannot fail a DELIVERED order", () => {
    const order = newOrder();
    order.markConfirmed();
    order.markPreparing();
    order.markOutForDelivery();
    order.markDelivered();
    expect(() => order.markFailed()).toThrow(/Invalid transition/);
    expect(order.getStatus()).toBe(OrderStatus.DELIVERED);
  });

  it("cannot fail a CANCELLED order", () => {
    const order = newOrder();
    order.markCancelled();
    expect(() => order.markFailed()).toThrow(/Invalid transition/);
  });
});

// -------------------------------------------------------------------
// SRP — validation lives in its own class
// -------------------------------------------------------------------
describe("DefaultValidator", () => {
  const validator = new DefaultValidator();
  const openRestaurant = new Restaurant("r1", "Dominos");

  it("accepts a valid order", () => {
    const result = validator.validate([pizza(2)], openRestaurant);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects an empty order", () => {
    const result = validator.validate([], openRestaurant);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Empty order");
  });

  it("rejects an out-of-stock order", () => {
    const result = validator.validate([pizza(5, 2)], openRestaurant);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Out of stock");
  });
});

// -------------------------------------------------------------------
// SRP/OCP — pricing is a strategy-driven calculation
// -------------------------------------------------------------------
describe("DefaultPricing", () => {
  it("computes subtotal + 5% tax + delivery - discount", () => {
    const total = new DefaultPricing().calculate(
      [pizza(2)], // subtotal 400
      new StandardDelivery(), // +40
      new NoDiscount(), // -0
      5
    );
    // 400 + (400 * 0.05 = 20) + 40 - 0
    expect(total).toBe(460);
  });
});

// -------------------------------------------------------------------
// LSP — a payment strategy must honour the PaymentStrategy contract
// -------------------------------------------------------------------
describe("UPIPayment", () => {
  it("succeeds for a valid VPA", async () => {
    const result = await new UPIPayment("manish@upi").pay();
    expect(result.status).toBe("SUCCESS");
    expect(result.transactionId).toBeDefined();
  });

  it("fails for an invalid VPA", async () => {
    const result = await new UPIPayment("not-a-vpa").pay();
    expect(result.status).toBe("FAILED");
  });
});

// -------------------------------------------------------------------
// DIP — OrderService depends only on abstractions, wired from outside
// -------------------------------------------------------------------
describe("OrderService.createOrder", () => {
  const service = new OrderService(
    new DefaultValidator(),
    new DefaultPricing(),
    new DefaultPaymentProcessor(),
    new InMemoryOrderRepo(),
    new ConsoleNotifier()
  );

  const baseParams = () => ({
    customer: { id: "c1", name: "Manish", email: "", phone: "" },
    restaurant: new Restaurant("r1", "Dominos"),
    items: [pizza(2)],
    delivery: new StandardDelivery(),
    discount: new NoDiscount(),
    distance: 5,
  });

  it("confirms and prepares an order after successful payment", async () => {
    const order = await service.createOrder({
      ...baseParams(),
      payment: new UPIPayment("manish@upi"),
    });
    expect(order.getStatus()).toBe(OrderStatus.PREPARING);
    expect(order.paymentId).toBeDefined();
  });

  it("throws when payment fails", async () => {
    await expect(
      service.createOrder({
        ...baseParams(),
        payment: new UPIPayment("not-a-vpa"),
      })
    ).rejects.toThrow(/Payment failed/);
  });
});
