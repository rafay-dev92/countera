import { createContext, useContext, useState, useCallback } from "react";

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [resolver, setResolver] = useState(null);

  const confirm = useCallback((msg) => {
    return new Promise((resolve) => {
      setMessage(msg);
      setIsOpen(true);
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolver(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolver(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[10000] bg-black/50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out animate-fadeIn"
          />
          <div
            className="relative bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full z-[10000]
                 transition-transform duration-300 ease-out animate-scaleIn"
          >
            <h3 className="text-lg font-semibold mb-4">Confirmation</h3>
            <p className="mb-6">{!message ? 'Are you sure?' : message}</p>
            <div className="flex justify-end space-x-4">
              <button onClick={handleCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
              <button onClick={handleConfirm} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Yes</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
