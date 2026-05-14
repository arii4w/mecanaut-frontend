import ApiService from '@/core/services/api.service';
import { WorkOrderEntity } from '../models/work-order.entity';

const apiService = new ApiService();

export class WorkOrderService {
  /**
   * Obtiene todas las órdenes de trabajo por línea de producción
   * @param {number} productionLineId - ID de la línea de producción
   * @returns {Promise<Array>} - Lista de órdenes de trabajo
   */
  static async getOrders(productionLineId = null) {
    try {
      let endpoint = `/work-orders/by-production-line/${productionLineId}`;
            
      const response = await apiService.get(endpoint);
      return response.data.map(order => new WorkOrderEntity(order));
    } catch (error) {
      console.error('Error obteniendo órdenes de trabajo:', error);
      throw error;
    }
  }

  /**
   * Obtiene una orden de trabajo por ID
   * @param {number} id - ID de la orden de trabajo
   * @returns {Promise<WorkOrderEntity>} - Orden de trabajo
   */
  static async getOrder(id) {
    try {
      const response = await apiService.get(`/work-orders/${id}`);
      return new WorkOrderEntity(response.data);
    } catch (error) {
      console.error('Error obteniendo orden de trabajo:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las maquinarias disponibles por línea de producción
   * @param {number} productionLineId - ID de la línea de producción
   * @returns {Promise<Array>} - Lista de maquinarias
   */
  static async getMachines(productionLineId) {
    try {
      const response = await apiService.get(`/machines/production-line/${productionLineId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo maquinarias:', error);
      return [];
    }
  }

  /**
   * Obtiene todos los usuarios técnicos disponibles
   * @returns {Promise<Array>} - Lista de usuarios técnicos
   */
  static async getTechnicians() {
    try {
      const response = await apiService.get('/users');
      // Filtrar solo usuarios con rol RoleTechnical
      const technicians = response.data.filter(user => 
        user.roles && user.roles.includes('RoleTechnical')
      );
      return technicians;
    } catch (error) {
      console.error('Error obteniendo técnicos:', error);
      return [];
    }
  }

  /**
   * Crea una nueva orden de trabajo
   * @param {Object} orderData - Datos de la orden de trabajo
   * @returns {Promise<WorkOrderEntity>} - Orden de trabajo creada
   */
  static async createOrder(orderData) {
    try {
      const payload = {
        code: orderData.code,
        date: orderData.date,
        productionLineId: orderData.productionLineId,
        type: 'Corrective', // Tipo fijo
        machineIds: orderData.machineIds || [],
        tasks: orderData.tasks || [],
        technicianIds: orderData.technicianIds || []
      };

      const response = await apiService.post('/work-orders', payload);
      return new WorkOrderEntity(response.data);
    } catch (error) {
      console.error('Error creando orden de trabajo:', error);
      throw error;
    }
  }

  /**
   * Asigna técnicos a una orden de trabajo
   * @param {number} orderId - ID de la orden de trabajo
   * @param {Array<number>} technicianIds - IDs de los técnicos
   * @returns {Promise<Object>} - Respuesta de la asignación
   */
  static async assignTechnicians(orderId, technicianIds) {
    try {
      console.log('Service - Asignando técnicos a orden:', orderId);
      console.log('Service - IDs de técnicos:', technicianIds);
      console.log('Service - Tipo de technicianIds:', typeof technicianIds);
      console.log('Service - Es array:', Array.isArray(technicianIds));
      
      // El endpoint espera directamente el array de IDs
      const response = await apiService.put(`/work-orders/${orderId}/technicians`, technicianIds);
      console.log('Service - Respuesta exitosa:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error asignando técnicos:', error);
      console.error('Service - Error response:', error.response?.data);
      throw error;
    }
  }

  /**
   * Actualiza una orden de trabajo
   * @param {number} id - ID de la orden de trabajo
   * @param {Object} orderData - Datos actualizados
   * @returns {Promise<WorkOrderEntity>} - Orden de trabajo actualizada
   */
  static async updateOrder(id, orderData) {
    try {
      // Para actualizar, primero obtenemos la orden actual
      const currentOrder = await this.getOrder(id);
      
      // Luego actualizamos los técnicos si es necesario
      if (orderData.technicianIds && orderData.technicianIds.length > 0) {
        await this.assignTechnicians(id, orderData.technicianIds);
      }
      
      // Retornamos la orden actualizada
      return await this.getOrder(id);
    } catch (error) {
      console.error('Error actualizando orden de trabajo:', error);
      throw error;
    }
  }

  /**
   * Elimina una orden de trabajo
   * @param {number} id - ID de la orden de trabajo
   * @returns {Promise<boolean>} - True si se eliminó correctamente
   */
  static async deleteOrder(id) {
    try {
      await apiService.delete(`/work-orders/${id}`);
      return true;
    } catch (error) {
      console.error('Error eliminando orden de trabajo:', error);
      throw error;
    }
  }
}
