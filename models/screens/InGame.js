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
    const { inventory } = this.player.attributes();
    let inventory_array = Object.values(inventory);
    inventory_array.splice(this.player.curr_item - 1, 1);
    inventory_array = [inventory[this.player.curr_item], ...inventory_array]

    inventory_array.forEach((item, index) => {
      const weapon_attributes = item && item.attributes();

      // Gun Image
      this.drawer.setTransform(1, 0, 0, 1, 0, 0);
      this.drawer.fillStyle = "rgb(255, 255, 255)"

      if (weapon_attributes && (weapon_attributes.reloading || (weapon_attributes.total_ammunition === 0 && weapon_attributes.using_ammunition === 0))) {
        this.drawer.fillStyle = "rgb(255, 0, 0)"
      }

      const height_diff = 120 * index;
      const size_diff = index ? 30 : 0;
      const position_diff = index ? 15 : 0;

      this.drawer.fillRect(window.innerWidth - 250 + position_diff, 20 + height_diff, 200 - size_diff, 100 - size_diff);
      this.drawer.clearRect(window.innerWidth - 245 + position_diff, 25 + height_diff, 190 - size_diff, 90 - size_diff);

      if (!item) return;

      const gun_img = new Image();
      gun_img.src = weapon_attributes.image;
      this.drawer.drawImage(gun_img, window.innerWidth - 245 + position_diff, 25 + height_diff, 190 - size_diff, 90 - size_diff);

      // Reloading Animation
      if (weapon_attributes.reloading) {
        const miliseconds_diff = Date.now() - weapon_attributes.reload_start_time;
        const reload_percentage = (miliseconds_diff * 100) / weapon_attributes.reload_time;
        const bar_size = (reload_percentage * 190) / 100;

        this.drawer.fillRect(window.innerWidth - 250 + position_diff, 20 + height_diff, 200 - bar_size - size_diff, 100 - size_diff);
      }

      if (weapon_attributes.type === 'gun') {
        this.drawer.font = "36px Pixelify Sans";
        this.drawer.fillText(`${weapon_attributes.using_ammunition} / ${weapon_attributes.total_ammunition}`, window.innerWidth - 380, 85 + height_diff);
      }
    });
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
