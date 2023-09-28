import Canvas from "./Canvas.js";

class IngameInterface {
  constructor(player) {
    this.player = player;
  }

  draw() {
    const player_attributes = this.player.attributes();
    const gun_attributes = player_attributes.curr_gun.attributes();

    const drawer = Canvas.drawer();
    drawer.fillStyle = gun_attributes.reloading || 
                       (gun_attributes.total_ammunition === 0 && gun_attributes.using_ammunition === 0) 
                       ? "rgb(255, 0, 0)" : "rgb(255, 255, 255)";

    drawer.fillRect(window.innerWidth - 250, 20, 200, 100);
    drawer.clearRect(window.innerWidth - 245, 25, 190, 90);
    const gun_img = new Image();
    gun_img.src = gun_attributes.image;
    drawer.drawImage(gun_img, window.innerWidth - 245, 25, 200, 100);

    drawer.font = "36px arial";
    drawer.fillText(`${gun_attributes.using_ammunition} / ${gun_attributes.total_ammunition}`, window.innerWidth - 380, 85);

    drawer.font = "28px arial";
    drawer.fillText(`${'❤️'.repeat(player_attributes.life)}`, 20, 50);
  }
}

export default IngameInterface;
