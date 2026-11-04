import { z } from 'astro/zod';
import { parseDaisyTheme, type ChromeThemes } from './site-chrome-theme.ts';

/** OWNER #87: Oslo is the exact design blueprint. Only font family may change
 * outside of the full daisyUI Light/Dark theme variables. Never expose
 * independent size, weight, tracking, line-height or arbitrary CSS overrides.
 */
export const typographySchema = z.object({
  fontFamily: z.enum(['system','serif','mono']).optional(),
}).strict();
export type ChromeTypography = z.infer<typeof typographySchema>;

const stacks = {
  system: 'system-ui, sans-serif',
  serif: 'Georgia, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export function typographyVariables(typography?: ChromeTypography): Record<string,string> {
  if (!typography?.fontFamily) return {};
  return { '--font-sans': stacks[typography.fontFamily], '--font-heading': stacks[typography.fontFamily], '--font-body': stacks[typography.fontFamily] };
}

/** Scoped to both validated theme names without ever changing Oslo geometry. */
export function typographyOverridesCss(themes: ChromeThemes, typography?: ChromeTypography): string {
  const values=typographyVariables(typography);
  if (!Object.keys(values).length) return '';
  const declarations=Object.entries(values).map(([key,value])=>key+':'+value+';').join('');
  return (['light','dark'] as const).map(mode=>{
    const name=parseDaisyTheme(themes[mode+'Css' as 'lightCss'|'darkCss'],mode).name;
    return 'html[data-theme="'+name+'"]{'+declarations+'}';
  }).join('\n');
}
