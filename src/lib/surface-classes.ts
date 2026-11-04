/** Map one validated Pages CMS value to official static daisyUI v5 classes.
 * Only the OWNER-approved native names are stored in a new starter.
 * Values are intentionally literal so Tailwind includes their styles at build time.
 */
import type {SharedContent} from '../page-builder';
type Surface=SharedContent['surface'];
const classes:Record<Surface,string>={
  default:'',
  'base-100':'bg-base-100 text-base-content',
  'base-200':'bg-base-200 text-base-content',
  'base-300':'bg-base-300 text-base-content',
  'primary':'bg-primary text-primary-content',
  'secondary':'bg-secondary text-secondary-content',
  'accent':'bg-accent text-accent-content',
  'neutral':'bg-neutral text-neutral-content',
  'info':'bg-info text-info-content',
  'success':'bg-success text-success-content',
  'warning':'bg-warning text-warning-content',
  'error':'bg-error text-error-content',
};
export const surfaceClasses=(name:Surface)=>classes[name];
