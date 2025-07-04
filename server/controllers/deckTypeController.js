import DeckType from '../models/DeckType.js';

// @desc    Create a new deck type
// @route   POST /api/deck-types
// @access  Private
export const createDeckType = async (req, res) => {
  const { name, description, fields, category, icon, color, isPublic } = req.body;
  
  if (!name || !fields || !Array.isArray(fields) || fields.length === 0) {
    return res.status(400).json({ 
      message: 'Deck type name and at least one field are required' 
    });
  }

  // Validate fields
  for (const field of fields) {
    if (!field.name || !field.label || !field.type) {
      return res.status(400).json({ 
        message: 'Each field must have name, label, and type' 
      });
    }
  }

  try {
    // Check if deck type with this name already exists for this user
    const deckTypeExists = await DeckType.findOne({ 
      name, 
      user: req.user._id 
    });
    
    if (deckTypeExists) {
      return res.status(400).json({ 
        message: 'You already have a deck type with this name' 
      });
    }
    
    const deckType = new DeckType({ 
      name, 
      description: description || '',
      fields: fields.map((field, index) => ({
        ...field,
        order: field.order !== undefined ? field.order : index
      })),
      category: category || 'Other',
      icon: icon || '📚',
      color: color || '#3B82F6',
      user: req.user._id,
      isPublic: isPublic !== undefined ? isPublic : true,
      isSystem: false,
    });
    
    const createdDeckType = await deckType.save();
    const populatedDeckType = await DeckType.findById(createdDeckType._id)
      .populate('user', 'username');
    
    res.status(201).json(populatedDeckType);
  } catch (error) {
    res.status(500).json({ 
      message: 'Server Error: Could not create deck type', 
      error: error.message 
    });
  }
};

// @desc    Get all deck types (system + user's + public user-created)
// @route   GET /api/deck-types
// @access  Public (but shows more if authenticated)
export const getDeckTypes = async (req, res) => {
  try {
    const { category } = req.query;
    let query = {
      $or: [
        { isSystem: true }, // All system deck types
        { isPublic: true }  // All public user-created deck types
      ]
    };
    
    // If user is authenticated, also include their private deck types
    if (req.user) {
      query.$or.push({ user: req.user._id });
    }

    // Add category filter if provided
    if (category) {
      query.category = category;
    }

    const deckTypes = await DeckType.find(query)
      .populate('user', 'username')
      .sort({ isSystem: -1, name: 1 }); // System types first, then alphabetical
    
    res.status(200).json(deckTypes);
  } catch (error) {
    res.status(500).json({ 
      message: 'Server Error: Could not fetch deck types', 
      error: error.message 
    });
  }
};

// @desc    Get a single deck type by ID
// @route   GET /api/deck-types/:id
// @access  Public (if public) / Private (if private and owner)
export const getDeckTypeById = async (req, res) => {
  try {
    const deckType = await DeckType.findById(req.params.id)
      .populate('user', 'username');
    
    if (!deckType) {
      return res.status(404).json({ message: 'Deck type not found' });
    }

    // Check if deck type is accessible
    const isAccessible = deckType.isSystem || 
                        deckType.isPublic || 
                        (req.user && deckType.user && deckType.user._id.toString() === req.user._id.toString());
    
    if (!isAccessible) {
      return res.status(403).json({ 
        message: 'Not authorized to view this deck type' 
      });
    }

    res.status(200).json(deckType);
  } catch (error) {
    res.status(500).json({ 
      message: 'Server Error: Could not fetch deck type', 
      error: error.message 
    });
  }
};

