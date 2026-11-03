import React, { useState } from "react";

interface DeleteAccountButtonProps {
  onDelete: () => Promise<void>;
}

const DeleteAccountButton: React.FC<DeleteAccountButtonProps> = ({
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmText = prompt(
      "Denne handling vil PERMANENT slette din konto og alle tilknyttede data\n\n" +
        'Skriv "SLET" for at bekræfte:',
    );

    if (confirmText !== "SLET") {
      if (confirmText !== null) {
        alert("Sletning annulleret. Du skal skrive 'SLET' for at bekræfte.");
      }
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Der opstod en fejl ved sletning af kontoen");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Farezone</h3>
      <p className="text-sm text-gray-600 mb-4">
        Når du sletter din konto, vil alle dine data blive permanent fjernet.
        Denne handling kan ikke fortrydes.
      </p>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {isDeleting ? "Sletter..." : "Slet min konto"}
      </button>
    </div>
  );
};

export default DeleteAccountButton;
