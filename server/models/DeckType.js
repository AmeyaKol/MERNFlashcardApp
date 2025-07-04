import mongoose from 'mongoose';

// Define the field schema for deck type fields
const fieldSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Field name is required'],
        trim: true,
    },
    label: {
        type: String,
        required: [true, 'Field label is required'],
        trim: true,
    },
    type: {
        type: String,
        required: [true, 'Field type is required'],
        enum: ['text', 'markdown', 'code', 'mcq', 'link', 'video', 'image', 'number', 'boolean'],
    },
    required: {
        type: Boolean,
        default: false,
    },
    // Additional configuration for specific field types
    config: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
        // Examples:
        // For code: { language: 'javascript', theme: 'dark' }
        // For mcq: { options: ['A', 'B', 'C', 'D'], allowMultiple: false }
        // For text: { maxLength: 500, placeholder: 'Enter text...' }
    },
    order: {
        type: Number,
        default: 0,
    },
});

const deckTypeSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Deck type name is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        // System types vs user-created types
        isSystem: {
            type: Boolean,
            default: false, // true for predefined types like DSA, GRE-Word, etc.
        },
        // User who created this deck type (null for system types)
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: function() {
                return !this.isSystem;
            },
        },
        // Whether this deck type can be used by other users
        isPublic: {
            type: Boolean,
            default: true,
        },
        // Array of field definitions
        fields: [fieldSchema],
        // Category for organization
        category: {
            type: String,
            enum: ['Education', 'Programming', 'Language Learning', 'Business', 'Science', 'Other'],
            default: 'Other',
        },
        // Icon or color for visual identification
        icon: {
            type: String,
            default: '📚',
        },
        color: {
            type: String,
            default: '#3B82F6', // Blue color
        },
    },
    {
        timestamps: true,
    }
);

// Ensure deck type names are unique per user (or globally for system types)
deckTypeSchema.index({ name: 1, user: 1 }, { 
    unique: true,
    partialFilterExpression: { user: { $exists: true } }
});
deckTypeSchema.index({ name: 1 }, { 
    unique: true,
    partialFilterExpression: { isSystem: true }
});

const DeckType = mongoose.model('DeckType', deckTypeSchema);
export default DeckType; 