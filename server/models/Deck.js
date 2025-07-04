// server/models/Deck.js
import mongoose from 'mongoose';

const deckSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Deck name is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        // Reference to DeckType instead of hardcoded enum
        deckType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DeckType',
            required: [true, 'Please specify a deck type'],
        },
        // Keep the old type field for backward compatibility during migration
        type: {
            type: String,
            enum: ['DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other', 'GRE-Word', 'GRE-MCQ'],
        },
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
        // We won't store flashcard IDs directly in the deck model.
        // Instead, the Flashcard model will store an array of deck IDs it belongs to.
        // This makes a many-to-many relationship easier if a flashcard can be in multiple decks.
    },
    {
        timestamps: true,
    }
);

// Ensure deck names are unique per user
deckSchema.index({ name: 1, user: 1 }, { unique: true });

const Deck = mongoose.model('Deck', deckSchema);
export default Deck;