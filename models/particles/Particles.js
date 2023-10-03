class Particles {
  constructor() {
    this.particles_array = [];
  }

  create(particle) {
    this.particles_array.push(particle);
  }

  draw() {
    this.particles_array.forEach((particle) => particle.draw());
    this.update();
  }

  update() {
    this.particles_array = this.particles_array.map((particle) => particle.update());
    this.particles_array = this.particles_array.filter((particle) => particle.isVisible());
  }
}

export default Particles;
