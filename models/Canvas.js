const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Canvas {
  static drawer() {
    return canvas.getContext("2d");
  }

  static addListener(type, callback) {
    document.addEventListener(type, callback);
  }

  static draw(items) {
    const drawer = Canvas.drawer()
    drawer.clearRect(0, 0, canvas.width, canvas.height);

    items.forEach(item => {
      drawer.setTransform(1, 0, 0, 1, 0, 0);
      item.draw();
      drawer.setTransform(1, 0, 0, 1, 0, 0);
    });

    drawer.restore();
  }
}

export default Canvas
