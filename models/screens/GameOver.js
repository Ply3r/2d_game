import Canvas from "../config/Canvas.js";
import Main from "../Main.js";

class GameOver {
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
    const player = this.main.getPlayerInstance()
    const player_attributes = player.attributes();

    document.body.style.cursor = 'auto'
    drawer.clearRect(0, 0, window.innerWidth, window.innerHeight);
    drawer.fillStyle ="rgba(255, 0, 0, 0.59)" 
    drawer.fillRect(0, 0, window.innerWidth, window.innerHeight);
    drawer.fillStyle ="rgb(255, 255, 255)" 
    drawer.font = "72px Pixelify Sans";
    drawer.fillText(`GAME OVER`, (window.innerWidth / 2) - 190, (window.innerHeight / 2) - 120);
    drawer.fillText(`💀 x ${player_attributes.enemies_killed}`, (window.innerWidth / 2) - 130, (window.innerHeight / 2) - 20);
    drawer.font = "36px Pixelify Sans";
    drawer.fillText('▶️ Press space to restart', (window.innerWidth / 2) - 250, (window.innerHeight / 2) + 50);
  }
}

export default GameOver;
