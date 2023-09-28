import Particle from "./Particle.js";

let particles_array = [];

class Particles {
  static create(start_pos, end_pos, speed, img = null, size = null) {
    particles_array.push(new Particle(start_pos, end_pos, speed, img, size));
  }

  draw() {
    particles_array.forEach((particle) => particle.draw());
    this.update();
  }

  update() {
    particles_array = particles_array.map((particle) => particle.update());
    particles_array = particles_array.filter((particle) => particle.isVisible());
  }
}

export default Particles;
