import React, { createContext, useReducer, useContext } from "react";
import { Reducer, initialAppState } from "./Reducer";
import type { AppState, AppAction } from "./Reducer";

export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const myContext = createContext<AppContextValue | undefined>(undefined);

const Context = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(Reducer, initialAppState);

  return (
    <myContext.Provider value={{ state, dispatch }}>
      {children}
    </myContext.Provider>
  );
};

export default Context;

export const State = (): AppContextValue => {
  const ctx = useContext(myContext);
  if (!ctx) {
    throw new Error("State() must be used inside the Context provider.");
  }
  return ctx;
};
