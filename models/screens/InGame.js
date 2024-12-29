import Canvas from "../config/Canvas.js";
import Controls from "../config/Controls.js";
import Main from "../Main.js";

class InGame {
  draw() {
    this.player = Main.instance().getPlayerInstance();
    this.drawer = Canvas.drawer();


    this.drawCrosshair();
    this.drawInventory();
    this.drawStatusBar();
  }

  drawInventory() {
    const gun_attributes = this.player.attributes().curr_gun.attributes();

    // Gun Image
    this.drawer.setTransform(1, 0, 0, 1, 0, 0);
    this.drawer.fillStyle = gun_attributes.reloading || 
                      (gun_attributes.total_ammunition === 0 && gun_attributes.using_ammunition === 0) 
                      ? "rgb(255, 0, 0)" : "rgb(255, 255, 255)";


    this.drawer.fillRect(window.innerWidth - 250, 20, 200, 100);
    this.drawer.clearRect(window.innerWidth - 245, 25, 190, 90);

    const gun_img = new Image();
    gun_img.src = gun_attributes.image;
    this.drawer.drawImage(gun_img, window.innerWidth - 245, 25, 190, 90);

    // Reloading Animation
    if (gun_attributes.reloading) {
      this.drawer.fillRect(window.innerWidth - 250, 20, 200, 100);

      const miliseconds_diff = Date.now() - gun_attributes.reload_start_time;
      const reload_percentage = (miliseconds_diff * 100) / gun_attributes.reloading_time;
      const bar_size = (reload_percentage * 190) / 100;

      this.drawer.clearRect(window.innerWidth - 245, 25, bar_size, 90);
    }

    this.drawer.font = "36px Pixelify Sans";
    this.drawer.fillText(`${gun_attributes.using_ammunition} / ${gun_attributes.total_ammunition}`, window.innerWidth - 380, 85);
  }

  drawCrosshair() {
    const mouse_position = Controls.getMousePosition();
    const crosshair_img = new Image();
    crosshair_img.src = './assets/crosshair.png';
    this.drawer.setTransform(1, 0, 0, 1, mouse_position.x, mouse_position.y);
    this.drawer.drawImage(crosshair_img, 0, 0, 25, 25);
  }

  drawStatusBar() {
    const player_attributes = this.player.attributes();

    this.drawer.fillStyle ="rgb(29, 28, 27)" 
    this.drawer.fillRect(10, 10, 210, 110);

    // Life
    this.drawer.fillStyle ="rgb(255, 255, 255)" 
    this.drawer.font = "28px Pixelify Sans";

    if (player_attributes.life >= 0)
      this.drawer.fillText(`${'❤️'.repeat(player_attributes.life)}`, 20, 50);

    // Enemies Kill Count
    this.drawer.fillText(`💀 x ${player_attributes.enemies_killed}`, 20, 100);
  }
}

export default InGame;
