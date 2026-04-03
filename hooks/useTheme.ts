import { useColorScheme } from 'react-native';

const dark = {
  bg: '#000000',
  surface: '#1c1c1e',
  surface2: '#0f172a',
  text: '#ffffff',
  textSoft: '#e2e8f0',
  textMuted: '#94a3b8',
  textFaint: '#64748b',
  textDim: '#475569',
  border: '#1e293b',
  divider: '#2d2d2d',
  isDark: true,
} as const;

const light = {
  bg: '#f8fafc',
  surface: '#ffffff',
  surface2: '#f1f5f9',
  text: '#0f172a',
  textSoft: '#1e293b',
  textMuted: '#475569',
  textFaint: '#64748b',
  textDim: '#94a3b8',
  border: '#e2e8f0',
  divider: '#e2e8f0',
  isDark: false,
} as const;

export type Theme = typeof dark;

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'light' ? light : dark;
}
