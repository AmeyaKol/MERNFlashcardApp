import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import useFlashcardStore from "../../store/flashcardStore";
import { fetchDeckById } from "../../services/api";
import DynamicField from "../common/DynamicField";
import { useAuth } from "../../context/AuthContext";

function DynamicFlashcardForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    addFlashcard,
    updateFlashcard,
    editingFlashcard,
    cancelEdit,
    decks,
    fetchDecks,
    isLoading,
    error,
  } = useFlashcardStore();

  const [selectedDeck, setSelectedDeck] = useState(null);
  const [deckType, setDeckType] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [tags, setTags] = useState('');
  const [selectedDecks, setSelectedDecks] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editingFlashcard;

  // Filter decks to only show user-owned decks
  const userOwnedDecks = decks.filter(deck => 
    deck.user?._id === user._id || 
    deck.user?.username === user.username
  );

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  // Handle URL parameters and editing
  useEffect(() => {
    const urlDeck = searchParams.get('deck');
    
    if (editingFlashcard) {
      handleEditingFlashcard();
    } else if (urlDeck && !isEditMode) {
      loadDeckForCreation(urlDeck);
    } else {
      resetForm();
    }
  }, [editingFlashcard, searchParams]);

  const handleEditingFlashcard = async () => {
    if (!editingFlashcard) return;

    // Set basic form data
    setTags(editingFlashcard.tags ? editingFlashcard.tags.join(', ') : '');
    setSelectedDecks(editingFlashcard.decks ? editingFlashcard.decks.map(d => d._id || d) : []);
    setIsPublic(editingFlashcard.isPublic !== undefined ? editingFlashcard.isPublic : true);

    // Handle new dynamic field structure
    if (editingFlashcard.fields) {
      setFieldValues(editingFlashcard.fields);
      
      // Try to get deck type from the first deck
      if (editingFlashcard.decks && editingFlashcard.decks.length > 0) {
        const firstDeck = editingFlashcard.decks[0];
        if (firstDeck.deckType) {
          setDeckType(firstDeck.deckType);
          setSelectedDeck(firstDeck);
        }
      }
    } else {
      // Handle legacy flashcard structure
      const legacyFields = {
        question: editingFlashcard.question || '',
        hint: editingFlashcard.hint || '',
        explanation: editingFlashcard.explanation || '',
        problemStatement: editingFlashcard.problemStatement || '',
        code: editingFlashcard.code || '',
        link: editingFlashcard.link || '',
        language: editingFlashcard.language || 'python',
        ...editingFlashcard.metadata
      };
      setFieldValues(legacyFields);
      
      // Set a mock deck type for legacy flashcards
      const legacyDeckType = createLegacyDeckType(editingFlashcard.type);
      setDeckType(legacyDeckType);
    }
  };

  const loadDeckForCreation = async (deckId) => {
    try {
      const deck = await fetchDeckById(deckId);
      if (deck && deck.deckType) {
        setSelectedDeck(deck);
        setDeckType(deck.deckType);
        setSelectedDecks([deckId]);
        initializeFieldValues(deck.deckType.fields);
      }
    } catch (error) {
      console.error('Error loading deck:', error);
    }
  };

  const createLegacyDeckType = (type) => {
    // Create a mock deck type for legacy flashcards based on type
    const commonFields = [
      { name: 'question', label: 'Question', type: 'text', required: true },
      { name: 'hint', label: 'Hint', type: 'text', required: false },
      { name: 'explanation', label: 'Explanation', type: 'markdown', required: true },
    ];

    switch (type) {
      case 'DSA':
        return {
          name: type,
          fields: [
            ...commonFields,
            { name: 'problemStatement', label: 'Problem Statement', type: 'markdown', required: false },
            { name: 'code', label: 'Code Solution', type: 'code', required: false, config: { language: 'python' } },
            { name: 'language', label: 'Programming Language', type: 'text', required: false },
            { name: 'link', label: 'Reference Link', type: 'link', required: false },
          ]
        };
      case 'GRE-Word':
        return {
          name: type,
          fields: [
            { name: 'question', label: 'Word', type: 'text', required: true },
            { name: 'explanation', label: 'Definition', type: 'markdown', required: true },
            { name: 'hint', label: 'Mnemonic', type: 'text', required: false },
          ]
        };
      case 'GRE-MCQ':
        return {
          name: type,
          fields: [
            { name: 'question', label: 'Question', type: 'markdown', required: true },
            { name: 'options', label: 'Answer Choices', type: 'mcq', required: true, config: { options: ['A', 'B', 'C', 'D', 'E'] } },
            { name: 'explanation', label: 'Explanation', type: 'markdown', required: true },
          ]
        };
      default:
        return {
          name: type || 'Other',
          fields: commonFields
        };
    }
  };

  const initializeFieldValues = (fields) => {
    const initialValues = {};
    fields.forEach(field => {
      initialValues[field.name] = '';
    });
    setFieldValues(initialValues);
  };

  const resetForm = () => {
    setSelectedDeck(null);
    setDeckType(null);
    setFieldValues({});
    setFieldErrors({});
    setTags('');
    setSelectedDecks([]);
    setIsPublic(true);
  };

  const validateForm = () => {
    if (!deckType) {
      alert('Please select a deck first');
      return false;
    }

    const errors = {};
    let hasErrors = false;

    deckType.fields.forEach(field => {
      if (field.required && (!fieldValues[field.name] || fieldValues[field.name].toString().trim() === '')) {
        errors[field.name] = `${field.label} is required`;
        hasErrors = true;
      }
    });

    setFieldErrors(errors);
    return !hasErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const flashcardData = {
        fields: fieldValues,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        decks: selectedDecks,
        isPublic,
      };

      if (isEditMode) {
        await updateFlashcard(editingFlashcard._id, flashcardData);
      } else {
        await addFlashcard(flashcardData);
      }

      resetForm();
      navigate('/flashcards');
    } catch (error) {
      console.error('Error saving flashcard:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode) {
      cancelEdit();
    } else {
      resetForm();
    }
    navigate('/flashcards');
  };

  const handleFieldChange = (fieldName, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };

  const handleDeckSelection = (deckId) => {
    if (selectedDecks.includes(deckId)) {
      setSelectedDecks(selectedDecks.filter(id => id !== deckId));
    } else {
      setSelectedDecks([...selectedDecks, deckId]);
    }
  };

  const handlePrimaryDeckChange = async (deckId) => {
    if (!deckId) {
      setSelectedDeck(null);
      setDeckType(null);
      setFieldValues({});
      return;
    }

    try {
      const deck = await fetchDeckById(deckId);
      console.log('Loaded deck:', deck); // Debug log
      
      if (deck) {
        setSelectedDeck(deck);
        
        // Handle both new deck types and legacy decks
        if (deck.deckType) {
          console.log('Using deck type:', deck.deckType); // Debug log
          setDeckType(deck.deckType);
          initializeFieldValues(deck.deckType.fields);
        } else if (deck.type) {
          console.log('Creating legacy deck type for:', deck.type); // Debug log
          // Create a legacy deck type for old decks
          const legacyDeckType = createLegacyDeckType(deck.type);
          setDeckType(legacyDeckType);
          initializeFieldValues(legacyDeckType.fields);
        } else {
          console.log('No deck type or legacy type found for deck:', deck); // Debug log
        }
        
        // Add to selected decks if not already included
        if (!selectedDecks.includes(deckId)) {
          setSelectedDecks([deckId, ...selectedDecks]);
        }
      }
    } catch (error) {
      console.error('Error loading deck:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in to create flashcards
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {isEditMode ? 'Edit Flashcard' : 'Create New Flashcard'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primary Deck Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Deck <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDeck?._id || ''}
              onChange={(e) => handlePrimaryDeckChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a deck...</option>
              {userOwnedDecks.map(deck => (
                <option key={deck._id} value={deck._id}>
                  {deck.name} {deck.deckType ? `(${deck.deckType.name})` : `(${deck.type})`}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Fields */}
          {deckType && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                {deckType.name} Fields
              </h3>
              {deckType.fields
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map(field => (
                  <DynamicField
                    key={field.name}
                    field={field}
                    value={fieldValues[field.name] || ''}
                    onChange={(value) => handleFieldChange(field.name, value)}
                    error={fieldErrors[field.name]}
                  />
                ))}
            </div>
          )}

          {/* Additional Deck Selection */}
          {userOwnedDecks.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Decks (Optional)
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {userOwnedDecks
                  .filter(deck => deck._id !== selectedDeck?._id)
                  .map(deck => (
                    <label key={deck._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedDecks.includes(deck._id)}
                        onChange={() => handleDeckSelection(deck._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {deck.name} {deck.deckType ? `(${deck.deckType.name})` : `(${deck.type})`}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., algorithms, arrays, sorting"
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Make this flashcard public
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !deckType}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Flashcard' : 'Create Flashcard')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DynamicFlashcardForm; 