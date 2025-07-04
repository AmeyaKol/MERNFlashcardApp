import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const user = JSON.parse(userInfo);
            if (user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('userInfo');
            delete api.defaults.headers.common['Authorization'];
            // Optionally redirect to login or show auth modal
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

export default api;

export const fetchDictionaryWord = async (word) => {
  const response = await api.get(`/dictionary?word=${encodeURIComponent(word)}`);
  return response.data;
};

export const createFlashcard = async (flashcardData) => {
  const response = await api.post('/flashcards', flashcardData);
  return response.data;
};

// Deck Type API functions
export const fetchDeckTypes = async (category = null) => {
  const url = category ? `/deck-types?category=${encodeURIComponent(category)}` : '/deck-types';
  const response = await api.get(url);
  return response.data;
};

export const fetchDeckTypeById = async (id) => {
  const response = await api.get(`/deck-types/${id}`);
  return response.data;
};

export const createDeckType = async (deckTypeData) => {
  const response = await api.post('/deck-types', deckTypeData);
  return response.data;
};

export const updateDeckType = async (id, deckTypeData) => {
  const response = await api.put(`/deck-types/${id}`, deckTypeData);
  return response.data;
};

export const deleteDeckType = async (id) => {
  const response = await api.delete(`/deck-types/${id}`);
  return response.data;
};

export const fetchFieldTypes = async () => {
  const response = await api.get('/deck-types/field-types');
  return response.data;
};

// Enhanced Deck API functions (updated to support deck types)
export const fetchDecks = async (type = null) => {
  const url = type ? `/decks?type=${encodeURIComponent(type)}` : '/decks';
  const response = await api.get(url);
  return response.data;
};

export const fetchDeckById = async (id) => {
  const response = await api.get(`/decks/${id}`);
  return response.data;
};

export const createDeck = async (deckData) => {
  const response = await api.post('/decks', deckData);
  return response.data;
};

export const updateDeck = async (id, deckData) => {
  const response = await api.put(`/decks/${id}`, deckData);
  return response.data;
};

export const deleteDeck = async (id) => {
  const response = await api.delete(`/decks/${id}`);
  return response.data;
};

// Flashcard API functions
export const fetchFlashcards = async () => {
  const response = await api.get('/flashcards');
  return response.data;
};

export const updateFlashcard = async (id, flashcardData) => {
  const response = await api.put(`/flashcards/${id}`, flashcardData);
  return response.data;
};

export const deleteFlashcard = async (id) => {
  const response = await api.delete(`/flashcards/${id}`);
  return response.data;
};