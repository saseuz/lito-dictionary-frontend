import "server-only";
import { cache } from "react";
import { lookupWord } from "./lookup";

// React cache deduplicates within one render only; fetch never stores provider data.
export const getWord = cache((word: string) => lookupWord(word, process.env.LARAVEL_API_URL));
