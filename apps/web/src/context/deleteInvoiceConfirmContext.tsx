import React, { createContext, useContext, useState, useCallback } from "react";

export type DeleteInvoiceChoice = "VOIDED" | "REFUNDED" | null;
type ConfirmDeleteFn = () => Promise<DeleteInvoiceChoice>;

const DeleteInvoiceConfirmContext = createContext<ConfirmDeleteFn | undefined>(
  undefined
);

export const useDeleteInvoiceConfirm = (): ConfirmDeleteFn => {
  const ctx = useContext(DeleteInvoiceConfirmContext);
  if (!ctx) {
    throw new Error(
      "useDeleteInvoiceConfirm must be used inside the DeleteInvoiceConfirmProvider."
    );
  }
  return ctx;
};

export const DeleteInvoiceConfirmProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [resolver, setResolver] = useState<
    ((value: DeleteInvoiceChoice) => void) | null
  >(null);

  const confirmDelete = useCallback<ConfirmDeleteFn>(() => {
    return new Promise<DeleteInvoiceChoice>((resolve) => {
      setIsOpen(true);
      setResolver(() => resolve);
    });
  }, []);

  const handleAction = (action: DeleteInvoiceChoice) => {
    setIsOpen(false);
    resolver?.(action);
  };

  return (
    <DeleteInvoiceConfirmContext.Provider value={confirmDelete}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[10000] bg-black/50">
            <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out animate-fadeIn"
          />
          <div className="relative bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full z-[10000] transition-transform duration-300 ease-out animate-scaleIn">
            <h3 className="text-lg font-semibold mb-4">Delete Invoice</h3>
            <p className="mb-6">What would you like to do with this invoice?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleAction(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction("VOIDED")}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Void
              </button>
              <button
                onClick={() => handleAction("REFUNDED")}
                className="px-4 py-2 bg-teal-700 text-white rounded hover:bg-teal-800"
              >
                Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </DeleteInvoiceConfirmContext.Provider>
  );
};
