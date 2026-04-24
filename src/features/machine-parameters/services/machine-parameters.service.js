import axios from 'axios';
import authHeader from "../../../shared/infraestructure/auth-header.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL+'/api';

const http = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

http.interceptors.request.use((config) => {
    const headers = authHeader();
    config.headers = {
        ...config.headers,
        ...headers
    };
    return config;
});

export class MachineParametersService {
    // Obtener plantas
    static async getPlants() {
        try {
            const response = await http.get('/v1/plants');
            return response.data;
        } catch (err) {
            console.error('Error cargando plantas:', err);
            return [];
        }
    }

    // Obtener líneas de producción por plantId
    static async getProductionLinesByPlant(plantId) {
        try {
            const response = await http.get(`/v1/production-lines?plantId=${plantId}`);
            return response.data;
        } catch (err) {
            console.error('Error cargando líneas de producción:', err);
            return [];
        }
    }

    // Obtener maquinarias por línea de producción
    static async getMachineriesByProductionLine(productionLineId) {
        try {
            const response = await http.get(`/v1/machines/production-line/${productionLineId}`);
            return response.data;
        } catch (err) {
            console.error('Error cargando maquinarias:', err);
            return [];
        }
    }

    // Obtener métricas de una maquinaria
    static async getMachineParameters(machineryId) {
        try {
            const response = await http.get(`/v1/machines/${machineryId}/metrics`);
            return response.data;
        } catch (err) {
            console.error('Error cargando métricas de la maquinaria:', err);
            return [];
        }
    }

    // Guardar valor de parámetro
    static async saveParameterValue(machineryId, metricId, value) {
        try {
            const payload = {
                metricId: parseInt(metricId),
                value: parseFloat(value),
                measuredAt: new Date().toISOString()
            };
            
            const token = localStorage.getItem('token');
            
            const response = await http.post(`/v1/machines/${machineryId}/metrics`, payload);
            return response.data;
        } catch (err) {
            console.error('Error saving parameter value:', err);
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                statusText: err.response?.statusText,
                config: {
                    url: err.config?.url,
                    method: err.config?.method,
                    headers: err.config?.headers
                }
            });
            throw err;
        }
    }

    // Obtener historial de valores de un parámetro
    static async getParameterHistory(machineryId, parameterId) {
        try {
            const response = await http.get(`/machineries/${machineryId}/parameters/${parameterId}/values`);
            return response.data;
        } catch (err) {
            console.error('Error loading parameter history:', err);
            return [];
        }
    }
} 