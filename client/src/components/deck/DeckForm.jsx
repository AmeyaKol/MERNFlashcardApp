// client/src/components/DeckForm.jsx (New Component - Simplified)
import React, { useState, useEffect } from "react";
import useFlashcardStore from "../../store/flashcardStore";

function DeckForm() {
  const { addDeck, editingDeck, updateDeckStore, cancelEditDeck } =
    useFlashcardStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const isEditMode = !!editingDeck;

  useEffect(() => {
    if (isEditMode && editingDeck) {
      setName(editingDeck.name);
      setDescription(editingDeck.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [editingDeck, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Deck name is required"); // Replace with modal later
      return;
    }
    try {
      if (isEditMode) {
        await updateDeckStore(editingDeck._id, { name, description });
      } else {
        await addDeck({ name, description });
      }
      if (!isEditMode) {
        setName("");
        setDescription("");
      } // Clear form on add
    } catch (error) {
      // Error handled by store's modal
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-gray-50 rounded-lg shadow mb-6 space-y-3"
    >
      <h3 className="text-lg font-medium">
        {isEditMode ? "Edit Deck" : "Create New Deck"}
      </h3>
      <div>
        <label
          htmlFor="deckName"
          className="block text-sm font-medium text-gray-700"
        >
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="deckName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
        />
      </div>
      <div>
        <label
          htmlFor="deckDescription"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="deckDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
        />
      </div>
      <div className="flex space-x-2">
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {isEditMode ? "Update Deck" : "Create Deck"}
        </button>
        {isEditMode && (
          <button
            type="button"
            onClick={cancelEditDeck}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
export default DeckForm;
