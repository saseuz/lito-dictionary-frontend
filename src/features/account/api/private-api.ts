import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { z } from "zod";
import { envelope, vocabularySchema, exampleSchema, historySchema, passkeySchema, pageSchema, type ApiFailure } from "@/types/account";
import { privateRequest, failureOf } from "./transport";

async function request<T>(schema: z.ZodType<T>, path: string, method = "GET", body?: unknown, signal?: AbortSignal) {
  try { return { data: schema.parse(await privateRequest(path, method, body, signal)) }; }
  catch (error) {
    const failure = failureOf(error);
    if ((failure.status === 401 || failure.status === 403) && typeof window !== "undefined") window.dispatchEvent(new Event("lito-session-check"));
    return { error: failure };
  }
}
const cursorQuery = (cursor?: string) => cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
export const privateApi = createApi({
  reducerPath: "privateApi", baseQuery: fakeBaseQuery<ApiFailure>(), keepUnusedDataFor: 0,
  tagTypes: ["Vocabulary", "Examples", "History", "Passkeys"],
  endpoints: (b) => ({
    vocabulary: b.query<z.infer<ReturnType<typeof vocabularyPage>>, string | void>({ queryFn: (cursor, api) => request(vocabularyPage(), `/me/vocabulary${cursorQuery(cursor || undefined)}`, "GET", undefined, api.signal), providesTags: ["Vocabulary"] }),
    word: b.query<z.infer<ReturnType<typeof wordEnvelope>>, number>({ queryFn: (id, api) => request(wordEnvelope(), `/me/vocabulary/${id}`, "GET", undefined, api.signal), providesTags: ["Vocabulary"] }),
    saveWord: b.mutation<z.infer<ReturnType<typeof wordEnvelope>>, string>({ queryFn: (word) => request(wordEnvelope(), "/me/vocabulary", "POST", { word }), invalidatesTags: ["Vocabulary"] }),
    removeWord: b.mutation<null, number>({ queryFn: (id) => request(z.null(), `/me/vocabulary/${id}`, "DELETE"), invalidatesTags: ["Vocabulary", "Examples"] }),
    examples: b.query<z.infer<ReturnType<typeof examplePage>>, { id: number; cursor?: string }>({ queryFn: ({ id, cursor }, api) => request(examplePage(), `/me/vocabulary/${id}/examples${cursorQuery(cursor)}`, "GET", undefined, api.signal), providesTags: ["Examples"] }),
    writeExample: b.mutation<z.infer<ReturnType<typeof exampleEnvelope>>, { id: number; example?: number; text: string }>({ queryFn: ({ id, example, text }) => request(exampleEnvelope(), `/me/vocabulary/${id}/examples${example ? `/${example}` : ""}`, example ? "PATCH" : "POST", { text }), invalidatesTags: ["Examples"] }),
    removeExample: b.mutation<null, { id: number; example: number }>({ queryFn: ({ id, example }) => request(z.null(), `/me/vocabulary/${id}/examples/${example}`, "DELETE"), invalidatesTags: ["Examples"] }),
    history: b.query<z.infer<ReturnType<typeof historyPage>>, string | void>({ queryFn: (cursor, api) => request(historyPage(), `/me/history${cursorQuery(cursor || undefined)}`, "GET", undefined, api.signal), providesTags: ["History"] }),
    recordSearch: b.mutation<z.infer<ReturnType<typeof historyEnvelope>>, { word: string; client_event_id: string }>({ queryFn: (body) => request(historyEnvelope(), "/me/history", "POST", body), invalidatesTags: ["History"] }),
    removeHistory: b.mutation<null, number | void>({ queryFn: (id) => request(z.null(), `/me/history${id ? `/${id}` : ""}`, "DELETE"), invalidatesTags: ["History"] }),
    passkeys: b.query<z.infer<ReturnType<typeof passkeyEnvelope>>, void>({ queryFn: (_, api) => request(passkeyEnvelope(), "/me/passkeys", "GET", undefined, api.signal), providesTags: ["Passkeys"] }),
  }),
});
const vocabularyPage = () => pageSchema(vocabularySchema);
const wordEnvelope = () => envelope(vocabularySchema);
const examplePage = () => pageSchema(exampleSchema);
const exampleEnvelope = () => envelope(exampleSchema);
const historyPage = () => pageSchema(historySchema);
const historyEnvelope = () => envelope(historySchema);
const passkeyEnvelope = () => envelope(z.array(passkeySchema));
export const { useVocabularyQuery, useWordQuery, useSaveWordMutation, useRemoveWordMutation, useExamplesQuery, useWriteExampleMutation, useRemoveExampleMutation, useHistoryQuery, useRecordSearchMutation, useRemoveHistoryMutation, usePasskeysQuery } = privateApi;