// @desc    Update a deck type
// @route   PUT /api/deck-types/:id
// @access  Private (owner only, cannot update system types)
export const updateDeckType = async (req, res) => {
  const { name, description, fields, category, icon, color, isPublic } = req.body;
  
  try {
    const deckType = await DeckType.findById(req.params.id);
    
    if (!deckType) {
      return res.status(404).json({ message: 'Deck type not found' });
    }

    // Cannot update system deck types
    if (deckType.isSystem) {
      return res.status(403).json({ 
        message: 'Cannot update system deck types' 
      });
    }

    // Check if user owns this deck type
    if (!deckType.user || deckType.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to update this deck type' 
      });
    }

    // Check if new name already exists for this user (excluding current deck type)
    if (name && name !== deckType.name) {
      const deckTypeExists = await DeckType.findOne({ 
        name, 
        user: req.user._id,
        _id: { $ne: req.params.id }
      });
      
      if (deckTypeExists) {
        return res.status(400).json({ 
          message: 'You already have a deck type with this name' 
        });
      }
    }

    // Validate fields if provided
    if (fields) {
      if (!Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ 
          message: 'At least one field is required' 
        });
      }
      
      for (const field of fields) {
        if (!field.name || !field.label || !field.type) {
          return res.status(400).json({ 
            message: 'Each field must have name, label, and type' 
          });
        }
      }
    }

    deckType.name = name || deckType.name;
    deckType.description = description !== undefined ? description : deckType.description;
    deckType.category = category || deckType.category;
    deckType.icon = icon || deckType.icon;
    deckType.color = color || deckType.color;
    deckType.isPublic = isPublic !== undefined ? isPublic : deckType.isPublic;
    
    if (fields) {
      deckType.fields = fields.map((field, index) => ({
        ...field,
        order: field.order !== undefined ? field.order : index
      }));
    }

    const updatedDeckType = await deckType.save();
    const populatedDeckType = await DeckType.findById(updatedDeckType._id)
      .populate('user', 'username');
    
    res.status(200).json(populatedDeckType);
  } catch (error) {
    res.status(500).json({ 
      message: 'Server Error: Could not update deck type', 
      error: error.message 
    });
  }
};

// @desc    Delete a deck type
// @route   DELETE /api/deck-types/:id
// @access  Private (owner only, cannot delete system types)
export const deleteDeckType = async (req, res) => {
  try {
    const deckType = await DeckType.findById(req.params.id);
    
    if (!deckType) {
      return res.status(404).json({ message: 'Deck type not found' });
    }

    // Cannot delete system deck types
    if (deckType.isSystem) {
      return res.status(403).json({ 
        message: 'Cannot delete system deck types' 
      });
    }

    // Check if user owns this deck type
    if (!deckType.user || deckType.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to delete this deck type' 
      });
    }

    // TODO: In future, check if any decks are using this deck type
    // and either prevent deletion or handle migration

    await deckType.deleteOne();
    res.status(200).json({ 
      message: 'Deck type removed', 
      id: req.params.id 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server Error: Could not delete deck type', 
      error: error.message 
    });
  }
};

// @desc    Get all available field types and their configurations
// @route   GET /api/deck-types/field-types
// @access  Public
export const getFieldTypes = async (req, res) => {
  try {
    const fieldTypes = [
      {
        type: 'text',
        label: 'Text',
        description: 'Single line text input',
        configOptions: ['maxLength', 'placeholder', 'required']
      },
      {
        type: 'markdown',
        label: 'Markdown',
        description: 'Rich text with markdown support',
        configOptions: ['placeholder', 'required']
      },
      {
        type: 'code',
        label: 'Code Editor',
        description: 'Code editor with syntax highlighting',
        configOptions: ['language', 'theme', 'required']
      },
      {
        type: 'mcq',
        label: 'Multiple Choice',
        description: 'Multiple choice question',
        configOptions: ['options', 'allowMultiple', 'required']
      },
      {
        type: 'link',
        label: 'Link',
        description: 'URL/link input',
        configOptions: ['placeholder', 'required']
      },
      {
        type: 'video',
        label: 'Video Embed',
        description: 'Video embed (YouTube, Vimeo, etc.)',
        configOptions: ['placeholder', 'required']
      },
      {
        type: 'image',
        label: 'Image',
        description: 'Image upload or URL',
        configOptions: ['allowUpload', 'required']
      },
      {
        type: 'number',
        label: 'Number',
        description: 'Numeric input',
        configOptions: ['min', 'max', 'step', 'required']
      },
      {
        type: 'boolean',
        label: 'Yes/No',
        description: 'Boolean checkbox',
        configOptions: ['required']
      }
    ];
    
    res.status(200).json(fieldTypes);
  } catch (error) {
    res.status(500).json({ 
      message: 'Server Error: Could not fetch field types', 
      error: error.message 
    });
  }
}; 