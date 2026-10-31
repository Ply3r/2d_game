import Canvas from "../config/Canvas.js";

const FONT = '"Pixelify Sans"';
const COLORS = {
  overlay: "rgba(0, 0, 0, 0.55)",
  panel: "rgba(29, 28, 27, 0.92)",
  border: "rgb(255, 255, 255)",
  title: "rgb(242, 193, 78)",
  key: "rgb(62, 60, 56)",
  text: "rgb(255, 255, 255)",
};
const PANEL = { w: 420, h: 250 };
const OPTIONS = [
  { key: 'ESC', label: 'continuar' },
  { key: 'M', label: 'menu principal' },
];

// Tela de pause: escurece o jogo congelado por tras e mostra as opcoes.
class Pause {
  draw() {
    const drawer = Canvas.drawer();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const x = (width - PANEL.w) / 2;
    const y = (height - PANEL.h) / 2;

    drawer.save();
    drawer.setTransform(1, 0, 0, 1, 0, 0);

    drawer.fillStyle = COLORS.overlay;
    drawer.fillRect(0, 0, width, height);

    drawer.fillStyle = COLORS.panel;
    drawer.fillRect(x, y, PANEL.w, PANEL.h);
    drawer.strokeStyle = COLORS.border;
    drawer.lineWidth = 3;
    drawer.strokeRect(x + 1.5, y + 1.5, PANEL.w - 3, PANEL.h - 3);

    drawer.textAlign = "center";
    drawer.textBaseline = "alphabetic";
    drawer.fillStyle = COLORS.title;
    drawer.font = `56px ${FONT}`;
    drawer.fillText("PAUSADO", width / 2, y + 82);

    OPTIONS.forEach(({ key, label }, index) => this.drawOption(drawer, key, label, x + 70, y + 140 + index * 56));

    drawer.restore();
  }

  // [tecla] descricao
  drawOption(drawer, key, label, x, y) {
    const key_w = 70;
    const key_h = 38;

    drawer.fillStyle = COLORS.key;
    drawer.fillRect(x, y - key_h / 2, key_w, key_h);
    drawer.strokeStyle = COLORS.border;
    drawer.lineWidth = 2;
    drawer.strokeRect(x + 1, y - key_h / 2 + 1, key_w - 2, key_h - 2);

    drawer.textBaseline = "middle";
    drawer.fillStyle = COLORS.text;
    drawer.textAlign = "center";
    drawer.font = `22px ${FONT}`;
    drawer.fillText(key, x + key_w / 2, y + 2);

    drawer.textAlign = "left";
    drawer.font = `28px ${FONT}`;
    drawer.fillText(label, x + key_w + 22, y + 2);
  }
}

export default Pause;
