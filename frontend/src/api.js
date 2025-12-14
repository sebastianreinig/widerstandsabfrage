import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const createRound = async (title, description, options) => {
    const response = await api.post('/rounds/', { title, description, options });
    return response.data;
};

export const getRound = async (roundId) => {
    const response = await api.get(`/rounds/${roundId}`);
    return response.data;
};

export const submitVote = async (roundId, votes) => {
    const response = await api.post(`/rounds/${roundId}/vote`, votes);
    return response.data;
};

export const getResults = async (roundId, key) => {
    const response = await api.get(`/rounds/${roundId}/results?key=${key}`);
    return response.data;
};

export const updateVote = async (roundId, voteId, value, key) => {
    const response = await api.put(`/rounds/${roundId}/votes/${voteId}?key=${key}&value=${value}`);
    return response.data;
};

export const deleteRound = async (roundId, key) => {
    const response = await api.delete(`/rounds/${roundId}?key=${key}`);
    return response.data;
};

export const getAllRounds = async (adminKey) => {
    const response = await api.get('/rounds/admin/all', {
        headers: { 'X-Admin-Key': adminKey }
    });
    return response.data;
};

export const deleteRoundAdmin = async (roundId, adminKey) => {
    const response = await api.delete(`/rounds/admin/${roundId}`, {
        headers: { 'X-Admin-Key': adminKey }
    });
    return response.data;
};
