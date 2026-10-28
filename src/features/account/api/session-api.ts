import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { envelope, userSchema, type ApiFailure, type User } from "@/types/account";
import { failureOf, privateRequest } from "./transport";

export const sessionApi = createApi({
  reducerPath: "sessionApi", baseQuery: fakeBaseQuery<ApiFailure>(), keepUnusedDataFor: 0,
  endpoints: (build) => ({
    me: build.query<User | null, void>({
      async queryFn(_, api) {
        try { return { data: envelope(userSchema).parse(await privateRequest("/me", "GET", undefined, api.signal)).data }; }
        catch (error) { const failure = failureOf(error); return failure.status === 401 ? { data: null } : { error: failure }; }
      },
    }),
  }),
});
export const { useMeQuery } = sessionApi;
