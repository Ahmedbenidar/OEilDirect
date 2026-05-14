export const API_URL = 'http://localhost:8081/api';

function authHeaders() {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem('oeildirect_user');
        if (!raw) return {};
        const u = JSON.parse(raw);
        const t = u && u.token;
        if (!t || typeof t !== 'string') return {};
        return { Authorization: `Bearer ${t}` };
    } catch {
        return {};
    }
}

export async function fetchApi(endpoint, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...authHeaders(),
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        if (!response.ok) {
            let errorMsg = 'Erreur lors de la requête API';
            try {
                const errorData = await response.json();
                errorMsg = errorData.erreur || errorData.message || errorMsg;
            } catch {
                const errorText = await response.text().catch(() => '');
                if (errorText) errorMsg = errorText;
            }
            throw new Error(errorMsg);
        }

        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
        throw error;
    }
}
