import type { Business, Inspection, Invoice, SessionUser } from "@/types/api";

export interface AppState {
  Settings: {
    General: {
      invoice: string;
    };
  };
  userToken: string;
  business: Business | null;
  userInfo: Partial<SessionUser>;
  invoice: {
    isViewOpen: boolean;
    viewData: Invoice | null;
    openForm: boolean;
  };
  quotation: {
    isViewOpen: boolean;
  };
  workorder: {
    isViewOpen: boolean;
  };
  inspection: {
    selected: Inspection | null;
  };
  product: {
    openForm: boolean;
  };
}

export type AppAction =
  | { type: "SET_INVOICE"; payload: string }
  | { type: "SET_TOKEN"; payload: string }
  | { type: "SET_BUSINESS"; payload: Business | null }
  | { type: "SET_USER"; payload: Partial<SessionUser> }
  | { type: "SET_INVOICE_VIEW"; payload: boolean }
  | { type: "SET_INVOICE_VIEW_DATA"; payload: Invoice | null }
  | { type: "SET_INVOICE_FORM"; payload: boolean }
  | { type: "SET_QUOTATION_VIEW"; payload: boolean }
  | { type: "SET_WORKORDER_VIEW"; payload: boolean }
  | { type: "SET_INSPECTION_DATA"; payload: Inspection | null }
  | { type: "SET_PRODUCT_DATA"; payload: boolean }
  | { type: "RESET" };

export const initialAppState: AppState = {
  Settings: {
    General: {
      invoice: "current",
    },
  },
  userToken: "",
  business: null,
  userInfo: {},
  invoice: {
    isViewOpen: false,
    viewData: null,
    openForm: false,
  },
  quotation: {
    isViewOpen: false,
  },
  workorder: {
    isViewOpen: false,
  },
  inspection: {
    selected: null,
  },
  product: {
    openForm: false,
  },
};

export const Reducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_INVOICE":
      return {
        ...state,
        Settings: {
          ...state.Settings,
          General: {
            ...state.Settings.General,
            invoice: action.payload,
          },
        },
      };
    case "SET_TOKEN":
      return {
        ...state,
        userToken: action.payload,
      };
    case "SET_BUSINESS":
      return {
        ...state,
        business: action.payload,
      };
    case "SET_USER":
      return {
        ...state,
        userInfo: action.payload,
      };
    case "SET_INVOICE_VIEW":
      return {
        ...state,
        invoice: {
          ...state.invoice,
          isViewOpen: action.payload,
        },
      };
    case "SET_INVOICE_VIEW_DATA":
      return {
        ...state,
        invoice: {
          ...state.invoice,
          viewData: action.payload,
        },
      };
    case "SET_INVOICE_FORM":
      return {
        ...state,
        invoice: {
          ...state.invoice,
          openForm: action.payload,
        },
      };
    case "SET_QUOTATION_VIEW":
      return {
        ...state,
        quotation: {
          isViewOpen: action.payload,
        },
      };
    case "SET_WORKORDER_VIEW":
      return {
        ...state,
        workorder: {
          isViewOpen: action.payload,
        },
      };
    case "SET_INSPECTION_DATA":
      return {
        ...state,
        inspection: {
          selected: action.payload,
        },
      };
    case "SET_PRODUCT_DATA":
      return {
        ...state,
        product: {
          openForm: action.payload,
        },
      };
    case "RESET":
      return initialAppState;
    default:
      return state;
  }
};
