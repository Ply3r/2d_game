import Canvas from "./Canvas.js";

let holding_click = false;
let holding_keys = [];
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

  static keyDown(event) {
    holding_keys.push(event.key);
  }

  static keyUp(event) {
    holding_keys = holding_keys.filter((key) => key != event.key);
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
    Canvas.addListener('keydown', (event) => Controls.keyDown(event))
    Canvas.addListener('keyup', (event) => Controls.keyUp(event))
    Canvas.addListener('mousemove', (event) => Controls.mouseMove(event))
    Canvas.addListener('mousedown', () => Controls.mouseDown())
    Canvas.addListener('mouseup', () => Controls.mouseUp())
    Canvas.addListener('mouseout', () => Controls.mouseUp())
  }
}

export default Controls;
