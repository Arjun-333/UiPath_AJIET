// 32-Color Curated Warm Palette for Autonomia Isometric Headquarters
// Complies with 2:1 pixel-art palette restrictions (Screenshot 2 style)

export const ISO_PALETTE = {
  // Background & Backdrops (Soft, light, muted - no dark void)
  bg_canvas: '#E6E9F5',
  bg_canvas_soft: '#DFE3F0',
  bg_card: '#F4F6FC',

  // Floor Tiles (Pale cream / warm light grey with soft grid lines)
  floor_light: '#F8FAFC',
  floor_medium: '#EEF2F6',
  floor_dark: '#DCE2EC',
  floor_grid: '#C8D1E0',
  slab_face: '#3B4254',
  slab_trim: '#2B3140',

  // Walls & Architecture (Warm off-white / pale linen)
  wall_top: '#FCFDF7',
  wall_left: '#F3F4EE',
  wall_right: '#E4E7DC',
  wall_outline: '#ABB0A0',
  wall_baseboard: '#64748B',

  // Wood & Furniture Surfaces (Honey oak / golden amber)
  wood_top: '#F7C67D',
  wood_left: '#E5A955',
  wood_right: '#BD8036',
  wood_outline: '#7C4F1A',

  // Storage & Cabinets (Clean office off-white / light slate)
  metal_top: '#FFFFFF',
  metal_left: '#F1F5F9',
  metal_right: '#CBD5E1',
  metal_outline: '#64748B',

  // Chairs & Upholstery (Executive Indigo / Purple / Denim)
  fabric_top: '#818CF8',
  fabric_left: '#6366F1',
  fabric_right: '#4F46E5',
  fabric_outline: '#3730A3',

  // Electronics & Hardware (Charcoal & Screens)
  tech_dark: '#1E293B',
  tech_screen: '#0F172A',
  tech_glow: '#38BDF8',

  // Accent & Wall Decor (Warm Orange, Leaf Green, Red)
  accent_orange: '#FB923C',
  accent_clock: '#EA580C',
  plant_leaf: '#22C55E',
  plant_dark: '#15803D',
  pot_terracotta: '#F97316',
  accent_red: '#EF4444',
  accent_gold: '#FACC15',

  // Shadows & Outlines
  shadow_soft: 'rgba(30, 41, 59, 0.16)',
  outline_dark: '#1E293B',
} as const;

export type IsoPaletteKey = keyof typeof ISO_PALETTE;
