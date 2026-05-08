// src/components/shared.js
// Shared colors used across all screens.
// Change a color here and it updates everywhere.

export const COLORS = {
  greenDark:  '#1a3a2a',
  greenMid:   '#2d6a4f',
  greenLight: '#52b788',
  greenPale:  '#d8f3dc',
  gold:       '#e9c46a',
  white:      '#ffffff',
  offWhite:   '#f8fffe',
  grayLight:  '#f0f4f1',
  grayMid:    '#8a9e91',
  textDark:   '#0d1f17',
  danger:     '#e63946',
  warning:    '#f4a261',
  blue:       '#3a86ff',
}

// Category colors and emojis — matches the web app exactly
export const CATEGORY = {
  conservation:  { emoji: '🌍', color: '#2d6a4f' },
  biodiversity:  { emoji: '🦋', color: '#3a86ff' },
  'eco-tourism': { emoji: '🌿', color: '#52b788' },
  legislation:   { emoji: '⚖️', color: '#e9c46a' },
  safety:        { emoji: '🦺', color: '#e63946' },
}

// Shared shadow style for cards
export const SHADOW = {
  shadowColor: '#1a3a2a',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
}
