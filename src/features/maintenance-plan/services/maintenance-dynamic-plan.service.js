import axios from 'axios';
import { MaintenanceDynamicPlanAssembler } from './maintenance-dynamic-plan.assembler.js';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL+'/api',
  timeout: 8000,
});

// Nueva instancia para la API externa
const externalHttp = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL+'/api',
  timeout: 8000,
});

// Función para obtener el token de autenticación
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Interceptor para agregar el token en cada petición a la API externa
externalHttp.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export class MaintenanceDynamicPlanService {
  /* -------- READ ALL -------- */
  async getAllPlans() {
    const token = localStorage.getItem('token');
    const response = await fetch(
      import.meta.env.VITE_API_BASE_URL+'/api/v1/dynamic-maintenance-plans?plantLineId=1',
      {
        method: 'GET',
        headers: {
          'accept': 'text/plain',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Respuesta del backend:', errorText);
      throw new Error('Error al obtener planes dinámicos');
    }
    // El backend responde con texto plano, pero es JSON en string
    const text = await response.text();
    const data = JSON.parse(text);
    return MaintenanceDynamicPlanAssembler.toModelList(data);
  }

  /* -------- READ ONE -------- */
  async getPlanById(planId) {
    try {
      const res = await externalHttp.get(`/v1/dynamic-maintenance-plans/${planId}`);
      if (!res.data) return null;
      
      return MaintenanceDynamicPlanAssembler.toModel(res.data);
    } catch (error) {
      console.error('Error al obtener plan dinámico por ID', error);
      return null;
    }
  }

  /* -------- CREATE -------- */
  async createPlan(planData) {
    try {
      // Preparar datos según la estructura esperada por la API
      const planForServer = {
        name: planData.planName,
        metricId: String(planData.parameter),
        amount: String(planData.amount),
        productionLineId: String(planData.productionLineId || 1),
        plantLineId: String(planData.plantLineId || 1),
        machines: planData.machineIds.map(id => Number(id)),
        tasks: planData.tasks.map(task => task.taskDescription)
      };

      console.log('Plan dinámico preparado para enviar:', planForServer);

      // Enviar POST
      const token = localStorage.getItem('token');
      const response = await fetch(
        import.meta.env.VITE_API_BASE_URL+'/api/v1/dynamic-maintenance-plans',
        {
          method: 'POST',
          headers: {
            'accept': 'text/plain',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(planForServer)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Respuesta del backend:', errorText);
        throw new Error('Error al crear plan dinámico');
      }

      const text = await response.text();
      const data = JSON.parse(text);
      return MaintenanceDynamicPlanAssembler.toModel(data);
    } catch (error) {
      console.error('Error al crear plan dinámico', error);
      throw new Error('Error al crear plan dinámico');
    }
  }

  /* -------- UPDATE -------- */
  async updatePlan(planData) {
    try {
      const planForServer = {
        name: planData.planName,
        metricId: planData.parameter,
        amount: planData.amount.toString(),
        productionLineId: "1", // Valor por defecto
        plantLineId: "1", // Valor por defecto
        machines: planData.machineIds || [],
        tasks: planData.tasks ? planData.tasks.map(task => task.taskDescription) : []
      };
      
      const res = await externalHttp.put(`/v1/dynamic-maintenance-plans/${planData.id}`, planForServer);
      
      if (!res.data) return null;
      return MaintenanceDynamicPlanAssembler.toModel(res.data);
    } catch (error) {
      console.error('Error al actualizar plan dinámico', error);
      return null;
    }
  }

  /* -------- DELETE -------- */
  async deletePlan(planId) {
    try {
      await externalHttp.delete(`/v1/dynamic-maintenance-plans/${planId}`);
      return true;
    } catch (error) {
      console.error('Error al eliminar plan dinámico', error);
      return false;
    }
  }

  /* -------- EXTERNAL API ENDPOINTS -------- */
  
  /**
   * Obtiene todas las plantas disponibles
   * @returns {Promise<Array>} - Lista de plantas
   */
  async getPlants() {
    try {
      const response = await externalHttp.get('/v1/plants');
      return response.data;
    } catch (err) {
      console.error('Error cargando plantas:', err);
      return [];
    }
  }

  /**
   * Obtiene las líneas de producción por plantId
   * @param {number} plantId - ID de la planta
   * @returns {Promise<Array>} - Lista de líneas de producción
   */
  async getProductionLines(plantId) {
    try {
      const response = await externalHttp.get(`/v1/production-lines?plantId=${plantId}`);
      return response.data;
    } catch (err) {
      console.error('Error cargando líneas de producción:', err);
      return [];
    }
  }
}

export const maintenanceDynamicPlanService = new MaintenanceDynamicPlanService(); 