// server/models/Flashcard.js
import mongoose from 'mongoose';

const flashcardSchema = mongoose.Schema(
    {
        // Dynamic field data based on deck type schema
        fields: {
            type: mongoose.Schema.Types.Mixed,
            required: [true, 'Flashcard fields are required'],
            default: {},
        },
        // Keep old fields for backward compatibility during migration
        question: {
            type: String,
        },
        hint: {
            type: String,
            default: '',
        },
        explanation: { // Will store Markdown
            type: String,
        },
        problemStatement: {
            type: String,
        },
        code: { // Will store Python code as a string
            type: String,
            default: '',
        },
        // Add language field
        language: {
            type: String,
            enum: ['python', 'cpp', 'java', 'javascript'],
            default: 'python',
        },
        link: { // New field for external link
            type: String,
            default: '',
        },
        // Keep old type field for backward compatibility
        type: {
            type: String,
            enum: ['DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other', 'GRE-Word', 'GRE-MCQ'], // Added GRE types
        },
        // New metadata field for storing type-specific data
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        // New "Tags" property
        tags: [{
            type: String,
            trim: true, // Remove whitespace from tags
        }],
        // New "Decks" property (array of Deck ObjectIds)
        decks: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Deck', // Reference to the Deck model
        }],
        // User ownership and privacy
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        isPublic: {
            type: Boolean,
            default: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields
    }
);

const Flashcard = mongoose.model('Flashcard', flashcardSchema);

export default Flashcard;