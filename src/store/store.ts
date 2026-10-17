import { configureStore } from "@reduxjs/toolkit";
import { dictionaryApi } from "@/features/dictionary/api/dictionary-api";

export const makeStore = () => configureStore({
  reducer: { [dictionaryApi.reducerPath]: dictionaryApi.reducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(dictionaryApi.middleware),
  devTools: false,
});
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
