import React from "react";

export interface MTControllerState {
  openSidenav: boolean;
  sidenavColor: string;
  sidenavType: string;
  transparentNavbar: boolean;
  fixedNavbar: boolean;
  openConfigurator: boolean;
}

export type MTAction =
  | { type: "OPEN_SIDENAV"; value: boolean }
  | { type: "SIDENAV_TYPE"; value: string }
  | { type: "SIDENAV_COLOR"; value: string }
  | { type: "TRANSPARENT_NAVBAR"; value: boolean }
  | { type: "FIXED_NAVBAR"; value: boolean };

export type MTContextValue = [MTControllerState, React.Dispatch<MTAction>];

export const MaterialTailwind = React.createContext<MTContextValue | null>(null);
MaterialTailwind.displayName = "MaterialTailwindContext";

export function reducer(
  state: MTControllerState,
  action: MTAction
): MTControllerState {
  switch (action.type) {
    case "OPEN_SIDENAV": {
      return { ...state, openSidenav: action.value };
    }
    case "SIDENAV_TYPE": {
      return { ...state, sidenavType: action.value };
    }
    case "SIDENAV_COLOR": {
      return { ...state, sidenavColor: action.value };
    }
    case "TRANSPARENT_NAVBAR": {
      return { ...state, transparentNavbar: action.value };
    }
    case "FIXED_NAVBAR": {
      return { ...state, fixedNavbar: action.value };
    }
    default: {
      throw new Error("Unhandled action type");
    }
  }
}

export function MaterialTailwindControllerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialState: MTControllerState = {
    openSidenav: false,
    sidenavColor: "dark",
    sidenavType: "white",
    transparentNavbar: true,
    fixedNavbar: false,
    openConfigurator: false,
  };

  const [controller, dispatch] = React.useReducer(reducer, initialState);
  const value = React.useMemo<MTContextValue>(
    () => [controller, dispatch],
    [controller, dispatch]
  );

  return (
    <MaterialTailwind.Provider value={value}>
      {children}
    </MaterialTailwind.Provider>
  );
}

export function useMaterialTailwindController(): MTContextValue {
  const context = React.useContext(MaterialTailwind);

  if (!context) {
    throw new Error(
      "useMaterialTailwindController should be used inside the MaterialTailwindControllerProvider."
    );
  }

  return context;
}

MaterialTailwindControllerProvider.displayName = "/src/context/index.tsx";

export const setOpenSidenav = (
  dispatch: React.Dispatch<MTAction>,
  value: boolean
) => dispatch({ type: "OPEN_SIDENAV", value });
export const setSidenavType = (
  dispatch: React.Dispatch<MTAction>,
  value: string
) => dispatch({ type: "SIDENAV_TYPE", value });
export const setSidenavColor = (
  dispatch: React.Dispatch<MTAction>,
  value: string
) => dispatch({ type: "SIDENAV_COLOR", value });
export const setTransparentNavbar = (
  dispatch: React.Dispatch<MTAction>,
  value: boolean
) => dispatch({ type: "TRANSPARENT_NAVBAR", value });
export const setFixedNavbar = (
  dispatch: React.Dispatch<MTAction>,
  value: boolean
) => dispatch({ type: "FIXED_NAVBAR", value });
