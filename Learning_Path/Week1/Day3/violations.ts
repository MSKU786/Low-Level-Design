// Classic Rectange and Square Example

class Rectangle {
  constructor(
    protected width: number,
    protected height: number,
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

// Every square is a rectange
class Square extends Rectangle {
  setWidth(w: number): void {
    this.width = w;
    this.height = w;
  }

  setHeight(h: number): void {
    this.width = h;
    this.height = h;
  }
}

// Problem -> this will break the square logic it will increase both height and width by doublt for square
// We can't really substiute the subclass square here
function doubleWidth(rect: Rectangle) {
  const originalWidth = rect.getWidth();
  rect.setWidth(2 * originalWidth);
}
