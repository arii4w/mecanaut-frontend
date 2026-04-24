// execution.service.js
import ApiService from '@/core/services/api.service';
import { WorkOrderExecutionAssembler } from './execution.assembler';
import { ExecutionAssembler } from './execution.assembler';
import axios from 'axios';
const apiService = new ApiService();

export default class ExecutionService {
  /**
   * Obtiene todas las plantas disponibles
   * @returns {Promise<Array>} - Lista de plantas
   */
  static async getPlants() {
    try {
      const response = await apiService.get('/plants');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo plantas:', error);
      return [];
    }
  }

  /**
   * Obtiene líneas de producción por planta
   * @param {number} plantId - ID de la planta
   * @returns {Promise<Array>} - Lista de líneas de producción
   */
  static async getProductionLines(plantId) {
    try {
      const response = await apiService.get(`/production-lines/plant/${plantId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo líneas de producción:', error);
      return [];
    }
  }


  /**
   * Obtiene órdenes de trabajo por línea de producción
   * @param {number} productionLineId - ID de la línea de producción (opcional)
   * @returns {Promise<Array>} - Lista de órdenes de trabajo
   */
  static async getWorkOrders(productionLineId = null) {
    try {
      let endpoint;
      
      if (productionLineId) {
        endpoint = `work-orders/by-production-line/${productionLineId}`;
      } else {
        // Si no hay línea seleccionada, obtener todas las órdenes
        endpoint = 'work-orders';
      }
      
      const response = await apiService.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo órdenes de trabajo:', error);
      return [];
    }
  }

  /**
   * Obtiene una orden de trabajo específica
   * @param {number} orderId - ID de la orden de trabajo
   * @returns {Promise<Object>} - Orden de trabajo
   */
  static async getWorkOrder(orderId) {
    try {
      const response = await apiService.get(`/work-orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo orden de trabajo:', error);
      throw error;
    }
  }

  /**
   * Obtiene maquinarias por línea de producción
   * @param {number} productionLineId - ID de la línea de producción
   * @returns {Promise<Array>} - Lista de maquinarias
   */
  static async getMachineries(productionLineId) {
    try {
      const response = await axios.get(`https://mecanautbk-fffeemd3bqdwebce.centralus-01.azurewebsites.net/api/v1/machines/production-line/${productionLineId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo maquinarias:', error);
      return [];
    }
  }

  /**
   * Obtiene maquinarias por orden de trabajo
   * @param {number} workOrderId - ID de la orden de trabajo
   * @returns {Promise<Array>} - Lista de maquinarias
   */
  static async getMachineriesByWorkOrder(workOrderId) {
    try {
      const order = await this.getWorkOrder(workOrderId);
      if (order.machineIds && order.machineIds.length > 0) {
        // Obtener las maquinarias específicas de la orden
        const machineries = [];
        for (const machineId of order.machineIds) {
          try {
            const response = await apiService.get(`/machines/${machineId}`);
            machineries.push(response.data);
          } catch (error) {
            console.error(`Error obteniendo máquina ${machineId}:`, error);
          }
        }
        return machineries;
      }
      return [];
    } catch (error) {
      console.error('Error obteniendo maquinarias por orden de trabajo:', error);
      return [];
    }
  }

  /**
   * Obtiene productos/repuestos por planta
   * @param {number} plantId - ID de la planta
   * @returns {Promise<Array>} - Lista de productos
   */
  static async getInventoryParts(plantId) {
    try {
      const response = await axios.get(`https://mecanautbk-fffeemd3bqdwebce.centralus-01.azurewebsites.net/api/inventory-parts?plantId=${plantId}`);
      console.log('BBBBBBBBBB', response.data);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      
      console.log('CCCCCCCCCC', error);
      return [];
    }
  }

  /**
   * Obtiene órdenes de trabajo con sus maquinarias completas para mostrar en tarjetas
   * @param {number} productionLineId - ID de la línea de producción (opcional)
   * @returns {Promise<Array>} - Lista de órdenes con maquinarias
   */
  static async getWorkOrdersWithMachineries(productionLineId = null) {
    try {
      // Obtener órdenes asignadas
      const orders = await this.getWorkOrders(productionLineId);

      // Para cada orden, obtener sus maquinarias usando los machineIds
      const ordersWithMachineries = [];
      for (const order of orders) {
        try {
          const machineries = [];
          
          // Obtener cada máquina por su ID
          if (order.machineIds && order.machineIds.length > 0) {
            for (const machineId of order.machineIds) {
              try {
                const response = await apiService.get(`/machines/${machineId}`);
                machineries.push(response.data);
              } catch (error) {
                console.error(`Error obteniendo máquina ${machineId}:`, error);
                // Agregar una máquina placeholder si no se puede obtener
                machineries.push({
                  id: machineId,
                  name: `Máquina ${machineId}`,
                  status: 'Unknown'
                });
              }
            }
          }
          
          ordersWithMachineries.push({
            ...order,
            machineries: machineries
          });
        } catch (error) {
          console.error(`Error procesando orden ${order.id}:`, error);
          ordersWithMachineries.push({
            ...order,
            machineries: []
          });
        }
      }

      return ordersWithMachineries;
    } catch (error) {
      console.error('Error obteniendo órdenes con maquinarias:', error);
      return [];
    }
  }

  /**
   * Completa una orden de trabajo
   * @param {number} orderId - ID de la orden de trabajo
   * @param {Object} completionData - Datos de completado (tareas, observaciones, productos)
   * @returns {Promise<Object>} - Respuesta de la completación
   */
  static async completeWorkOrder(orderId, completionData) {
    try {
      // Primero verificamos el estado de la orden
      const currentOrder = await this.getWorkOrder(orderId);
      if (currentOrder.status === 'completed') {
        throw new Error('La orden ya está completada');
      }

      const executedOrderData = {
        code: completionData.code,
        annotations: completionData.observations || '',
        executionDate: new Date().toISOString(),
        productionLineId: completionData.productionLineId,
        intervenedMachineIds: completionData.machineIds || [],
        assignedTechnicianIds: completionData.technicianIds || [],
        executedTasks: completionData.tasks.map(t => t.task),
        usedProducts: completionData.products,
        files: completionData.images || [],
        workOrderId: orderId
      };

      const response = await apiService.post('/executed-work-orders', executedOrderData);
      return response.data;
    } catch (error) {
      console.error('Error completando orden de trabajo:', error);
      throw error;
    }
  }

  static async decreaseInventoryPart(partId, quantity) {
    try {
      const response = await axios.put(`https://mecanautbk-fffeemd3bqdwebce.centralus-01.azurewebsites.net/api/inventory-parts/${partId}/decrease`, quantity);
      return response.data;
    } catch (error) {
      console.error('Error reduciendo stock:', error);
      throw error;
    }
  }

  /**
   * Sube una imagen al servidor
   * @param {File} file - Archivo de imagen a subir
   * @returns {Promise<Object>} - Respuesta con la URL de la imagen subida
   */
  static async uploadImage(file) {
    try {
      console.log('Iniciando subida de imagen:', {
        nombreArchivo: file.name,
        tipo: file.type,
        tamaño: file.size
      });

      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      console.log('Token disponible:', !!token);

      const url = import.meta.env.VITE_API_BASE_URL+'/api/image-storage/upload';
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000,
        timeoutErrorMessage: 'La subida de la imagen está tomando demasiado tiempo',
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log('Progreso de subida:', percentCompleted + '%');
        }
      };

      console.log('Iniciando petición a:', url);

      const response = await axios.post(url, formData, config);

      console.log('Respuesta recibida:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });
      
      if (response.data && typeof response.data === 'string') {
        console.log('Respuesta es un string, retornando como URL');
        return { url: response.data };
      } else if (response.data && response.data.url) {
        console.log('Respuesta es un objeto con URL, retornando');
        return { url: response.data.url };
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        throw new Error('Formato de respuesta no válido del servidor');
      }
    } catch (error) {
      console.error('Error detallado al subir imagen:', {
        mensaje: error.message,
        nombre: error.name,
        codigo: error.code,
        respuesta: error.response?.data,
        estado: error.response?.status,
        headers_respuesta: error.response?.headers,
        config: error.config
      });
      
      let mensajeError = 'Error al subir la imagen: ';
      if (!localStorage.getItem('token')) {
        mensajeError += 'No hay token de autorización disponible. Por favor, inicie sesión nuevamente.';
      } else if (error.response?.status === 401) {
        mensajeError += 'Token no válido o expirado. Por favor, inicie sesión nuevamente.';
      } else if (error.response?.status === 404) {
        mensajeError += 'La ruta de subida de imágenes no está disponible. Por favor, contacte al administrador.';
      } else if (error.response?.status === 413) {
        mensajeError += 'La imagen es demasiado grande.';
      } else if (error.response?.status === 415) {
        mensajeError += 'Tipo de archivo no soportado.';
      } else if (error.message.includes('timeout')) {
        mensajeError += 'La subida está tomando demasiado tiempo. Por favor, intente con una imagen más pequeña o verifique su conexión.';
      } else if (error.message.includes('Network Error')) {
        mensajeError += 'Error de conexión. Por favor, verifique su conexión a internet.';
      } else if (error.response?.data?.message) {
        mensajeError += error.response.data.message;
      } else {
        mensajeError += error.message;
      }
      
      throw new Error(mensajeError);
    }
  }

  /**
   * Guarda una orden de trabajo ejecutada
   * @param {Object} executedOrderData - Datos de la orden ejecutada
   * @returns {Promise<Object>} - Respuesta del guardado
   */
  static async saveExecutedWorkOrder(executedOrderData) {
    try {
      const response = await apiService.post('executed-work-orders', executedOrderData);
      return response.data;
    } catch (error) {
      console.error('Error guardando orden ejecutada:', error);
      throw error;
    }
  }

  /**
   * Obtiene una orden de trabajo ejecutada por ID
   * @param {number} executedOrderId - ID de la orden ejecutada
   * @returns {Promise<Object>} - Orden ejecutada
   */
  static async getExecutedWorkOrder(executedOrderId) {
    try {
      const response = await apiService.get(`/executed-work-orders/${executedOrderId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo orden ejecutada:', error);
      throw error;
    }
  }

  /**
   * Obtiene órdenes de trabajo ejecutadas por línea de producción
   * @param {number} productionLineId - ID de la línea de producción
   * @returns {Promise<Array>} - Lista de órdenes ejecutadas
   */
  static async getExecutedWorkOrdersByProductionLine(productionLineId) {
    try {
      const response = await apiService.get(`/executed-work-orders/production-line/${productionLineId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo órdenes ejecutadas por línea de producción:', error);
      throw error;
    }
  }
}
