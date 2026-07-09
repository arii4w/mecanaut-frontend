import axios from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api/v1',
  timeout: 8000,
});

http.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export class TelemetryService {
    /**
     * Envía telemetría de experimentos al backend
     * @param {Object} payload { experimentName, variant, actionType, durationMilliseconds, isSuccess, additionalData }
     */
    static async recordMetric(payload) {
        try {
            await http.post('/experiment-telemetry', payload);
        } catch (error) {
            console.error("Telemetry failed. Silent catch to prevent blocking UI.", error);
        }
    }
}
