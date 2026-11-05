// YOUR CHALLENGE: Refactor this to follow OCP

// Time: 30 minutes

// This shipping cost calculator violates OCP — every new
// shipping method means editing the existing function.

class ShippingCalculator {
  calculate(
    weight: number, // kg
    distance: number, // km
    method: string,
    isFragile: boolean,
  ): number {
    let cost = 0;

    if (method === 'standard') {
      cost = weight * 0.5 + distance * 0.1;
      if (isFragile) cost += 15;
    } else if (method === 'express') {
      cost = weight * 1.0 + distance * 0.25;
      cost *= 1.5; // express surcharge
      if (isFragile) cost += 25;
    } else if (method === 'overnight') {
      cost = weight * 2.0 + distance * 0.5;
      cost *= 2.0;
      if (isFragile) cost += 50;
    } else if (method === 'drone') {
      // max 5kg, max 10km
      if (weight > 5) throw new Error('Too heavy for drone');
      if (distance > 10) throw new Error('Too far for drone');

      cost = 20 + weight * 3.0;
      if (isFragile) cost += 10;
    } else if (method === 'freight') {
      // added last week broke "express" tests
      cost = 100 + weight * 0.3 + distance * 0.05;
      if (isFragile) cost += weight * 0.2;
    }

    return Math.round(cost * 100) / 100;
  }
}
