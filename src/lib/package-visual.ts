import { realpathSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
export interface PackageAsset { src: string; alt: string; positionX?: number; positionY?: number; }
export function resolvePackageAsset(asset: PackageAsset | undefined, publicDirectory = 'public'): PackageAsset | undefined {
  if (!asset || !/^\/images\/pricing\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:svg|webp|png)$/.test(asset.src) || !asset.alt.trim()) return undefined;
  try {
    const directory = realpathSync(resolve(publicDirectory, 'images/pricing'));
    const file = realpathSync(resolve(publicDirectory, asset.src.slice(1)));
    if (!file.startsWith(directory + sep) || !statSync(file).isFile()) return undefined;
    return asset;
  } catch { return undefined; }
}
