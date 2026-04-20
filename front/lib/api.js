export const API_URL = 'http://localhost:8081/api';

export async function fetchApi(endpoint, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
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

        // Return empty string for 204 No Content or responses without JSON
        if (response.status === 204 || response.headers.get('content-length') === '0') {
             return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
        throw error;
    }
}
