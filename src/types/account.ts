import { z } from "zod";

const id = z.number().int().positive();
export const userSchema = z.object({ id, name: z.string(), email: z.string(), email_verified_at: z.string().nullable() });
export const vocabularySchema = z.object({ id, word: z.string(), language: z.literal("en"), created_at: z.string() });
export const exampleSchema = z.object({ id, text: z.string(), created_at: z.string(), updated_at: z.string() });
export const historySchema = z.object({ id, word: z.string(), language: z.literal("en"), client_event_id: z.string(), searched_at: z.string(), expires_at: z.string() });
export const passkeySchema = z.object({ id, name: z.string(), created_at: z.string().nullable(), last_used_at: z.string().nullable() });
export const envelope = <T extends z.ZodType>(schema: T) => z.object({ data: schema });
export const pageSchema = <T extends z.ZodType>(schema: T) => z.object({
  data: z.array(schema),
  meta: z.object({ next_cursor: z.string().nullable(), prev_cursor: z.string().nullable() }),
});
export type User = z.infer<typeof userSchema>;
export type Vocabulary = z.infer<typeof vocabularySchema>;
export type Example = z.infer<typeof exampleSchema>;
export type History = z.infer<typeof historySchema>;
export type ApiFailure = { status: number; message: string; errors?: Record<string, string[]> };
