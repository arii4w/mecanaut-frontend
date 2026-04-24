import axios from 'axios';
import { MaintenanceCalendarAssembler } from './maintenance-calendar.assembler';


const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL+'/api/v1/dynamic-maintenance-plans',
  timeout: 8000,
});

export class MaintenanceCalendarService {
  /* -------- READ ALL -------- */
  async getAllPlans() {
    const res = await http.get('/');
    // res.data → { info, data }
    return MaintenanceCalendarAssembler.toModelList(res.data);
  }

  /* -------- READ ONE -------- */
  async getPlanById(planId) {
    const plans = await this.getAllPlans();
    return plans.find((p) => p.planId === planId) ?? null;
  }

  /* -------- CREATE -------- */
  async createPlan(planModel) {
    try {
      // Primero, obtener los datos actuales
      const currentData = await http.get('/');
      
      // Obtener el máximo planId existente
      let maxPlanId = 0;
      if (currentData.data && Array.isArray(currentData.data.data)) {
        maxPlanId = currentData.data.data.reduce((max, plan) => Math.max(max, plan.planId || 0), 0);
      }
      
      // Asignar un nuevo planId secuencial (el siguiente número)
      const newPlanId = maxPlanId + 1;
      
      // Asegurarse de que el plan tenga un ID único
      const planWithId = {
        ...planModel,
        planId: newPlanId
      };
      
      // Encontrar el ID de tarea más alto en todos los planes para mantener secuencia
      let maxTaskId = 0;
      if (currentData.data && Array.isArray(currentData.data.data)) {
        currentData.data.data.forEach(plan => {
          if (plan.items && Array.isArray(plan.items)) {
            plan.items.forEach(item => {
              if (item.tasks && Array.isArray(item.tasks)) {
                item.tasks.forEach(task => {
                  if (task.taskId && task.taskId > maxTaskId) {
                    maxTaskId = task.taskId;
                  }
                });
              }
            });
          }
        });
      }
      
      // Asignar IDs secuenciales a las tareas
      let taskIdCounter = maxTaskId + 1;
      if (planWithId.items && Array.isArray(planWithId.items)) {
        planWithId.items.forEach(item => {
          if (item.tasks && Array.isArray(item.tasks)) {
            item.tasks.forEach(task => {
              task.taskId = taskIdCounter++;
            });
          }
        });
      }
      
      // Crear el recurso con el assembler
      const planResource = MaintenanceCalendarAssembler.toResource(planWithId);
      
      // Añadir el nuevo plan a la lista existente
      const updatedData = {
        info: currentData.data.info || [{registers: 0}],
        data: [...(currentData.data.data || []), planResource]
      };
      
      // Actualizar el contador de registros
      if (updatedData.info && Array.isArray(updatedData.info) && updatedData.info.length > 0) {
        updatedData.info[0].registers = updatedData.data.length;
      }
      
      console.log('Actualizando data con:', updatedData);
      
      // Enviar la lista completa actualizada
      const res = await http.put('/', updatedData);
      
      return MaintenanceCalendarAssembler.toModel(planResource);
    } catch (error) {
      console.error('Error al crear el plan de mantenimiento:', error);
      throw error;
    }
  }

  /* -------- UPDATE -------- */
  async updatePlan(planModel) {
    try {
      // Primero, obtener los datos actuales
      const currentData = await http.get('/');
      
      // Encontrar el índice del plan a actualizar
      const planIndex = currentData.data.data.findIndex(p => p.planId === planModel.planId);
      
      if (planIndex === -1) {
        throw new Error(`Plan con ID ${planModel.planId} no encontrado.`);
      }
      
      // Crear el recurso actualizado con el assembler
      const updatedPlanResource = MaintenanceCalendarAssembler.toResource(planModel);
      
      // Actualizar el plan en la lista
      const updatedData = {
        ...currentData.data,
        data: [...currentData.data.data]
      };
      
      updatedData.data[planIndex] = updatedPlanResource;
      
      // Enviar la lista completa actualizada
      await http.put('/', updatedData);
      
      return planModel;
    } catch (error) {
      console.error('Error al actualizar el plan de mantenimiento:', error);
      throw error;
    }
  }

  /* -------- DELETE -------- */
  async deletePlan(planId) {
    try {
      // Primero, obtener los datos actuales
      const currentData = await http.get('/');
      
      // Filtrar el plan a eliminar
      const updatedData = {
        ...currentData.data,
        data: currentData.data.data.filter(p => p.planId !== planId)
      };
      
      // Actualizar el contador de registros
      if (updatedData.info && Array.isArray(updatedData.info) && updatedData.info.length > 0) {
        updatedData.info[0].registers = updatedData.data.length;
      }
      
      // Enviar la lista actualizada
      await http.put('/', updatedData);
      
      return true;
    } catch (error) {
      console.error('Error al eliminar el plan de mantenimiento:', error);
      throw error;
    }
  }
}

export const maintenanceCalendarService = new MaintenanceCalendarService();
