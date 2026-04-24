import axios from 'axios';

import { InventoryPartAssembler } from '../../shared/services/inventory-part.assembler.js';
import { PurchaseOrderAssembler } from '../../shared/services/purchase-order.assembler.js';

const baseEndpoint = import.meta.env.VITE_API_BASE_URL+'/api';
const purchaseOrdersEndpoint = `${baseEndpoint}/purchase-orders`;

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

export class PurchaseOrdersApiService {
    /**
     * Obtiene todas las órdenes de compra por plantId
     * @param {number} plantId - ID de la planta
     * @returns {Promise<Array>} - Lista de órdenes de compra
     */
    static async getPurchaseOrders(plantId) {
        try {
            const response = await http.get(`${purchaseOrdersEndpoint}?plantId=${plantId}`);
            return response.data;
        } catch (err) {
            console.error('Error cargando órdenes de compra:', err);
            return [];
        }
    }

    /**
     * Obtiene una orden de compra específica por ID
     * @param {number} id - ID de la orden de compra
     * @returns {Promise<Object>} - Orden de compra
     */
    static async getPurchaseOrderById(id) {
        try {
            const response = await http.get(`${purchaseOrdersEndpoint}/${id}`);
            return response.data;
        } catch (err) {
            console.error(`Error cargando orden de compra ${id}:`, err);
            throw err;
        }
    }

    /**
     * Crea una nueva orden de compra
     * @param {Object} purchaseOrderData - Datos de la orden de compra
     * @returns {Promise<Object>} - Orden de compra creada
     */
    static async createPurchaseOrder(purchaseOrderData) {
        try {
            if (!purchaseOrderData.orderNumber || !purchaseOrderData.inventoryPartId || !purchaseOrderData.quantity) {
                throw new Error("El número de orden, parte de inventario y cantidad son obligatorios");
            }
            
            const requestData = {
                orderNumber: purchaseOrderData.orderNumber,
                inventoryPartId: purchaseOrderData.inventoryPartId,
                quantity: purchaseOrderData.quantity,
                totalPrice: purchaseOrderData.totalPrice || 0,
                plantId: purchaseOrderData.plantId,
                deliveryDate: purchaseOrderData.deliveryDate
            };

            console.log(requestData);
            
            const response = await http.post(purchaseOrdersEndpoint, requestData);
            return response.data;
        } catch (err) {
            console.error('Error creando orden de compra:', err);
            throw err;
        }
    }

    /**
     * Marca una orden de compra como completada
     * @param {number} id - ID de la orden de compra
     * @returns {Promise<Object>} - Orden de compra actualizada
     */
    static async completePurchaseOrder(id) {
        try {
            const response = await http.patch(`${purchaseOrdersEndpoint}/${id}/complete`);
            return response.data;
        } catch (err) {
            console.error(`Error completando orden de compra ${id}:`, err);
            throw err;
        }
    }

    /**
     * Elimina una orden de compra
     * @param {number} id - ID de la orden de compra a eliminar
     * @returns {Promise<boolean>} - true si se eliminó correctamente
     */
    static async deletePurchaseOrder(id) {
        try {
            await http.delete(`${purchaseOrdersEndpoint}/${id}`);
            return true;
        } catch (err) {
            console.error(`Error eliminando orden de compra ${id}:`, err);
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
