import axios from 'axios';

// Assume backend runs on port 3000
const API_URL = 'http://localhost:3000/api';

export const verifyIngredients = async (ingredients) => {
    try {
        const response = await axios.post(`${API_URL}/verify`, { ingredients });
        return response.data;
    } catch (error) {
        console.error("Error verifying ingredients", error);
        throw error;
    }
};

export const fetchLabs = async () => {
    try {
        const response = await axios.get(`${API_URL}/labs`);
        return response.data;
    } catch (error) {
        console.error("Error fetching labs", error);
        throw error;
    }
};
