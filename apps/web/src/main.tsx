import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@material-tailwind/react";
import { MaterialTailwindControllerProvider } from "@/context";
import "/public/css/tailwind.css";
import Context from "./state/Context";
import { ConfirmProvider } from "./context/confirmContext";
import { DeleteInvoiceConfirmProvider } from "./context/deleteInvoiceConfirmContext";
import { setupFetchInterceptor } from "./utils/apiInterceptor";

// Setup fetch interceptor to handle 401 responses globally
setupFetchInterceptor();

// Design-system defaults for Material Tailwind components: teal focus/accent
// colors and softly rounded dialogs, so individual forms don't restate them.
const theme = {
  button: { defaultProps: { color: "teal" } },
  iconButton: { defaultProps: { color: "teal" } },
  input: { defaultProps: { color: "teal" } },
  textarea: { defaultProps: { color: "teal" } },
  select: { defaultProps: { color: "teal" } },
  checkbox: { defaultProps: { color: "teal" } },
  radio: { defaultProps: { color: "teal" } },
  switch: { defaultProps: { color: "teal" } },
  spinner: { defaultProps: { color: "teal" } },
  dialog: { defaultProps: { className: "rounded-xl" } },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Context>
      <BrowserRouter>
        <ThemeProvider value={theme}>
          <MaterialTailwindControllerProvider>
            <ConfirmProvider>
              <DeleteInvoiceConfirmProvider>
                <App />
              </DeleteInvoiceConfirmProvider>
            </ConfirmProvider>
          </MaterialTailwindControllerProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Context>
  </React.StrictMode>
);
