import React, { useState, useRef, useEffect } from 'react';
import CodeEditor from './CodeEditor';

const DynamicField = ({ field, value, onChange, error }) => {
  const [internalValue, setInternalValue] = useState(value || '');
  const textareaRef = useRef(null);

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  const handleChange = (newValue) => {
    setInternalValue(newValue);
    onChange(newValue);
  };

  const renderField = () => {
    const commonProps = {
      className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        error ? 'border-red-500' : 'border-gray-300'
      }`,
      placeholder: field.config?.placeholder || `Enter ${field.label.toLowerCase()}...`,
      required: field.required
    };

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            maxLength={field.config?.maxLength}
            {...commonProps}
          />
        );

      case 'markdown':
        return (
          <div>
            <textarea
              ref={textareaRef}
              value={internalValue}
              onChange={(e) => handleChange(e.target.value)}
              rows={field.config?.rows || 4}
              {...commonProps}
            />
            <div className="text-xs text-gray-500 mt-1">
              Supports Markdown formatting
            </div>
          </div>
        );

      case 'code':
        return (
          <div>
            <CodeEditor
              value={internalValue}
              onChange={handleChange}
              language={field.config?.language || 'javascript'}
              theme={field.config?.theme || 'light'}
              height="200px"
            />
            <div className="text-xs text-gray-500 mt-1">
              Language: {field.config?.language || 'javascript'}
            </div>
          </div>
        );

      case 'mcq':
        return (
          <MCQField
            field={field}
            value={internalValue}
            onChange={handleChange}
            error={error}
          />
        );

      case 'link':
        return (
          <input
            type="url"
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            {...commonProps}
            placeholder="https://example.com"
          />
        );

      case 'video':
        return (
          <div>
            <input
              type="url"
              value={internalValue}
              onChange={(e) => handleChange(e.target.value)}
              {...commonProps}
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
            />
            {internalValue && (
              <div className="mt-2">
                <VideoPreview url={internalValue} />
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div>
            <input
              type="url"
              value={internalValue}
              onChange={(e) => handleChange(e.target.value)}
              {...commonProps}
              placeholder="https://example.com/image.jpg"
            />
            {internalValue && (
              <div className="mt-2">
                <img
                  src={internalValue}
                  alt="Preview"
                  className="max-w-xs max-h-48 rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            min={field.config?.min}
            max={field.config?.max}
            step={field.config?.step}
            {...commonProps}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={internalValue === true || internalValue === 'true'}
              onChange={(e) => handleChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              {field.config?.checkboxLabel || field.label}
            </label>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            {...commonProps}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderField()}
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
    </div>
  );
};

const MCQField = ({ field, value, onChange, error }) => {
  const options = field.config?.options || [];
  const allowMultiple = field.config?.allowMultiple || false;
  
  const handleOptionChange = (option) => {
    if (allowMultiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(option)
        ? currentValues.filter(v => v !== option)
        : [...currentValues, option];
      onChange(newValues);
    } else {
      onChange(option);
    }
  };

  const isSelected = (option) => {
    if (allowMultiple) {
      return Array.isArray(value) && value.includes(option);
    }
    return value === option;
  };

  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <div key={index} className="flex items-center">
          <input
            type={allowMultiple ? 'checkbox' : 'radio'}
            id={`${field.name}-${index}`}
            name={field.name}
            checked={isSelected(option)}
            onChange={() => handleOptionChange(option)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <label 
            htmlFor={`${field.name}-${index}`}
            className="ml-2 text-sm text-gray-700"
          >
            {option}
          </label>
        </div>
      ))}
      {options.length === 0 && (
        <div className="text-gray-500 text-sm italic">
          No options configured for this field
        </div>
      )}
    </div>
  );
};

const VideoPreview = ({ url }) => {
  const getEmbedUrl = (url) => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return null;
  };

  const embedUrl = getEmbedUrl(url);
  
  if (!embedUrl) {
    return (
      <div className="text-sm text-gray-500">
        Video preview not available for this URL format
      </div>
    );
  }

  return (
    <div className="aspect-video max-w-md">
      <iframe
        src={embedUrl}
        className="w-full h-full rounded-lg"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default DynamicField; 