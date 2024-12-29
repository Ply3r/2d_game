class ItemUpdater {
  constructor() {
    this.items = [];
  }

  reset() {
    this.items = [];
  }

  create(item) {
    this.items.push(item);
  }

  draw() {
    this.items.forEach((item) => item.draw());
    this.update();
  }

  update() {
    this.items = this.items.map((item) => item.update());
    this.items = this.items.filter((item) => item.isVisible());
  }
}

export default ItemUpdater;
