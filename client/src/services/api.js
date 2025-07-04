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

// Merriam-Webster Dictionary API integration - now calls backend for security
export const fetchDictionaryWord = async (word) => {
  try {
    const response = await api.get(`/dictionary?word=${encodeURIComponent(word)}`);
    return response.data;
  } catch (error) {
    console.error('Dictionary API error:', error);
    throw new Error(`Failed to fetch word definition: ${error.response?.data?.error || error.message}`);
  }
};

export const createFlashcard = async (flashcardData) => {
  const response = await api.post('/flashcards', flashcardData);
  return response.data;
};