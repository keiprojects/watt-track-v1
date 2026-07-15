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
  background: '#f3f7fb',
  surface: '#ffffff',
  surfaceRaised: '#fcfdff',
  surfaceMuted: '#eef3f9',
  surfaceAccent: '#eefad8',
  surfaceOverlay: 'rgba(255, 255, 255, 0.96)',
  header: '#0a101b',
  border: '#dce4ee',
  text: '#0a1324',
  textMuted: '#44566f',
  textSubtle: '#73849a',
  textOnDark: '#f7fbff',
  accent: '#b8f229',
  accentSoft: '#f1ffd0',
  accentGlow: 'rgba(184, 242, 41, 0.2)',
  accentText: '#355200',
  primaryChart: '#b8f229',
  secondaryChart: '#6da6ff',
  chartGrid: 'rgba(10, 19, 36, 0.08)',
  ringTrack: 'rgba(10, 19, 36, 0.1)',
  warningSoft: '#fff4d9',
  warningText: '#8a5700',
  dangerSoft: '#ffe2df',
  dangerText: '#b42318',
  neutralSoft: '#d9e4ef',
  shadow: '0 18px 40px rgba(10, 19, 36, 0.08)',
  statusBackground: '#f1ffd0',
  statusText: '#355200',
  scrim: 'rgba(7, 10, 18, 0.56)',
  skeleton: '#e5edf5',
};

export const darkPalette: AppPalette = {
  mode: 'dark',
  background: '#070b14',
  surface: '#111723',
  surfaceRaised: '#171d2a',
  surfaceMuted: '#0d121d',
  surfaceAccent: '#1b2511',
  surfaceOverlay: 'rgba(17, 23, 35, 0.98)',
  header: '#090d16',
  border: 'rgba(255, 255, 255, 0.06)',
  text: '#f6f8fc',
  textMuted: '#b5bfd0',
  textSubtle: '#7d8798',
  textOnDark: '#f6f8fc',
  accent: '#c9ff2f',
  accentSoft: '#25340d',
  accentGlow: 'rgba(201, 255, 47, 0.22)',
  accentText: '#d8ff75',
  primaryChart: '#c9ff2f',
  secondaryChart: '#4d78ff',
  chartGrid: 'rgba(255, 255, 255, 0.06)',
  ringTrack: 'rgba(255, 255, 255, 0.08)',
  warningSoft: '#33250a',
  warningText: '#ffc857',
  dangerSoft: '#321317',
  dangerText: '#ff8f8f',
  neutralSoft: '#1b2230',
  shadow: '0 20px 44px rgba(0, 0, 0, 0.36)',
  statusBackground: '#1f2d0e',
  statusText: '#d8ff75',
  scrim: 'rgba(3, 5, 10, 0.72)',
  skeleton: '#1d2433',
};
