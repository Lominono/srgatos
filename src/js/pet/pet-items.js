/**
 * Catalog of basic foods, gourmet coin treats, potions, and unlockable appearances.
 */

// Basic Everyday Foods (Free)
export const BASIC_FOODS = [
  { id: 'fish', name: 'Pescado', emoji: '🐟', hunger: 20, xp: 6, cost: 0 },
  { id: 'cookie', name: 'Galleta', emoji: '🍪', hunger: 12, xp: 4, cost: 0 },
  { id: 'milk', name: 'Leche', emoji: '🥛', hunger: 16, xp: 5, cost: 0 }
];

// Gourmet Foods (Bought with Coins)
export const GOURMET_FOODS = [
  {
    id: 'salchipapas',
    name: 'Salchipapas',
    emoji: '🍟',
    img: '/images/salchipapas.png',
    hunger: 65,
    xp: 28,
    cost: 15
  },
  {
    id: 'sushi',
    name: 'Sushi Real',
    emoji: '🍣',
    hunger: 50,
    xp: 20,
    cost: 12
  },
  {
    id: 'burger',
    name: 'Michi Burger',
    emoji: '🍔',
    hunger: 70,
    xp: 30,
    cost: 20
  },
  {
    id: 'cake',
    name: 'Tarta Festiva',
    emoji: '🍰',
    hunger: 100,
    xp: 45,
    cost: 30
  }
];

// Magic Potions (Instant Stat Power-ups)
export const POTIONS = [
  {
    id: 'potion_energy',
    name: 'Poción Energía',
    emoji: '🧪',
    effect: 'energy_max',
    desc: '100% energía al instante',
    cost: 18
  },
  {
    id: 'potion_soap',
    name: 'Jabón Dorado',
    emoji: '🧼',
    effect: 'hygiene_max',
    desc: '100% higiene con destellos',
    cost: 14
  },
  {
    id: 'potion_joy',
    name: 'Elixir Felicidad',
    emoji: '💖',
    effect: 'fun_max',
    desc: '100% ánimo y ronroneo',
    cost: 16
  }
];

// Unlockable Pet Skins (using real uploaded images)
export const OUTFITS = [
  {
    id: 'skin_default',
    name: 'Original',
    emoji: '🐱',
    img: '/images/gato.png',
    cost: 0
  },
  {
    id: 'skin_propeller',
    name: 'Gorro Hélice',
    emoji: '🧢',
    img: '/images/meowl-propeller.png',
    cost: 40
  },
  {
    id: 'skin_gentleman',
    name: 'Elegante',
    emoji: '🎩',
    img: '/images/meowl-gentleman.png',
    cost: 40
  },
  {
    id: 'skin_wild',
    name: 'Silvestre',
    emoji: '🦉',
    img: '/images/meowl-wild.png',
    cost: 35
  }
];
