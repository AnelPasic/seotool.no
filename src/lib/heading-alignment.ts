import { z } from 'astro/zod';

export const headingAlignValues = ['center', 'left'] as const;
export const headingAlignSchema = z.preprocess(value => value === '' || value == null ? undefined : value, z.enum(headingAlignValues).default('center'));

/** Emit only a validated non-default heading override. */
export function headingAlignAttribute(value: unknown): 'left' | undefined {
  const parsed = headingAlignSchema.safeParse(value);
  return parsed.success && parsed.data === 'left' ? 'left' : undefined;
}
