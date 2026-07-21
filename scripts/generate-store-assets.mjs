import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const tmpDir = path.join(root, '.assetgen-tmp');

const colors = {
  darkBg: '#04111d',
  darkBg2: '#0b1828',
  lightBg: '#f4f8fb',
  ink: '#071734',
  blue: '#2563eb',
  green: '#73f26d',
  teal: '#00d5bb',
};

const requiredDirs = [
  'assets/branding',
  'assets/splash',
  'assets/store',
  'assets/store/screenshots',
  tmpDir,
];

for (const dir of requiredDirs) {
  mkdirSync(path.isAbsolute(dir) ? dir : path.join(root, dir), { recursive: true });
}

function rel(file) {
  return path.join(root, file);
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function recolorNearWhitePng(inputFile, outputFile, color) {
  const png = PNG.sync.read(readFileSync(inputFile));
  const replacement = hexToRgb(color);

  for (let i = 0; i < png.data.length; i += 4) {
    const alpha = png.data[i + 3];
    const red = png.data[i];
    const green = png.data[i + 1];
    const blue = png.data[i + 2];
    const looksWhite = red > 180 && green > 180 && blue > 180;

    if (alpha > 0 && looksWhite) {
      png.data[i] = replacement.r;
      png.data[i + 1] = replacement.g;
      png.data[i + 2] = replacement.b;
    }
  }

  writeFileSync(outputFile, PNG.sync.write(png));
}

function dataUri(file) {
  return `data:image/png;base64,${readFileSync(file).toString('base64')}`;
}

function svg(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="deep" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.darkBg2}"/>
      <stop offset="100%" stop-color="${colors.darkBg}"/>
    </linearGradient>
    <linearGradient id="panel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fbff"/>
      <stop offset="100%" stop-color="#e8f2fb"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="22" stdDeviation="20" flood-color="#00101b" flood-opacity="0.28"/>
    </filter>
  </defs>
  ${body}
</svg>`;
}

function renderSvgToPng(svgContent, outputFile, width, height) {
  mkdirSync(path.dirname(outputFile), { recursive: true });
  const tempSvg = path.join(tmpDir, `${path.basename(outputFile, '.png')}.svg`);
  const tempPng = path.join(tmpDir, `${path.basename(outputFile, '.png')}.png`);
  writeFileSync(tempSvg, svgContent, 'utf8');
  rmSync(tempPng, { force: true });

  const psQuote = (value) => `'${value.replaceAll("'", "''")}'`;
  const result = process.platform === 'win32'
    ? spawnSync('powershell.exe', [
      '-NoProfile',
      '-Command',
      `& npx --yes sharp-cli -i ${psQuote(tempSvg)} -o ${psQuote(tmpDir)} -f png resize ${width} ${height}`,
    ], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    : spawnSync('npx', [
      '--yes',
      'sharp-cli',
      '-i',
      tempSvg,
      '-o',
      tmpDir,
      '-f',
      'png',
      'resize',
      String(width),
      String(height),
    ], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

  if (result.status !== 0) {
    throw new Error(`sharp-cli failed for ${outputFile}\n${result.error?.message ?? ''}\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  }

  copyFileSync(tempPng, outputFile);
}

function iconSvg({ theme, transparent = false }) {
  const dark = theme === 'dark';
  const logo = dark ? rel('assets/branding/logo-mark-dark.png') : rel('assets/branding/logo-mark-light.png');
  return svg(1024, 1024, `
    ${transparent ? '<rect width="1024" height="1024" fill="transparent"/>' : `<rect width="1024" height="1024" fill="${dark ? 'url(#deep)' : colors.lightBg}"/>`}
    ${transparent ? '' : `<circle cx="824" cy="190" r="214" fill="${dark ? '#12304b' : '#dcecff'}" opacity="0.56"/>
    <circle cx="230" cy="820" r="250" fill="${dark ? '#0c342c' : '#def9e4'}" opacity="0.54"/>
    <path d="M154 754 C282 694 392 708 520 748 C642 785 744 789 880 710" fill="none" stroke="${dark ? '#24435b' : '#d5e2ee'}" stroke-width="18" stroke-linecap="round" opacity="0.7"/>`}
    <image href="${dataUri(logo)}" x="155" y="295" width="714" height="434" preserveAspectRatio="xMidYMid meet" filter="${transparent ? '' : 'url(#shadow)'}"/>
  `);
}

function featureGraphicSvg() {
  const logo = rel('assets/branding/logo-mark-dark.png');
  const screenshot = rel('output/real-app/real-home.png');
  const screenshotImage = existsSync(screenshot) ? dataUri(screenshot) : '';

  return svg(1024, 500, `
    <rect width="1024" height="500" fill="url(#deep)"/>
    <circle cx="860" cy="72" r="190" fill="#123d5e" opacity="0.52"/>
    <circle cx="94" cy="438" r="214" fill="#0d3f35" opacity="0.54"/>
    <image href="${dataUri(logo)}" x="74" y="62" width="232" height="141" preserveAspectRatio="xMidYMid meet"/>
    <text x="78" y="296" font-family="Manrope, Arial, sans-serif" font-size="64" font-weight="800" fill="#f7fbff">Watt Track</text>
    <text x="80" y="354" font-family="Manrope, Arial, sans-serif" font-size="29" font-weight="800" fill="${colors.green}">Solar readings, costs, and ROI</text>
    <text x="80" y="394" font-family="Manrope, Arial, sans-serif" font-size="23" font-weight="500" fill="#c7d6e6">A local-first dashboard for home energy tracking.</text>
    <g transform="translate(626 54)" filter="url(#shadow)">
      <rect x="0" y="0" width="242" height="392" rx="34" fill="#071734"/>
      <rect x="12" y="12" width="218" height="368" rx="25" fill="url(#panel)"/>
      ${screenshotImage ? `<image href="${screenshotImage}" x="12" y="12" width="218" height="368" preserveAspectRatio="xMidYMin slice"/>` : ''}
    </g>
  `);
}

function copyRealScreenshot(source, target) {
  if (!existsSync(source)) {
    console.warn(`skipped ${target}; missing ${source}`);
    return;
  }

  copyFileSync(source, target);
  console.log(`generated ${path.relative(root, target)} from real app screenshot`);
}

copyFileSync(rel('assets/branding/logo-mark.png'), rel('assets/branding/logo-mark-dark.png'));
copyFileSync(rel('assets/branding/logo-full.png'), rel('assets/branding/logo-full-dark.png'));
recolorNearWhitePng(rel('assets/branding/logo-mark.png'), rel('assets/branding/logo-mark-light.png'), colors.ink);
recolorNearWhitePng(rel('assets/branding/logo-full.png'), rel('assets/branding/logo-full-light.png'), colors.ink);

copyFileSync(rel('assets/branding/logo-full-light.png'), rel('assets/splash/splash-logo-light.png'));
copyFileSync(rel('assets/branding/logo-full-dark.png'), rel('assets/splash/splash-logo-dark.png'));

renderSvgToPng(iconSvg({ theme: 'dark' }), rel('assets/icon.png'), 1024, 1024);
renderSvgToPng(iconSvg({ theme: 'light' }), rel('assets/icon-light.png'), 1024, 1024);
renderSvgToPng(iconSvg({ theme: 'dark' }), rel('assets/icon-dark.png'), 1024, 1024);
renderSvgToPng(iconSvg({ theme: 'dark', transparent: true }), rel('assets/adaptive-icon.png'), 1024, 1024);
renderSvgToPng(iconSvg({ theme: 'dark' }), rel('assets/favicon.png'), 256, 256);
renderSvgToPng(iconSvg({ theme: 'dark' }), rel('assets/store/play-store-icon.png'), 512, 512);
renderSvgToPng(featureGraphicSvg(), rel('assets/store/feature-graphic.png'), 1024, 500);

copyRealScreenshot(rel('output/real-app/real-home.png'), rel('assets/store/screenshots/phone-01-home.png'));
copyRealScreenshot(rel('output/real-app/real-insights.png'), rel('assets/store/screenshots/phone-02-analytics.png'));
copyRealScreenshot(rel('output/real-app/real-history.png'), rel('assets/store/screenshots/phone-03-history.png'));

for (const staleFile of [
  'assets/store/screenshots/phone-01-dashboard.png',
  'assets/store/screenshots/phone-01-dashboard.svg',
  'assets/store/screenshots/phone-02-history.png',
  'assets/store/screenshots/phone-02-history.svg',
  'assets/store/screenshots/phone-03-insights.png',
  'assets/store/screenshots/phone-03-insights.svg',
  'assets/store/feature-graphic.svg',
  'assets/store/play-store-icon.svg',
  'assets/icon-light.svg',
  'assets/icon-dark.svg',
  'assets/adaptive-icon-foreground.svg',
]) {
  rmSync(rel(staleFile), { force: true });
}

rmSync(tmpDir, { recursive: true, force: true });
