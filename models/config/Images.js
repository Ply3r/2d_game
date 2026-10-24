const cache = new Map();

// Cria cada Image uma unica vez por caminho; antes cada draw() criava uma nova a cada frame.
class Images {
  static get(src) {
    let image = cache.get(src);

    if (!image) {
      image = new Image();
      image.src = src;
      cache.set(src, image);
    }

    return image;
  }
}

export default Images;
