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
  background: '#eef3f7',
  surface: '#ffffff',
  surfaceRaised: '#f7f9fc',
  surfaceMuted: '#e7edf4',
  surfaceAccent: '#f3ffd5',
  surfaceOverlay: 'rgba(255, 255, 255, 0.92)',
  header: '#09101d',
  border: 'rgba(9, 16, 29, 0.08)',
  text: '#0b1425',
  textMuted: '#49576c',
  textSubtle: '#7a879a',
  textOnDark: '#f5f9ff',
  accent: '#c9ff45',
  accentSoft: 'rgba(201, 255, 69, 0.16)',
  accentGlow: 'rgba(201, 255, 69, 0.26)',
  accentText: '#345300',
  primaryChart: '#c9ff45',
  secondaryChart: '#5f91ff',
  chartGrid: 'rgba(11, 20, 37, 0.08)',
  ringTrack: 'rgba(11, 20, 37, 0.12)',
  warningSoft: '#fff1d1',
  warningText: '#8b5d00',
  dangerSoft: '#ffe5e2',
  dangerText: '#b42318',
  neutralSoft: '#dee7f0',
  shadow: '0 18px 48px rgba(7, 14, 28, 0.08)',
  statusBackground: '#f3ffd5',
  statusText: '#345300',
  scrim: 'rgba(6, 9, 18, 0.6)',
  skeleton: '#dde6ef',
};

export const darkPalette: AppPalette = {
  mode: 'dark',
  background: '#050915',
  surface: '#0d1322',
  surfaceRaised: '#11192b',
  surfaceMuted: '#090f1b',
  surfaceAccent: '#17220a',
  surfaceOverlay: 'rgba(8, 13, 24, 0.92)',
  header: '#070d18',
  border: 'rgba(255, 255, 255, 0.07)',
  text: '#f3f7ff',
  textMuted: '#b8c2d4',
  textSubtle: '#7e899d',
  textOnDark: '#f5f9ff',
  accent: '#d6ff4d',
  accentSoft: 'rgba(214, 255, 77, 0.14)',
  accentGlow: 'rgba(214, 255, 77, 0.22)',
  accentText: '#e3ff92',
  primaryChart: '#d6ff4d',
  secondaryChart: '#68a2ff',
  chartGrid: 'rgba(255, 255, 255, 0.06)',
  ringTrack: 'rgba(255, 255, 255, 0.08)',
  warningSoft: '#33250a',
  warningText: '#ffc857',
  dangerSoft: '#31131a',
  dangerText: '#ff9999',
  neutralSoft: '#1a2437',
  shadow: '0 22px 60px rgba(1, 3, 10, 0.42)',
  statusBackground: '#1e2b0e',
  statusText: '#e3ff92',
  scrim: 'rgba(2, 4, 10, 0.76)',
  skeleton: '#1a2335',
};
