import { z } from 'astro/zod';

export const surfaceValues = ['default', 'base-100', 'base-200', 'base-300', 'primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'] as const;
export type Surface = typeof surfaceValues[number];
export const surfaceSchema = z.preprocess(value => value === '' || value == null ? undefined : value, z.enum(surfaceValues).default('default'));

/** CMS editor metadata never grants permission to recolor a protected row. */
export function sectionModel(slug: string, id: string): 'content' | 'protected' {
  return ['home', 'synlighet', 'konvertering'].includes(slug) && id === 'sjekk' ? 'protected' : 'content';
}

/** Defense in depth: only approved enum values can reach a presentation attribute. */
export function surfaceAttribute(value: unknown, protectedRow = false): Exclude<Surface, 'default'> | undefined {
  const parsed = surfaceSchema.safeParse(value);
  return protectedRow || !parsed.success || parsed.data === 'default' ? undefined : parsed.data;
}
