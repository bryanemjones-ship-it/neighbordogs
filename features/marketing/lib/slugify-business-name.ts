/** Marketing-only slug for sample client URL previews. */
export function slugifyBusinessName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[''´`]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "your-business";
}

const BUSINESS_TERM_PATTERN =
  /\b(dogs?|pooch(?:es)?|pups?|paws?|pets?|walking|walkers?|neighborhood|canine)\b/i;

/** True when input already reads like a branded business name. */
export function looksLikeBusinessName(input: string): boolean {
  return BUSINESS_TERM_PATTERN.test(input.trim());
}

function hasPossessiveEnding(input: string): boolean {
  return /[''´`]s$/i.test(input.trim());
}

function alreadyHasDogWalking(input: string): boolean {
  return /\bdog\s+walking\b/i.test(input.trim());
}

/** Turn personal-name input into a client-facing business title for previews. */
export function formatPreviewBusinessName(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "Your Dog Walking";

  if (looksLikeBusinessName(trimmed) || alreadyHasDogWalking(trimmed)) {
    return trimmed;
  }

  if (hasPossessiveEnding(trimmed)) {
    return `${trimmed} Dog Walking`;
  }

  const words = trimmed.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return `${trimmed}'s Dog Walking`;
  }

  const lastWord = words[words.length - 1] ?? "";
  if (words.length === 2 && lastWord.length === 1) {
    return `${trimmed}'s Dog Walking`;
  }

  return `${trimmed} Dog Walking`;
}

export const DEFAULT_SAMPLE_NAME = "Papa Grande's Pooches";
