import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type { DictionaryEntry, LookupFailure } from "@/types/dictionary";
import { lookupWord } from "./lookup";

export const dictionaryApi = createApi({
  reducerPath: "dictionaryApi",
  baseQuery: fakeBaseQuery<LookupFailure>(),
  keepUnusedDataFor: 0,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (builder) => ({
    lookup: builder.query<DictionaryEntry, string>({
      queryFn: (word, api) => lookupWord(word, process.env.NEXT_PUBLIC_LARAVEL_API_URL, api.signal),
    }),
  }),
});
export const { useLazyLookupQuery } = dictionaryApi;
