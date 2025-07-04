import React, { useState, useEffect } from 'react';
import { fetchDeckTypes, deleteDeckType } from '../../services/api';
import DeckTypeBuilder from './DeckTypeBuilder';
import Toast from '../common/Toast';

const DeckTypeList = ({ onSelectDeckType = null, selectedDeckTypeId = null }) => {
  const [deckTypes, setDeckTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingDeckType, setEditingDeckType] = useState(null);
  useEffect(() => {
    loadDeckTypes();
  }, []);

  const loadDeckTypes = async () => {
    try {
      setLoading(true);
      const data = await fetchDeckTypes();
      setDeckTypes(data);
    } catch (error) {
      console.error('Error loading deck types:', error);
      setToast({ type: 'error', message: 'Failed to load deck types' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (deckType) => {
    setEditingDeckType(deckType);
    setShowBuilder(true);
  };

  const handleDelete = async (deckType) => {
    if (deckType.isSystem) {
      setToast({ type: 'error', message: 'Cannot delete system deck types' });
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${deckType.name}"?`)) {
      try {
        await deleteDeckType(deckType._id);
        setToast({ type: 'success', message: 'Deck type deleted successfully' });
        loadDeckTypes();
      } catch (error) {
        console.error('Error deleting deck type:', error);
        setToast({ 
          type: 'error', 
          message: error.response?.data?.message || 'Failed to delete deck type' 
        });
      }
    }
  };

  const handleBuilderSuccess = () => {
    loadDeckTypes();
    setEditingDeckType(null);
  };

  const handleCloseBuilder = () => {
    setShowBuilder(false);
    setEditingDeckType(null);
  };

  const handleSelectDeckType = (deckType) => {
    if (onSelectDeckType) {
      onSelectDeckType(deckType);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {onSelectDeckType ? 'Choose Deck Type' : 'Deck Types'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {onSelectDeckType 
              ? 'Select a deck type for your new deck'
              : 'Manage your custom deck types and use system templates'
            }
          </p>
        </div>
        
        {!onSelectDeckType && (
          <button
            onClick={() => setShowBuilder(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Deck Type
          </button>
        )}
      </div>

      {/* Deck Types Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-48"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deckTypes.map(deckType => (
            <DeckTypeCard
              key={deckType._id}
              deckType={deckType}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSelect={handleSelectDeckType}
              isSelected={selectedDeckTypeId === deckType._id}
              showActions={!onSelectDeckType}
            />
          ))}
        </div>
      )}

      {deckTypes.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Deck Types Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No deck types available.
          </p>
          {!onSelectDeckType && (
            <button
              onClick={() => setShowBuilder(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Deck Type
            </button>
          )}
        </div>
      )}

      {/* Deck Type Builder Modal */}
      <DeckTypeBuilder
        isOpen={showBuilder}
        onClose={handleCloseBuilder}
        deckType={editingDeckType}
        onSuccess={handleBuilderSuccess}
      />

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

const DeckTypeCard = ({ deckType, onEdit, onDelete, onSelect, isSelected, showActions }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const canEdit = !deckType.isSystem && deckType.user?._id === userInfo.id;
  const canDelete = !deckType.isSystem && deckType.user?._id === userInfo.id;

  return (
    <div 
      className={`bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer ${
        isSelected 
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      onClick={() => onSelect?.(deckType)}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              style={{ backgroundColor: deckType.color + '20' }}
            >
              {deckType.icon}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {deckType.name}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {deckType.category}
                </span>
                {deckType.isSystem && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                    System
                  </span>
                )}
              </div>
            </div>
          </div>

          {showActions && (
            <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
              {canEdit && (
                <button
                  onClick={() => onEdit(deckType)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit"
                >
                  ✏️
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(deckType)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {deckType.description && (
          <p className="text-gray-600 text-sm mb-4">
            {deckType.description}
          </p>
        )}

        {/* Fields Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Fields ({deckType.fields?.length || 0})
          </h4>
          <div className="flex flex-wrap gap-1">
            {deckType.fields?.slice(0, 3).map((field, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
              >
                {field.label}
              </span>
            ))}
            {deckType.fields?.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                +{deckType.fields.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Creator Info */}
        {!deckType.isSystem && deckType.user && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Created by {deckType.user.username}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckTypeList; 