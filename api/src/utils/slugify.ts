import slugifyModule from "slugify";
const slugify = (
  typeof slugifyModule === "function" ? slugifyModule : slugifyModule.default
) as (text: string, options?: any) => string;

export const slugifyText = (text: string) => {
  if (!text) return "";

  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  })
    .replace(/^-+|-+$/g, "") // remove leading/trailing dashes
    .replace(/-{2,}/g, "-"); // collapse multiple dashes
};
