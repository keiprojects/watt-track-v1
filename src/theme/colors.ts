export type AppPalette = {
  mode: 'light' | 'dark';
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceAccent: string;
  header: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  textOnDark: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  primaryChart: string;
  secondaryChart: string;
  warningSoft: string;
  warningText: string;
  dangerSoft: string;
  dangerText: string;
  neutralSoft: string;
  shadow: string;
  statusBackground: string;
  statusText: string;
};

export const lightPalette: AppPalette = {
  mode: 'light',
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  surfaceAccent: '#ecfeff',
  header: '#0f172a',
  border: '#cbd5e1',
  text: '#0f172a',
  textMuted: '#475569',
  textSubtle: '#64748b',
  textOnDark: '#f8fafc',
  accent: '#0f766e',
  accentSoft: '#ccfbf1',
  accentText: '#115e59',
  primaryChart: '#0f766e',
  secondaryChart: '#2563eb',
  warningSoft: '#fff7ed',
  warningText: '#9a3412',
  dangerSoft: '#fee2e2',
  dangerText: '#b91c1c',
  neutralSoft: '#e2e8f0',
  shadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
  statusBackground: '#ecfeff',
  statusText: '#155e75',
};

export const darkPalette: AppPalette = {
  mode: 'dark',
  background: '#020617',
  surface: '#0f172a',
  surfaceMuted: '#111827',
  surfaceAccent: '#082f49',
  header: '#111827',
  border: '#334155',
  text: '#e2e8f0',
  textMuted: '#cbd5e1',
  textSubtle: '#94a3b8',
  textOnDark: '#f8fafc',
  accent: '#2dd4bf',
  accentSoft: '#134e4a',
  accentText: '#99f6e4',
  primaryChart: '#2dd4bf',
  secondaryChart: '#60a5fa',
  warningSoft: '#431407',
  warningText: '#fdba74',
  dangerSoft: '#450a0a',
  dangerText: '#fca5a5',
  neutralSoft: '#1e293b',
  shadow: '0 1px 2px rgba(2, 6, 23, 0.45)',
  statusBackground: '#164e63',
  statusText: '#cffafe',
};
