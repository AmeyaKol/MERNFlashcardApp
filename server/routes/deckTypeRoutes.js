import express from 'express';
import {
    createDeckType,
    getDeckTypes,
    getDeckTypeById,
    updateDeckType,
    deleteDeckType,
    getFieldTypes,
} from '../controllers/deckTypeController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createDeckType).get(optionalAuth, getDeckTypes);
router.route('/field-types').get(getFieldTypes);
router.route('/:id').get(optionalAuth, getDeckTypeById).put(protect, updateDeckType).delete(protect, deleteDeckType);

export default router; 