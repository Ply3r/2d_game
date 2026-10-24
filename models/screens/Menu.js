import Canvas from "../config/Canvas.js";
import Main from "../Main.js";

class Menu {
  constructor() {
    this.main = Main.instance();
    this.draw();

    // A fonte so carrega depois do primeiro desenho; redesenha para nao ficar com a fonte reserva.
    document.fonts.load('36px "Pixelify Sans"').then(() => {
      if (!this.main.gameRunning) this.draw();
    });

    const startGame = (event) => {
      if (event.code !== 'Space') return;
  
      this.main.startGame();
      document.removeEventListener('keydown', startGame);
    }

    document.addEventListener('keydown', startGame);
  }


  draw() {
    const drawer = Canvas.drawer();

    drawer.setTransform(1, 0, 0, 1, 0, 0);
    drawer.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.main.getMapInstance().draw();
    drawer.setTransform(1, 0, 0, 1, 0, 0);
    document.body.style.cursor = 'auto'
    drawer.fillStyle ="rgb(255, 255, 255)" 
    drawer.font = "36px Pixelify Sans";

    drawer.fillText('▶️ Press space to start', (window.innerWidth / 2) - 210, window.innerHeight / 2);
  }
}

export default Menu;
