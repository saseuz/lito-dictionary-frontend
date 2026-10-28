import { configureStore } from "@reduxjs/toolkit";
import { dictionaryApi } from "@/features/dictionary/api/dictionary-api";
import { privateApi } from "@/features/account/api/private-api";
import { sessionApi } from "@/features/account/api/session-api";

export const makeStore = () => configureStore({
  reducer: { [dictionaryApi.reducerPath]: dictionaryApi.reducer, [privateApi.reducerPath]: privateApi.reducer, [sessionApi.reducerPath]: sessionApi.reducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(dictionaryApi.middleware, privateApi.middleware, sessionApi.middleware),
  devTools: false,
});
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
