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
  background: '#f4f8fb',
  surface: '#ffffff',
  surfaceRaised: '#f8fbff',
  surfaceMuted: '#eef3f8',
  surfaceAccent: '#edf5ff',
  surfaceOverlay: 'rgba(255, 255, 255, 0.97)',
  header: '#ffffff',
  border: 'rgba(8, 26, 57, 0.09)',
  text: '#071734',
  textMuted: '#46556d',
  textSubtle: '#7b899f',
  textOnDark: '#f7fbff',
  accent: '#2563eb',
  accentSoft: 'rgba(37, 99, 235, 0.11)',
  accentGlow: 'rgba(37, 99, 235, 0.18)',
  accentText: '#1d4ed8',
  primaryChart: '#5fbd67',
  secondaryChart: '#2563eb',
  chartGrid: 'rgba(8, 26, 57, 0.08)',
  ringTrack: 'rgba(8, 26, 57, 0.10)',
  warningSoft: '#fff5da',
  warningText: '#f59e0b',
  dangerSoft: '#ffe8e5',
  dangerText: '#bb2d20',
  neutralSoft: '#f0f4f8',
  shadow: '0 10px 28px rgba(18, 38, 68, 0.08)',
  statusBackground: '#e8f8ec',
  statusText: '#1b9a50',
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
