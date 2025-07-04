// client/src/components/DeckForm.jsx (New Component - Simplified)
import React, { useState, useEffect } from "react";
import useFlashcardStore from "../../store/flashcardStore";
import { fetchDeckTypes } from "../../services/api";
import DeckTypeList from "./DeckTypeList";
import Modal from "../common/Modal";

function DeckForm() {
  const { addDeck, editingDeck, updateDeckStore, cancelEditDeck } =
    useFlashcardStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDeckType, setSelectedDeckType] = useState(null);
  const [showDeckTypeSelector, setShowDeckTypeSelector] = useState(false);
  const [deckTypes, setDeckTypes] = useState([]);
  const [legacyType, setLegacyType] = useState("DSA"); // For backward compatibility
  const isEditMode = !!editingDeck;

  const legacyDeckTypes = ['DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other', 'GRE-Word', 'GRE-MCQ'];

  useEffect(() => {
    loadDeckTypes();
  }, []);

  useEffect(() => {
    if (isEditMode && editingDeck) {
      setName(editingDeck.name);
      setDescription(editingDeck.description || "");
      
      // Handle both new deckType and legacy type
      if (editingDeck.deckType) {
        setSelectedDeckType(editingDeck.deckType);
      } else if (editingDeck.type) {
        setLegacyType(editingDeck.type);
        // Try to find a matching system deck type
        const matchingDeckType = deckTypes.find(dt => dt.name === editingDeck.type);
        if (matchingDeckType) {
          setSelectedDeckType(matchingDeckType);
        }
      }
    } else {
      setName("");
      setDescription("");
      setSelectedDeckType(null);
      setLegacyType("DSA");
    }
  }, [editingDeck, isEditMode, deckTypes]);

  const loadDeckTypes = async () => {
    try {
      const data = await fetchDeckTypes();
      setDeckTypes(data);
    } catch (error) {
      console.error('Error loading deck types:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Deck name is required"); // Replace with modal later
      return;
    }
    
    // Support both new deck type system and legacy
    if (!selectedDeckType && !legacyType) {
      alert("Deck type is required");
      return;
    }
    
    try {
      const deckData = { name, description };
      
      // Use new deck type if selected, otherwise fall back to legacy
      if (selectedDeckType) {
        deckData.deckType = selectedDeckType._id;
      } else {
        deckData.type = legacyType;
      }
      
      if (isEditMode) {
        await updateDeckStore(editingDeck._id, deckData);
      } else {
        await addDeck(deckData);
      }
      
      if (!isEditMode) {
        setName("");
        setDescription("");
        setSelectedDeckType(null);
        setLegacyType("DSA");
      } // Clear form on add
    } catch (error) {
      // Error handled by store's modal
    }
  };

  const handleSelectDeckType = (deckType) => {
    setSelectedDeckType(deckType);
    setShowDeckTypeSelector(false);
  };

  const getDisplayDeckType = () => {
    if (selectedDeckType) {
      return selectedDeckType.name;
    }
    return legacyType;
  };

  return (
    <>
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
            htmlFor="deckType"
            className="block text-sm font-medium text-gray-700"
          >
            Type <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setShowDeckTypeSelector(true)}
              className="w-full text-left px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {selectedDeckType && (
                    <span 
                      className="w-6 h-6 rounded flex items-center justify-center text-sm mr-2"
                      style={{ backgroundColor: selectedDeckType.color + '20' }}
                    >
                      {selectedDeckType.icon}
                    </span>
                  )}
                  <span className={selectedDeckType ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedDeckType ? selectedDeckType.name : 'Select deck type...'}
                  </span>
                </div>
                <span className="text-gray-400">▼</span>
              </div>
            </button>
          </div>
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

      {/* Deck Type Selector Modal */}
      <Modal
        isOpen={showDeckTypeSelector}
        onClose={() => setShowDeckTypeSelector(false)}
        title="Choose Deck Type"
        size="xl"
      >
        <DeckTypeList
          onSelectDeckType={handleSelectDeckType}
          selectedDeckTypeId={selectedDeckType?._id}
        />
      </Modal>
    </>
  );
}
export default DeckForm;
