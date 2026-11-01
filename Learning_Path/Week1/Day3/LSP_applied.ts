interface Shape {
  getArea(): number;
}

class Rectangle implements Shape {
  constructor(
    private width: number,
    private height: number,
  ) {}

  getArea(): number {
    return this.width * this.height;
  }

  setWidth(w: number): void {
    this.width = w;
  }

  setHeight(h: number): void {
    this.height = h;
  }

  getWidth(): number {
    return this.width;
  }
}

class Square implements Shape {
  constructor(private side: number) {}

  getArea(): number {
    return this.side * this.side;
  }

  setSide(s: number): void {
    this.side = s;
  }

  getSide(): number {
    return this.side;
  }
}

// Now there is not substituion problem
// Square don't pretent to be rectange anymore
// only the common part computing area is common now
