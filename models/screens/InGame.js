import Canvas from "../config/Canvas.js";
import Images from "../config/Images.js";
import Controls from "../config/Controls.js";
import Main from "../Main.js";

const FONT = '"Pixelify Sans"';
const COLORS = {
  panel: "rgba(29, 28, 27, 0.85)",
  panel_selected: "rgba(62, 60, 56, 0.92)",
  border: "rgb(255, 255, 255)",
  dim: "rgba(255, 255, 255, 0.45)",
  warning: "rgb(242, 193, 78)",
  danger: "rgb(232, 69, 60)",
  shadow: "rgba(0, 0, 0, 0.8)"
};

const HEART = { size: 36, gap: 8 };
const SLOT = { w: 140, h: 100, gap: 12, margin: 24, raise: 14 };
const HOTBAR_KEYS = [1, 2, 3, 4];
const LOW_AMMO_RATIO = 0.25;

class InGame {
  draw() {
    this.player = Main.instance().getPlayerInstance();
    this.drawer = Canvas.drawer();
    this.drawer.setTransform(1, 0, 0, 1, 0, 0);

    this.drawDamageOverlay();
    this.drawStatusPanel();
    this.drawWave();
    this.drawHotbar();
    this.drawHint();
    this.drawCrosshair();
  }

  // Painel com borda; usado pelo status e pelos slots.
  panel(x, y, w, h, { fill = COLORS.panel, border = COLORS.border, line = 3 } = {}) {
    this.drawer.fillStyle = fill;
    this.drawer.fillRect(x, y, w, h);
    this.drawer.strokeStyle = border;
    this.drawer.lineWidth = line;
    this.drawer.strokeRect(x + line / 2, y + line / 2, w - line, h - line);
  }

  // Desenha a imagem inteira dentro da caixa, sem distorcer. Sprites pequenos (pixel art)
  // ampliam sem suavizar para manter os pixels nitidos.
  drawIcon(src, x, y, w, h, alpha = 1) {
    const image = Images.get(src);
    if (!image.naturalWidth) return;

    const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;

    this.drawer.save();
    this.drawer.imageSmoothingEnabled = scale < 1;
    this.drawer.globalAlpha = alpha;
    this.drawer.drawImage(image, x + (w - width) / 2, y + (h - height) / 2, width, height);
    this.drawer.restore();
  }

  // Texto com contorno escuro para ler bem sobre o cenario.
  drawOutlinedText(text, x, y, { size, color, align = "center" }) {
    this.drawer.save();
    this.drawer.font = `${size}px ${FONT}`;
    this.drawer.textAlign = align;
    this.drawer.lineJoin = "round";
    this.drawer.lineWidth = 5;
    this.drawer.strokeStyle = COLORS.shadow;
    this.drawer.strokeText(text, x, y);
    this.drawer.fillStyle = color;
    this.drawer.fillText(text, x, y);
    this.drawer.restore();
  }

  pulse(speed = 150) {
    return 0.5 + 0.5 * Math.sin(Date.now() / speed);
  }

  // Vinheta vermelha: forte ao levar dano (some junto com a invencibilidade) e suave com 1 de vida.
  drawDamageOverlay() {
    const { life, last_hit_time } = this.player.attributes();
    const since_hit = Date.now() - last_hit_time;
    const flash_time = this.player.INVENCIBLE_TIME_AFTER_HIT;

    let alpha = since_hit < flash_time ? 0.55 * (1 - since_hit / flash_time) : 0;
    if (life === 1) alpha = Math.max(alpha, 0.12 + 0.1 * this.pulse());
    if (alpha <= 0) return;

    const { innerWidth: width, innerHeight: height } = window;
    const gradient = this.drawer.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.35, width / 2, height / 2, Math.hypot(width, height) / 2);
    gradient.addColorStop(0, "rgba(200, 0, 0, 0)");
    gradient.addColorStop(1, `rgba(200, 0, 0, ${alpha})`);

