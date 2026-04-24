// inventory-parts-api.service.ts
import axios from 'axios';

import { InventoryPartAssembler } from '../../shared/services/inventory-part.assembler.js';
import { PurchaseOrderAssembler } from '../../shared/services/purchase-order.assembler.js';

const baseEndpoint = import.meta.env.VITE_API_BASE_URL+'/api';
const inventoryPartsEndpoint = `${baseEndpoint}/inventory-parts`;

// Función para obtener el token de autenticación
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Función para crear headers con autenticación
const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// Instancia de axios configurada
const http = axios.create({
    baseURL: baseEndpoint,
    headers: getAuthHeaders()
});

// Interceptor para agregar el token en cada petición
http.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export class InventoryPartsApiService {
    /**
     * Obtiene todas las partes del inventario por plantId
     * @param {number} plantId - ID de la planta
     * @returns {Promise<Array>} - Lista de partes del inventario
     */
    static async getParts(plantId) {
        try {
            const response = await http.get(`${inventoryPartsEndpoint}?plantId=${plantId}`);
            return response.data;
        } catch (err) {
            console.error('Error cargando partes:', err);
            return [];
        }
    }

    /**
     * Obtiene una parte específica por ID
     * @param {number} id - ID de la parte
     * @returns {Promise<Object>} - Parte del inventario
     */
    static async getPartById(id) {
        try {
            const response = await http.get(`${inventoryPartsEndpoint}/${id}`);
            return InventoryPartAssembler.toEntityFromResource(response.data);
        } catch (err) {
            console.error(`Error cargando parte ${id}:`, err);
            throw err;
        }
    }

    /**
     * Crea una nueva parte en el inventario
     * @param {Object} partData - Datos de la parte a crear
     * @returns {Promise<Object>} - Parte creada
     */
    static async createPart(partData) {
        try {
            if (!partData.code || !partData.name || !partData.plantId) {
                throw new Error("El código, nombre y plantId son obligatorios");
            }
            
            // Preparar datos para el endpoint
            const requestData = {
                code: partData.code,
                name: partData.name,
                description: partData.description || '',
                currentStock: partData.currentStock || 0,
                minStock: partData.minStock || 0,
                unitPrice: partData.unitPrice || 0,
                plantId: partData.plantId
            };
            
            const response = await http.post(inventoryPartsEndpoint, requestData);
            return InventoryPartAssembler.toEntityFromResource(response.data);
        } catch (err) {
            console.error('Error creando parte:', err);
            throw err;
        }
    }

    /**
     * Actualiza una parte existente
     * @param {number} id - ID de la parte a actualizar
     * @param {Object} partData - Datos a actualizar
     * @returns {Promise<Object>} - Parte actualizada
     */
    static async updatePart(id, partData) {
        try {
            // Solo se pueden actualizar estos campos según la API
            const updateData = {
                description: partData.description,
                currentStock: partData.currentStock,
                minStock: partData.minStock,
                unitPrice: partData.unitPrice
            };
            
            const response = await http.put(`${inventoryPartsEndpoint}/${id}`, updateData);
            return InventoryPartAssembler.toEntityFromResource(response.data);
        } catch (err) {
            console.error(`Error actualizando parte ${id}:`, err);
            throw err;
        }
    }

    /**
     * Elimina una parte del inventario
     * @param {number} id - ID de la parte a eliminar
     * @returns {Promise<boolean>} - true si se eliminó correctamente
     */
    static async deletePart(id) {
        try {
            await http.delete(`${inventoryPartsEndpoint}/${id}`);
            return true;
        } catch (err) {
            console.error(`Error eliminando parte ${id}:`, err);
            throw err;
        }
    }

    /**
     * Obtiene todas las plantas disponibles
     * @returns {Promise<Array>} - Lista de plantas
     */
    static async getPlants() {
        try {
            const response = await http.get(`${baseEndpoint}/v1/plants`);
            return response.data;
        } catch (err) {
            console.error('Error cargando plantas:', err);
            return [];
        }
    }
}
