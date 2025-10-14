// Optional local imports (if images are placed under src/). If files do not exist, bundler will ignore? We'll guard usage below.
let localGold = null;
let localNeon = null;
let localNew = null;
try { localGold = require("../card-gold.jpg"); } catch {}
try { localNeon = require("../card-neon.jpg"); } catch {}
try { localNew = require("../card-new.jpg"); } catch {}
export const CARD_THEMES = {
  card_wb_purple: {
    label: "WB Фиолет",
    style: {
      background: "linear-gradient(135deg, #5d2efc, #9b4dff)",
      color: "#fff",
    },
  },
  card_antarctic: {
    label: "Антарктида",
    image: "./penguin-bg.jpg",
    style: { color: "#fff" },
  },
  card_neon: {
    label: "Неон",
    image: localNeon || "./card-neon.jpg", // src fallback или public
    style: { color: "#fff" },
  },
  rare_gold_card: {
    label: "Золотая карта WB",
    image: localGold || "./card-gold.jpg", // src fallback или public
    style: { color: "#1b1300" },
  },
  card_new_bg: {
    label: "Новый фон",
    image: localNew || "./card-new.jpg",
    style: { color: "#fff" },
  },
  card_russ_blue: {
    label: "Russ Голубая",
    style: {
      background: "linear-gradient(135deg, #1182d3, #5fb7ff)",
      color: "#fff",
    },
  },
};

export function getCardThemeStyle(id) {
  const t = CARD_THEMES[id];
  if (!t) return null;
  if (t.image) {
    return {
      backgroundImage: `url(${t.image})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      ...(t.style || {}),
    };
  }
  return t.style || null;
}