    this.drawer.fillStyle = gradient;
    this.drawer.fillRect(0, 0, width, height);
  }

  // Vida (coracoes, os que faltam aparecem apagados) e abates.
  drawStatusPanel() {
    const { life, max_life, enemies_killed } = this.player.attributes();
    const padding = 16;
    const x = 16;
    const y = 16;
    const width = padding * 2 + max_life * HEART.size + (max_life - 1) * HEART.gap;

    this.panel(x, y, width, 100);

    for (let i = 0; i < max_life; i += 1) {
      let alpha = i < life ? 1 : 0.2;
      if (life === 1 && i === 0) alpha = 0.55 + 0.45 * this.pulse();

      this.drawIcon('./assets/drops/heart.png', x + padding + i * (HEART.size + HEART.gap), y + 14, HEART.size, HEART.size, alpha);
    }

    this.drawer.save();
    this.drawer.fillStyle = COLORS.dim;
    this.drawer.font = `20px ${FONT}`;
    this.drawer.fillText("KILLS", x + padding, y + 82);
    this.drawer.fillStyle = COLORS.border;
    this.drawer.font = `34px ${FONT}`;
    this.drawer.textAlign = "right";
    this.drawer.fillText(`${enemies_killed}`, x + width - padding, y + 84);
    this.drawer.restore();
  }

  // Horda atual e inimigos restantes no topo; no intervalo, anuncia a proxima com a contagem.
  drawWave() {
    const main = Main.instance();
    const { wave, next_wave, intermission, seconds_left, enemies_left } = main.getWavesInstance().attributes(main.getEnemiesInstance());
    const center = window.innerWidth / 2;

    if (wave > 0) {
      this.drawOutlinedText(`HORDA ${wave}`, center, 48, { size: 36, color: COLORS.border });
      if (!intermission) this.drawOutlinedText(`${enemies_left} restantes`, center, 80, { size: 22, color: COLORS.dim });
    }

    if (intermission) {
      const alpha = 0.75 + 0.25 * this.pulse(300);
      this.drawer.save();
      this.drawer.globalAlpha = alpha;
      this.drawOutlinedText(`HORDA ${next_wave}`, center, window.innerHeight * 0.3, { size: 72, color: COLORS.warning });
      this.drawOutlinedText(`começa em ${seconds_left}`, center, window.innerHeight * 0.3 + 44, { size: 28, color: COLORS.border });
      this.drawer.restore();
    }
  }

  // Quatro slots fixos no centro de baixo, na ordem das teclas 1-4; o selecionado sobe e destaca.
  drawHotbar() {
    const { inventory } = this.player.attributes();
    const { x, y } = this.hotbarOrigin();

    HOTBAR_KEYS.forEach((key, index) => {
      const selected = Number(this.player.curr_item) === key;
      const slot_y = y - (selected ? SLOT.raise : 0);

      this.drawSlot(inventory[key], key, x + index * (SLOT.w + SLOT.gap), slot_y, selected);
    });
  }

  hotbarOrigin() {
    const total_width = HOTBAR_KEYS.length * SLOT.w + (HOTBAR_KEYS.length - 1) * SLOT.gap;

    return { x: (window.innerWidth - total_width) / 2, y: window.innerHeight - SLOT.h - SLOT.margin };
  }

  drawSlot(item, key, x, y, selected) {
    const attributes = item && item.attributes();
    const is_gun = !!attributes && attributes.type === 'gun';
    const no_ammo = is_gun && attributes.using_ammunition === 0 && attributes.total_ammunition === 0;

    this.panel(x, y, SLOT.w, SLOT.h, {
      fill: selected ? COLORS.panel_selected : COLORS.panel,
      border: no_ammo ? COLORS.danger : (selected ? COLORS.border : COLORS.dim),
      line: selected ? 4 : 3
    });

    this.drawer.save();
    this.drawer.fillStyle = selected ? COLORS.border : COLORS.dim;
    this.drawer.font = `18px ${FONT}`;
    this.drawer.fillText(`${key}`, x + 9, y + 22);
    this.drawer.restore();

    if (!item) return;

    const reloading = attributes.reloading;
    const ammo_height = is_gun ? 30 : 0;
    this.drawIcon(attributes.image, x + 8, y + 6, SLOT.w - 16, SLOT.h - 12 - ammo_height, reloading ? 0.45 : 1);

    if (is_gun) this.drawAmmo(attributes, x, y);
    if (reloading) this.drawReloadBar(attributes, x, y);
  }

  drawAmmo(attributes, x, y) {
    const { using_ammunition, total_ammunition, magazine_size } = attributes;
    let color = COLORS.border;

    if (using_ammunition === 0) color = COLORS.danger;
    else if (using_ammunition <= magazine_size * LOW_AMMO_RATIO) color = COLORS.warning;

    this.drawer.save();
    this.drawer.fillStyle = color;
    this.drawer.font = `20px ${FONT}`;
    this.drawer.textAlign = "center";
    this.drawer.fillText(`${using_ammunition} / ${total_ammunition}`, x + SLOT.w / 2, y + SLOT.h - 15);
    this.drawer.restore();
  }

  drawReloadBar(attributes, x, y) {
    const elapsed = Date.now() - attributes.reload_start_time;
    const progress = Math.min(Math.max(elapsed / attributes.reload_time, 0), 1);
    const bar_width = SLOT.w - 12;

    this.drawer.fillStyle = COLORS.border;
    this.drawer.fillRect(x + 6, y + SLOT.h - 12, bar_width * progress, 5);
  }

  // Aviso acima do slot selecionado quando a arma de fogo precisa de atencao.
  drawHint() {
    const { inventory } = this.player.attributes();
    const attributes = inventory[this.player.curr_item] && inventory[this.player.curr_item].attributes();
    if (!attributes || attributes.type !== 'gun' || attributes.reloading || attributes.using_ammunition > 0) return;

    const { x, y } = this.hotbarOrigin();
    const center = x + (HOTBAR_KEYS.length * SLOT.w + (HOTBAR_KEYS.length - 1) * SLOT.gap) / 2;
    const hint_y = y - SLOT.raise - 14;

    if (attributes.total_ammunition > 0) {
      if (this.pulse(200) > 0.25) this.drawOutlinedText("PRESS R TO RELOAD", center, hint_y, { size: 26, color: COLORS.warning });
    } else {
      this.drawOutlinedText("NO AMMO", center, hint_y, { size: 26, color: COLORS.danger });
    }
  }

  // Centrada no mouse: e nele que as balas e a granada miram.
  drawCrosshair() {
    const mouse_position = Controls.getMousePosition();
    const crosshair_img = Images.get('./assets/crosshair.png');
    const size = 26;

    this.drawer.drawImage(crosshair_img, mouse_position.x - size / 2, mouse_position.y - size / 2, size, size);
  }
}

export default InGame;
