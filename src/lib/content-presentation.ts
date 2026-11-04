import {z} from 'astro/zod';

export const contentLayoutValues=['default','two-columns','three-columns','stacked'] as const;
export const boxVariantValues=['default','plain','card'] as const;
const automatic=(value:unknown)=>value==null||value===''?'default':value;
export const contentLayoutSchema=z.preprocess(automatic,z.enum(contentLayoutValues));
export const boxVariantSchema=z.preprocess(automatic,z.enum(boxVariantValues));
export function contentLayoutAttribute(value:unknown,protectedRow=false){
 const parsed=contentLayoutSchema.safeParse(value);
 return !protectedRow&&parsed.success&&parsed.data!=='default'?parsed.data:undefined;
}
export function boxVariantAttribute(value:unknown,protectedRow=false){
 const parsed=boxVariantSchema.safeParse(value);
 return !protectedRow&&parsed.success&&parsed.data!=='default'?parsed.data:undefined;
}

/** Paragraphs and option cards each honor the chosen layout independently. */
export function paragraphLayoutAttribute(section:{layout?:unknown;body?:readonly unknown[];items?:readonly unknown[]},protectedRow=false){
 if(protectedRow||!Array.isArray(section.body)||section.body.length<2)return undefined;
 const layout=contentLayoutAttribute(section.layout);
 return layout==='two-columns'||layout==='three-columns'?layout:undefined;
}
