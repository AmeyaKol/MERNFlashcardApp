import React, { useState, useEffect } from 'react';
import { createDeckType, updateDeckType, fetchFieldTypes } from '../../services/api';
import Modal from '../common/Modal';
import Toast from '../common/Toast';

const DeckTypeBuilder = ({ isOpen, onClose, deckType = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Other',
    icon: '📚',
    color: '#3B82F6',
    isPublic: true,
    fields: []
  });
  const [fieldTypes, setFieldTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const categories = [
    'Education',
    'Programming', 
    'Language Learning',
    'Business',
    'Science',
    'Other'
  ];

  const defaultIcons = [
    '📚', '💻', '🎓', '📖', '✅', '📝', '🏗️', '🤝', '🔬', '💡'
  ];

  const defaultColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];

  useEffect(() => {
    if (isOpen) {
      loadFieldTypes();
      if (deckType) {
        setFormData({
          name: deckType.name || '',
          description: deckType.description || '',
          category: deckType.category || 'Other',
          icon: deckType.icon || '📚',
          color: deckType.color || '#3B82F6',
          isPublic: deckType.isPublic !== undefined ? deckType.isPublic : true,
          fields: deckType.fields?.map(field => ({ ...field, id: field._id || Date.now() + Math.random() })) || []
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, deckType]);

  const loadFieldTypes = async () => {
    try {
      const types = await fetchFieldTypes();
      setFieldTypes(types);
    } catch (error) {
      console.error('Error loading field types:', error);
      setToast({ type: 'error', message: 'Failed to load field types' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Other',
      icon: '📚',
      color: '#3B82F6',
      isPublic: true,
      fields: []
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addField = () => {
    const newField = {
      id: Date.now() + Math.random(),
      name: '',
      label: '',
      type: 'text',
      required: false,
      config: {},
      order: formData.fields.length
    };
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const updateField = (fieldId, updates) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setToast({ type: 'error', message: 'Deck type name is required' });
      return false;
    }

    if (formData.fields.length === 0) {
      setToast({ type: 'error', message: 'At least one field is required' });
      return false;
    }

    for (const field of formData.fields) {
      if (!field.name.trim() || !field.label.trim()) {
        setToast({ type: 'error', message: 'All fields must have a name and label' });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const deckTypeData = {
        ...formData,
        fields: formData.fields.map((field, index) => {
          const { id, _id, ...fieldData } = field;
          return { ...fieldData, order: index };
        })
      };

      if (deckType) {
        await updateDeckType(deckType._id, deckTypeData);
        setToast({ type: 'success', message: 'Deck type updated successfully!' });
      } else {
        await createDeckType(deckTypeData);
        setToast({ type: 'success', message: 'Deck type created successfully!' });
      }

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving deck type:', error);
      setToast({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to save deck type' 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderFieldConfig = (field) => {
    const fieldType = fieldTypes.find(ft => ft.type === field.type);
    if (!fieldType?.configOptions) return null;

    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Field Configuration</h5>
        {fieldType.configOptions.map(option => (
          <div key={option} className="mb-2">
            {option === 'options' && field.type === 'mcq' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Options (one per line)
                </label>
                <textarea
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  value={field.config?.options?.join('\n') || ''}
                  onChange={(e) => updateField(field.id, {
                    config: {
                      ...field.config,
                      options: e.target.value.split('\n').filter(opt => opt.trim())
                    }
                  })}
                  placeholder="Option A&#10;Option B&#10;Option C"
                />
              </div>
            )}
            {option === 'language' && field.type === 'code' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Programming Language
                </label>
                <select
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={field.config?.language || 'javascript'}
                  onChange={(e) => updateField(field.id, {
                    config: { ...field.config, language: e.target.value }
                  })}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
            )}
            {option === 'placeholder' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Placeholder Text
                </label>
                <input
                  type="text"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={field.config?.placeholder || ''}
                  onChange={(e) => updateField(field.id, {
                    config: { ...field.config, placeholder: e.target.value }
                  })}
                  placeholder="Enter placeholder text..."
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={deckType ? 'Edit Deck Type' : 'Create Deck Type'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Custom Quiz Cards"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Describe what this deck type is for..."
            />
          </div>

          {/* Visual Customization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {defaultIcons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={`w-10 h-10 text-lg rounded-lg border-2 transition-colors ${
                      formData.icon === icon 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {defaultColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      formData.color === color 
                        ? 'border-gray-800 scale-110' 
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Privacy Setting */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Make this deck type public (other users can use it)
            </label>
          </div>

          {/* Fields Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Fields</h3>
              <button
                type="button"
                onClick={addField}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Field
              </button>
            </div>

            <div className="space-y-4">
              {formData.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border border-gray-300 rounded-lg bg-white"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Field {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Field Name *
                      </label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="fieldName"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Display Label *
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Display Label"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Field Type
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(field.id, { type: e.target.value, config: {} })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {fieldTypes.map(type => (
                          <option key={type.type} value={type.type}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-xs text-gray-600">
                      Required field
                    </label>
                  </div>

                  {renderFieldConfig(field)}
                </div>
              ))}
            </div>

            {formData.fields.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No fields added yet. Click "Add Field" to get started.
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : (deckType ? 'Update' : 'Create')} Deck Type
            </button>
          </div>
        </form>
      </Modal>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default DeckTypeBuilder; 