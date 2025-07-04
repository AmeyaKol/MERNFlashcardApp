// client/src/components/DeckManager.jsx (New Component - Simplified)
import React, { useState, useEffect } from "react";
import useFlashcardStore from "../../store/flashcardStore";
import DeckForm from "./DeckForm";
import DeckTypeList from "./DeckTypeList";
import AnimatedDropdown from "../common/AnimatedDropdown";
import { PencilIcon, TrashIcon, FunnelIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useAuth } from '../../context/AuthContext';

function DeckManager() {
  const { user, isAuthenticated } = useAuth();
  const { 
    decks, 
    addDeck, 
    updateDeckStore, 
    confirmDeleteDeck, 
    startEditDeck, 
    cancelEditDeck, 
    editingDeck,
    isLoadingDecks 
  } = useFlashcardStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('DSA');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedType, setSelectedType] = useState('All');
  const [activeTab, setActiveTab] = useState('decks'); // 'decks' or 'deck-types'

  const deckTypes = ['All', 'DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other', 'GRE-Word', 'GRE-MCQ'];

  useEffect(() => {
    if (editingDeck) {
      setName(editingDeck.name);
      setDescription(editingDeck.description || '');
      setType(editingDeck.type || 'DSA');
      setIsPublic(editingDeck.isPublic);
      
      // Scroll to the top of the manage decks section when editing starts
      setTimeout(() => {
        const deckManagerElement = document.getElementById('deck-manager-section');
        if (deckManagerElement) {
          deckManagerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      setName('');
      setDescription('');
      setType('DSA');
      setIsPublic(true);
    }
  }, [editingDeck]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingDeck) {
      updateDeckStore(editingDeck._id, { name, description, type, isPublic });
    } else {
      addDeck({ name, description, type, isPublic });
    }
    handleCancelEdit(); // Reset form after submit
  };

  const handleCancelEdit = () => {
    cancelEditDeck();
    setName('');
    setDescription('');
    setType('DSA');
    setIsPublic(true);
  };

  // Only show decks owned by the current user
  const userDecks = decks.filter(deck =>
    user && (deck.user?._id === user._id || deck.user?.username === user.username)
  );

  // Filter decks by selected type
  const filteredDecks = selectedType === 'All' 
    ? userDecks 
    : userDecks.filter(deck => deck.type === selectedType);

  // Check if current user can edit/delete a deck
  const canModifyDeck = (deck) => {
    return isAuthenticated && (
      user?._id === deck.user?._id || 
      deck.user?.username === user?.username
    );
  };

  return (
    <div id="deck-manager-section" className="bg-white rounded-lg shadow-xl p-6 lg:p-8 dark:bg-gray-800">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('decks')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'decks'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center justify-center space-x-2">
            <span>📚</span>
            <span>Manage Decks</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('deck-types')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'deck-types'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center justify-center space-x-2">
            <Cog6ToothIcon className="h-5 w-5" />
            <span>Deck Types</span>
          </span>
        </button>
      </div>

      {activeTab === 'decks' ? (
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3 dark:text-gray-200 dark:border-gray-700">
            {editingDeck ? 'Edit Deck' : 'Create New Deck'}
          </h2>
      
      {/* Form for creating/editing a deck */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Deck Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type
          </label>
          <AnimatedDropdown
            options={deckTypes.slice(1).map(deckType => ({ value: deckType, label: deckType }))}
            value={type}
            onChange={(option) => setType(option.value)}
            placeholder="Select deck type"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          ></textarea>
        </div>
        <div className="flex items-center">
          <input
            id="isPublic"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            Publicly visible
          </label>
        </div>
        <div className="flex justify-end gap-4">
          {editingDeck && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {editingDeck ? 'Update Deck' : 'Create Deck'}
          </button>
        </div>
      </form>

      {/* List of existing decks */}
      <div className="border-t pt-6 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Your Decks</h3>
          
          {/* Type Filter */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <AnimatedDropdown
              options={deckTypes.map(deckType => ({ value: deckType, label: deckType }))}
              value={selectedType}
              onChange={(option) => setSelectedType(option.value)}
              placeholder="Filter by type"
              className="text-sm"
            />
          </div>
        </div>
        
        {isLoadingDecks ? (
          <p className="text-gray-500 dark:text-gray-400">Loading decks...</p>
        ) : filteredDecks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            {selectedType === 'All' 
              ? "You haven't created any decks yet." 
              : `No ${selectedType} decks found.`
            }
          </p>
        ) : (
          <ul className="space-y-3">
            {filteredDecks.map((deck) => (
              <li
                key={deck._id}
                className="p-4 rounded-md flex justify-between items-center transition-colors bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
              >
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{deck.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{deck.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${deck.isPublic ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                      {deck.isPublic ? 'Public' : 'Private'}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                      {deck.type}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      By: {deck.user?.username || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditDeck(deck)}
                    className={`p-2 rounded-md transition-colors ${
                      canModifyDeck(deck)
                        ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-gray-700'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                    title={canModifyDeck(deck) ? 'Edit Deck' : 'You can only edit your own decks'}
                    disabled={!canModifyDeck(deck)}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => canModifyDeck(deck) && confirmDeleteDeck(deck._id, deck.name)}
                    className={`p-2 rounded-md transition-colors ${
                      canModifyDeck(deck)
                        ? 'text-red-600 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-gray-700'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                    title={canModifyDeck(deck) ? 'Delete Deck' : 'You can only delete your own decks'}
                    disabled={!canModifyDeck(deck)}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
        </div>
      ) : (
        <div>
          <DeckTypeList />
        </div>
      )}
    </div>
  );
}
export default DeckManager;
