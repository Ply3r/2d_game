import TommyGun from "../weapons/guns/TommyGun.js";
import TecNine from "../weapons/guns/TecNine.js";
import Knife from "../weapons/melee/Knife.js";
import Grenade from "../weapons/throable/Grenade.js";
import Main from "../Main.js";
import Ammunition from "../drops/Ammunition.js";
import Heart from "../drops/Heart.js";
import { HAND_Y } from "./Hand.js";

class GameEvents {
  static randomWeapon(type = null) {
    const types = {
      gun: [TommyGun],
      melee: [Knife],
      throable: [Grenade]
    }

    const available_types = ['gun', 'melee', 'throable'];
    if (!type) type = available_types[Math.floor(Math.random() * available_types.length)];
    const random_index = Math.floor(Math.random() * types[type].length);

    return new types[type][random_index]();
  }

  // Cada elemento que colide expoe hitbox() = { x, y, w, h } (canto superior esquerdo, absoluto).
  static checkCollision(first_element, second_element) {
    return GameEvents.rectsOverlap(first_element.hitbox(), second_element.hitbox());
  }

  static rectsOverlap(first, second) {
    return first.x < second.x + second.w &&
           first.x + first.w > second.x &&
           first.y < second.y + second.h &&
           first.y + first.h > second.y;
  }

  // Empurra body (tem position e hitbox()) para fora de rect, pelo eixo de menor sobreposicao.
  static pushOut(body, rect) {
    const a = body.hitbox();
    if (!GameEvents.rectsOverlap(a, rect)) return;

    const overlap_x = Math.min(a.x + a.w, rect.x + rect.w) - Math.max(a.x, rect.x);
    const overlap_y = Math.min(a.y + a.h, rect.y + rect.h) - Math.max(a.y, rect.y);

    if (overlap_x < overlap_y) {
      body.position.x += (a.x + a.w / 2 <= rect.x + rect.w / 2) ? -overlap_x : overlap_x;
    } else {
      body.position.y += (a.y + a.h / 2 <= rect.y + rect.h / 2) ? -overlap_y : overlap_y;
    }
  }

  static dropLoot(position) {
    if (Math.random() > 0.3) return;

    const possible_loots = [Ammunition, Heart];
    const random_index = Math.floor(Math.random() * possible_loots.length)
    Main.instance().getItemUpdaterInstance().create(new possible_loots[random_index](position))
  }

  static getNextPointInLine(first_point, second_point, speed) {
    const dx = second_point.x - first_point.x;
    const dy = second_point.y - first_point.y;
    const distance = Math.hypot(dx, dy);

    // Pontos coincidentes nao tem direcao; evita dividir por zero (NaN).
    if (distance === 0) return { x: first_point.x, y: first_point.y };

    return { x: first_point.x + (dx / distance) * speed, y: first_point.y + (dy / distance) * speed }
  }

  // Trajetoria do arremesso: curva de Bezier cubica [P0, P1, P2, P3] em coordenadas absolutas.
  // Sai da mao do jogador (P0, repetido em P1), e puxada para um ponto 400px acima do mais alto
  // entre jogador e alvo (P2) e termina no alvo (P3). A previa e a granada usam estes mesmos pontos.
  static getThrowPath(player_pos, target_pos) {
    const direction = target_pos.x > player_pos.x ? 1 : -1;
    const start = { x: player_pos.x + direction * 24, y: player_pos.y + HAND_Y };
    const peak = {
      x: (player_pos.x + target_pos.x) / 2,
      y: player_pos.y + Math.min(0, target_pos.y - player_pos.y) - 400
    };

    return [start, start, peak, { x: target_pos.x, y: target_pos.y }];
  }

  // Ponto da curva de Bezier cubica em t (0 = inicio, 1 = fim).
  static calculatePointOnBezier([p0, p1, p2, p3], t) {
    const u = 1 - t;
    const w0 = u * u * u;
    const w1 = 3 * u * u * t;
    const w2 = 3 * u * t * t;
    const w3 = t * t * t;

    return {
      x: w0 * p0.x + w1 * p1.x + w2 * p2.x + w3 * p3.x,
      y: w0 * p0.y + w1 * p1.y + w2 * p2.y + w3 * p3.y
    };
  }
}

export default GameEvents;
