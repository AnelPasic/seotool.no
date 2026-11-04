import { z } from 'astro/zod';

export const ctaVariants = [
  'primary', 'secondary', 'accent', 'neutral',
  'info', 'success', 'warning', 'error',
] as const;
export type ThemeMode = 'light' | 'dark';

const colorKeys = [
  '--color-base-100', '--color-base-200', '--color-base-300', '--color-base-content',
  '--color-primary', '--color-primary-content', '--color-secondary',
  '--color-secondary-content', '--color-accent', '--color-accent-content',
  '--color-neutral', '--color-neutral-content', '--color-info', '--color-info-content',
  '--color-success', '--color-success-content', '--color-warning',
  '--color-warning-content', '--color-error', '--color-error-content',
] as const;
const numericKeys = [
  '--radius-selector', '--radius-field', '--radius-box', '--size-selector',
  '--size-field', '--border', '--depth', '--noise',
] as const;
const allowedKeys = new Set<string>([...colorKeys, ...numericKeys, 'name', 'default', 'prefersdark', 'color-scheme']);
const color = /^(?:oklch\(\s*\d+(?:\.\d+)?%?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?%?)?\s*\)|#[0-9a-fA-F]{3,8})$/;
const length = /^(?:0|\d+(?:\.\d+)?(?:px|rem|em|%))$/;
const number = /^(?:0|1|0\.\d+)$/;
const directive = /^@plugin\s+["']daisyui\/theme["']\s*\{([\s\S]*?)\}\s*;?\s*$/;
// MWS #33: tolerate only a missing semicolon directly before a known theme
// variable on a NEW line. Everything else still goes through strict validation.
const missingSemicolon = new RegExp(
  String.raw`([^;\s])([ \t]*\r?\n[ \t]*)(?=(?:${[...colorKeys, ...numericKeys].join('|')})[ \t]*:)`,
  'g',
);

export interface ParsedTheme {
  name: string;
  scheme: ThemeMode;
  variables: Record<string, string>;
}

/**
 * Paste-in parser for the exact block exported by daisyUI Theme Generator.
 * Treat CMS content as data: no raw CSS, @import, JS, selectors or arbitrary
 * declarations are ever passed through to the generated page.
 */
export function parseDaisyTheme(source: string, expectedMode: ThemeMode): ParsedTheme {
  if (typeof source !== 'string' || source.length > 12000) throw new Error('Tema må være tekst på maks 12 000 tegn.');
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  const match = directive.exec(withoutComments);
  if (!match) throw new Error('Lim inn én komplett @plugin "daisyui/theme" { ... }-blokk.');
  const fields = new Map<string, string>();
  for (const piece of match[1].replace(missingSemicolon, '$1;$2').split(';')) {
    const declaration = piece.trim();
    if (!declaration) continue;
    const colon = declaration.indexOf(':');
    if (colon < 0) throw new Error('Ugyldig temaerklæring: ' + declaration.slice(0, 50));
    const key = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (!allowedKeys.has(key)) throw new Error('Ikke tillatt temaegenskap: ' + key);
    if (fields.has(key)) throw new Error('Duplisert temaegenskap: ' + key);
    if (!value) throw new Error('Mangler verdi for ' + key);
    fields.set(key, value);
  }

  const originalName = fields.get('name') ?? '';
  const name = originalName.replace(/^["']|["']$/g, '');
  if (!/^[a-z][a-z0-9-]{0,39}$/.test(name)) throw new Error('Ugyldig daisyUI-temanavn.');
  for (const flag of ['default', 'prefersdark']) {
    if (fields.has(flag) && !/^(true|false)$/.test(fields.get(flag)!)) {
      throw new Error(flag + ' må være true eller false.');
    }
  }
  const scheme = fields.get('color-scheme')?.replace(/^["']|["']$/g, '');
  if (scheme !== expectedMode) {
    throw new Error('Bruk et ' + expectedMode + '-tema med color-scheme: ' + expectedMode + ';');
  }
  const variables: Record<string, string> = {};
  for (const key of colorKeys) {
    const value = fields.get(key);
    if (!value || !color.test(value)) throw new Error('Mangler eller ugyldig ' + key + '.');
    variables[key] = value;
  }
  for (const key of numericKeys) {
    const value = fields.get(key);
    if (!value) throw new Error('Mangler ' + key + '.');
    if (!(key === '--depth' || key === '--noise' ? number : length).test(value)) {
      throw new Error('Ugyldig verdi for ' + key + '.');
    }
    variables[key] = value;
  }
  return { name, scheme: expectedMode, variables };
}

const validated = (mode: ThemeMode) => z.string().min(100).max(12000).superRefine((raw, context) => {
  try { parseDaisyTheme(raw, mode); }
  catch (error) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: error instanceof Error ? error.message : 'Ugyldig tema' });
  }
});
export const chromeThemeSchema = z.object({
  defaultMode: z.enum(['light', 'dark']),
  lightCss: validated('light'),
  darkCss: validated('dark'),
  lightLabel: z.string().trim().min(1).max(24),
  darkLabel: z.string().trim().min(1).max(24),
}).strict().superRefine((theme, context) => {
  try {
    if (parseDaisyTheme(theme.lightCss, 'light').name === parseDaisyTheme(theme.darkCss, 'dark').name) {
      context.addIssue({code: z.ZodIssueCode.custom, message: 'Light og Dark må ha ulike name-verdier i daisyUI-blokkene.'});
    }
  } catch { /* Individual field validators report the parse errors. */ }
});
export type ChromeThemes = z.infer<typeof chromeThemeSchema>;

/* Source-accurate supplemental Oslo Light semantics. These six variables are
 * in Oslo app.css, but outside the 28 daisyUI CMS theme keys. Apply them ONLY
 * when the entire unedited canonical palette matches the Oslo source; a customer
 * editing the theme (even retaining its name) inherits normal semantic aliases.
 * Source: optimalisering.oslo.noV3.3@b14b703a app/src/styles/app.css.
 */
const osloBaselineLightSignature = "oklch(0.99999999 0.00000004 89.875563)|oklch(0.98448538 0.00447018 314.805168)|oklch(0.952366 0.0152201 302.554)|oklch(0.27871246 0.04378087 312.743227)|oklch(0.52558456 0.09022346 186.796455)|oklch(0.99999999 0.00000004 89.875563)|oklch(0.25075315 0.10077263 313.031100)|oklch(0.94297432 0.01697831 192.350958)|oklch(0.89248500 0.05576943 167.275491)|oklch(0.27871246 0.04378087 312.743227)|oklch(0.27871246 0.04378087 312.743227)|oklch(0.99999999 0.00000004 89.875563)|oklch(0.94297432 0.01697831 192.350958)|oklch(0.27871246 0.04378087 312.743227)|oklch(0.89248500 0.05576943 167.275491)|oklch(0.27871246 0.04378087 312.743227)|oklch(0.94976849 0.02496090 89.213447)|oklch(0.25075315 0.10077263 313.031100)|oklch(0.48326547 0.13904820 28.765185)|oklch(0.99999999 0.00000004 89.875563)|0.375rem|0.5rem|1.25rem|0.25rem|0.25rem|1px|0|0";
const osloBaselineSemanticColors: Record<string,string> = {
  "--color-muted": "oklch(0.49158061 0.02696654 307.853282)",
  "--color-dark-muted": "oklch(0.89496413 0.02032388 308.208563)",
  "--color-dark-line": "oklch(0.47041354 0.04809311 314.327700)",
  "--color-control-line": "oklch(0.82684622 0.02665445 308.103296)",
  "--color-focus": "oklch(0.57093736 0.12197198 64.769138)",
  "--color-error-on-dark": "oklch(0.89052872 0.06213697 45.936158)"
};

export function themeOverridesCss(themes: ChromeThemes): string {
  return (['light', 'dark'] as const).map(mode => {
    const theme = parseDaisyTheme(themes[mode + 'Css' as 'lightCss' | 'darkCss'], mode);
    const isUnmodifiedOsloLight = mode === 'light' && theme.name === 'optimalisering'
      && Object.values(theme.variables).join('|') === osloBaselineLightSignature;
    const variables = isUnmodifiedOsloLight
      ? { ...theme.variables, ...osloBaselineSemanticColors }
      : theme.variables;
    const declarations = Object.entries(variables).map(([key,value]) => key+':'+value+';').join('');
    return 'html[data-theme="' + theme.name + '"]{color-scheme:' + mode + ';' + declarations + '}';
  }).join('\n');
}
