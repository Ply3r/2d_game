import Canvas from "./Canvas.js";
import Controls from "./Controls.js";
import Main from "../Main.js";

class IngameInterface {
  draw() {
    const player = Main.instance().getPlayerInstance()
    const player_attributes = player.attributes();
    const gun_attributes = player_attributes.curr_gun.attributes();

    const drawer = Canvas.drawer();

    // Crosshair
    const mouse_position = Controls.getMousePosition();
    const crosshair_img = new Image();
    crosshair_img.src = './assets/crosshair.png';
    drawer.setTransform(1, 0, 0, 1, mouse_position.x, mouse_position.y);
    drawer.drawImage(crosshair_img, 0, 0, 25, 25);

    // Gun Image
    drawer.setTransform(1, 0, 0, 1, 0, 0);
    drawer.fillStyle = gun_attributes.reloading || 
                       (gun_attributes.total_ammunition === 0 && gun_attributes.using_ammunition === 0) 
                       ? "rgb(255, 0, 0)" : "rgb(255, 255, 255)";

    drawer.fillRect(window.innerWidth - 250, 20, 200, 100);
    drawer.clearRect(window.innerWidth - 245, 25, 190, 90);
    const gun_img = new Image();
    gun_img.src = gun_attributes.image;
    drawer.drawImage(gun_img, window.innerWidth - 245, 25, 190, 90);

    drawer.font = "36px arial";
    drawer.fillText(`${gun_attributes.using_ammunition} / ${gun_attributes.total_ammunition}`, window.innerWidth - 380, 85);

    drawer.fillStyle ="rgb(29, 28, 27)" 
    drawer.fillRect(10, 10, 210, 110);

    // Life
    drawer.fillStyle ="rgb(255, 255, 255)" 
    drawer.font = "28px arial";
    drawer.fillText(`${'❤️'.repeat(player_attributes.life)}`, 20, 50);

    // Enemies Kill Count
    drawer.fillText('💀', 20, 100);
    drawer.fillText(player_attributes.enemies_killed, 60, 100);
  }
}

export default IngameInterface;
