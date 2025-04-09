import { createContext, useContext, useState, useCallback } from "react";

const DeleteInvoiceConfirmContext = createContext();

export const useDeleteInvoiceConfirm = () => useContext(DeleteInvoiceConfirmContext);

export const DeleteInvoiceConfirmProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [resolver, setResolver] = useState(null);

  const confirmDelete = useCallback(() => {
    return new Promise((resolve) => {
      setIsOpen(true);
      setResolver(() => resolve);
    });
  }, []);

  const handleAction = (action) => {
    setIsOpen(false);
    resolver(action);
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
                onClick={() => handleAction("Void")}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Void
              </button>
              <button
                onClick={() => handleAction("Refund")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
