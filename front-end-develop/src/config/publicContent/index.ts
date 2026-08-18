import { PublicContent } from "@/types/PublicContent";
import { deepMerge } from "@/utils/common/deepMerge";
import { en } from "./en";
import { fr } from "./fr";

const dictionaries: Record<string, PublicContent> = {
  en,
  fr: deepMerge(en, fr),
};

export function getPublicContent(languageCode: string): PublicContent {
  return dictionaries[languageCode] ?? en;
}

export const publicContentLanguages = Object.keys(dictionaries);
