import {
  formatPreviewBusinessName,
  slugifyBusinessName,
} from "./slugify-business-name";

export type DemoIdentity = {
  demoInputName: string;
  demoBusinessName: string;
  demoSlug: string;
  demoUrl: string;
};

/** Single source of truth for homepage demo business name + URL. */
export function deriveDemoIdentity(demoInputName: string): DemoIdentity {
  const demoBusinessName = formatPreviewBusinessName(demoInputName);
  const demoSlug = slugifyBusinessName(demoBusinessName);

  return {
    demoInputName,
    demoBusinessName,
    demoSlug,
    demoUrl: `neighbordogs.com/${demoSlug}`,
  };
}

export { DEFAULT_SAMPLE_NAME } from "./slugify-business-name";
