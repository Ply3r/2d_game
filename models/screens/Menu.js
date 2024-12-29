import Canvas from "../config/Canvas.js";
import Main from "../Main.js";

class Menu {
  constructor() {
    this.main = Main.instance();
    this.draw();

    const startGame = (event) => {
      if (event.code !== 'Space') return;
  
      this.main.startGame();
      document.removeEventListener('keydown', startGame);
    }

    document.addEventListener('keydown', startGame);
  }


  draw() {
    const drawer = Canvas.drawer();

    document.body.style.cursor = 'auto'
    drawer.fillStyle ="rgb(255, 255, 255)" 
    drawer.font = "36px Pixelify Sans";

    drawer.fillText('▶️ Press space to start', (window.innerWidth / 2) - 210, window.innerHeight / 2);
  }
}

export default Menu;
