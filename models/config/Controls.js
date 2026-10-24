import Canvas from "./Canvas.js";

let holding_click = false;
let holding_keys = [];
let listeners_added = false;
const mouse_position = { x: 0, y: 0 };

class Controls {
  static getHoldingClick() {
    return holding_click;
  }

  static getHoldingKeys() {
    return holding_keys;
  }

  static getMousePosition() {
    return mouse_position;
  }

  // Minusculas para que Shift/Caps Lock nao troquem 'w' por 'W' entre o keydown e o keyup.
  static keyDown(event) {
    const key = event.key.toLowerCase();
    if (!holding_keys.includes(key)) holding_keys.push(key);
  }

  static keyUp(event) {
    const key = event.key.toLowerCase();
    holding_keys = holding_keys.filter((held) => held != key);
  }

  // Ao perder o foco o navegador nao envia keyup/mouseup, e as teclas ficariam presas.
  static releaseAll() {
    holding_keys = [];
    holding_click = false;
  }

  static mouseMove(event) {
    mouse_position.x = event.clientX
    mouse_position.y = event.clientY
  }

  static mouseDown() {
    holding_click = true;
  }

  static mouseUp() {
    holding_click = false;
  }

  static addEventListeners() {
    if (listeners_added) return;
    listeners_added = true;

    Canvas.addListener('keydown', (event) => Controls.keyDown(event))
    Canvas.addListener('keyup', (event) => Controls.keyUp(event))
    Canvas.addListener('mousemove', (event) => Controls.mouseMove(event))
    Canvas.addListener('mousedown', () => Controls.mouseDown())
    Canvas.addListener('mouseup', () => Controls.mouseUp())
    Canvas.addListener('mouseout', () => Controls.mouseUp())
    window.addEventListener('blur', () => Controls.releaseAll())
  }
}

export default Controls;
