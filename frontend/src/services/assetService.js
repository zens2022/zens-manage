const API_URL = '/api/asset';

const getHeaders = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.token : '';
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const assetService = {
    list: async (page = 1, limit = 10, userId = '') => {
        const query = new URLSearchParams({ page, limit, userId }).toString();
        const response = await fetch(`${API_URL}/list?${query}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch assets');
        return response.json();
    },

    create: async (data) => {
        const response = await fetch(`${API_URL}/create`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create asset');
        return response.json();
    },

    update: async (id, data) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update asset');
        return response.json();
    },

    delete: async (id) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete asset');
        return response.json();
    },

    getLastItems: async () => {
        const response = await fetch(`${API_URL}/last-items`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch last items');
        return response.json();
    }
};
