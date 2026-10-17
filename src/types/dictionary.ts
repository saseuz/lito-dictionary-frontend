import { z } from "zod";

const nullableText = z.string().nullable();
export const lookupResponseSchema = z.object({
  data: z.object({
    word: z.string().min(1),
    language: z.literal("en"),
    origin: z.enum(["provider", "local"]),
    meanings: z.array(z.object({
      part_of_speech: z.string(),
      senses: z.array(z.object({
        definitions: z.array(z.string()),
        examples: z.array(z.object({
          text: z.string(), attribution: nullableText,
          license: nullableText, license_url: nullableText,
        })),
      })),
      pronunciations: z.array(z.object({
        text: z.string(), notation: z.string(), audio_url: nullableText,
      })),
    })),
    source: z.object({
      name: z.string(), url: z.string(), attribution: z.string(),
      license: z.string(), license_url: z.string(),
    }),
  }),
});

export type LookupResponse = z.infer<typeof lookupResponseSchema>;
export type DictionaryEntry = LookupResponse["data"];
export type LookupFailure = { status: number; message: string };
export type LookupResult = { data: DictionaryEntry; error?: never } | { error: LookupFailure; data?: never };
