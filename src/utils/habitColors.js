export const HABIT_COLORS = {
  violet:  { gradient: 'linear-gradient(135deg, #ede9ff 0%, #ddd6ff 100%)', accent: '#6c63ff', border: '#c4b5fd' },
  teal:    { gradient: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)', accent: '#0d9488', border: '#5eead4' },
  rose:    { gradient: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)', accent: '#e11d48', border: '#fda4af' },
  amber:   { gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', accent: '#d97706', border: '#fcd34d' },
  sky:     { gradient: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', accent: '#0284c7', border: '#7dd3fc' },
  emerald: { gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', accent: '#059669', border: '#6ee7b7' },
  pink:    { gradient: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', accent: '#db2777', border: '#f9a8d4' },
  orange:  { gradient: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', accent: '#ea580c', border: '#fdba74' },
}

export const COLOR_KEYS = Object.keys(HABIT_COLORS)

export function getHabitColor(colorKey) {
  return HABIT_COLORS[colorKey] || HABIT_COLORS.violet
}
