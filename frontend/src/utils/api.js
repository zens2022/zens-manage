const api = {
    request: async (url, options = {}) => {
        const user = JSON.parse(localStorage.getItem('user'));
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        if (user && user.token) {
            defaultHeaders['Authorization'] = `Bearer ${user.token}`;
        }

        options.headers = { ...defaultHeaders, ...options.headers };

        if (options.body && typeof options.body === 'object') {
            options.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, options);

            if (response.status === 401) {
                if (!url.includes('/api/user/login')) {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (err) {
            throw err;
        }
    },

    post: (url, body) => api.request(url, { method: 'POST', body }),
    get: (url) => api.request(url, { method: 'GET' }),
};

export default api;
