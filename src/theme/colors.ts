export type AppPalette = {
  mode: 'light' | 'dark';
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  surfaceAccent: string;
  surfaceOverlay: string;
  header: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  textOnDark: string;
  accent: string;
  accentSoft: string;
  accentGlow: string;
  accentText: string;
  primaryChart: string;
  secondaryChart: string;
  chartGrid: string;
  ringTrack: string;
  warningSoft: string;
  warningText: string;
  dangerSoft: string;
  dangerText: string;
  neutralSoft: string;
  shadow: string;
  statusBackground: string;
  statusText: string;
  scrim: string;
  skeleton: string;
};

export const lightPalette: AppPalette = {
  mode: 'light',
  background: '#f7f9fc',
  surface: '#ffffff',
  surfaceRaised: '#f3f6fb',
  surfaceMuted: '#eaf0f7',
  surfaceAccent: '#eef7ff',
  surfaceOverlay: 'rgba(255, 255, 255, 0.97)',
  header: '#ffffff',
  border: 'rgba(20, 42, 74, 0.09)',
  text: '#111b2e',
  textMuted: '#4d5c73',
  textSubtle: '#8190a5',
  textOnDark: '#f7fbff',
  accent: '#1677ff',
  accentSoft: 'rgba(22, 119, 255, 0.11)',
  accentGlow: 'rgba(22, 119, 255, 0.18)',
  accentText: '#0d5fc9',
  primaryChart: '#22a66a',
  secondaryChart: '#1677ff',
  chartGrid: 'rgba(20, 42, 74, 0.08)',
  ringTrack: 'rgba(20, 42, 74, 0.10)',
  warningSoft: '#fff4d7',
  warningText: '#9a6500',
  dangerSoft: '#ffe8e5',
  dangerText: '#bb2d20',
  neutralSoft: '#edf2f8',
  shadow: '0 12px 34px rgba(27, 53, 87, 0.08)',
  statusBackground: '#e9f7f0',
  statusText: '#177b50',
  scrim: 'rgba(11, 21, 38, 0.42)',
  skeleton: '#e5ebf3',
};

export const darkPalette: AppPalette = {
  mode: 'dark',
  background: '#08111f',
  surface: '#0f1b2d',
  surfaceRaised: '#15233a',
  surfaceMuted: '#0b1626',
  surfaceAccent: '#112a24',
  surfaceOverlay: 'rgba(15, 27, 45, 0.97)',
  header: '#0f1b2d',
  border: 'rgba(194, 216, 245, 0.10)',
  text: '#f3f7fc',
  textMuted: '#bdc9d9',
  textSubtle: '#8492a7',
  textOnDark: '#f7fbff',
  accent: '#62a8ff',
  accentSoft: 'rgba(98, 168, 255, 0.14)',
  accentGlow: 'rgba(98, 168, 255, 0.23)',
  accentText: '#aad0ff',
  primaryChart: '#76d9a5',
  secondaryChart: '#62a8ff',
  chartGrid: 'rgba(210, 226, 247, 0.07)',
  ringTrack: 'rgba(210, 226, 247, 0.10)',
  warningSoft: '#34280d',
  warningText: '#ffd16b',
  dangerSoft: '#341820',
  dangerText: '#ff9c9c',
  neutralSoft: '#1a2940',
  shadow: '0 18px 44px rgba(0, 5, 15, 0.34)',
  statusBackground: '#153428',
  statusText: '#9ce6bd',
  scrim: 'rgba(2, 8, 18, 0.72)',
  skeleton: '#1c2b42',
};
