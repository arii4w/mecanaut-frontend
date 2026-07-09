<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Nuevo Plan de Mantenimiento Estático</h2>
        <button class="close-button" @click="close">&times;</button>
      </div>
      
      <div class="form-tabs">
        <div class="tab active">Información General</div>
      </div>
      
      <div class="form-container">
        <div class="form-group">
          <label>Nombre</label>
          <input 
            type="text" 
            v-model="formData.planName" 
            placeholder="PM-2025-01"
            class="form-control"
          />
        </div>
        
        <div class="form-group">
          <label>Línea de Producción</label>
          <select v-model="formData.productionLineId" class="form-control" @change="loadMachinesForLine">
            <option value="">Seleccionar línea de producción</option>
            <option v-for="line in productionLines" :key="line.id" :value="line.id">
              {{ line.name }}
            </option>
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group half">
            <label>Fecha de Inicio</label>
            <input 
              type="date" 
              v-model="formData.startDate" 
              class="form-control"
            />
          </div>
          
          <div class="form-group half">
            <label>Duración (días)</label>
            <input 
              type="number" 
              v-model="formData.durationDays" 
              min="1"
              class="form-control"
            />
          </div>
        </div>
        
        <!-- Sección de máquinas disponibles para esta línea -->
        <div class="form-group" v-if="formData.productionLineId">
          <label>Máquinas disponibles para esta línea</label>
          <p class="help-text">Estas máquinas estarán disponibles para asignar a las tareas. Si una tarea no tiene máquinas específicas, se aplica a todas.</p>
          <div class="machines-selector">
            <div 
              v-for="machine in filteredMachines" 
              :key="machine.id"
              class="machine-chip"
              :class="{ selected: selectedLineMachines.includes(machine.id) }"
              @click="toggleLineMachine(machine.id)"
            >
              {{ machine.name }} - {{ machine.id }}
              <span v-if="selectedLineMachines.includes(machine.id)" class="remove-icon">×</span>
            </div>
          </div>
        </div>
        
        <div class="days-section">
          <h3>Tareas por Día</h3>
          
          <div v-for="day in daysArray" :key="day" class="day-container">
            <div class="day-header">
              <h4>Día {{ day }}</h4>
              <button class="add-task-btn small" @click="addTaskToDay(day)">+ Agregar Tarea</button>
            </div>
            
            <div 
              v-for="(task, taskIndex) in getTasksForDay(day)" 
              :key="taskIndex"
              class="task-item"
            >
              <div class="task-content">
                <div class="task-inputs">
                  <input 
                    type="text" 
                    v-model="task.taskName" 
                    placeholder="Nombre de la tarea"
                    class="form-control"
                  />
                  <input 
                    type="text" 
                    v-model="task.taskDescription" 
                    placeholder="Descripción"
                    class="form-control description"
                  />
                </div>
                
                <div class="task-machines">
                  <div class="machines-header">
                    <label>Máquinas asignadas a esta tarea</label>
                    <div class="all-machines-toggle">
                      <label class="toggle-label">
                        <input 
                          type="checkbox" 
                          :checked="task.machineIds.length === 0"
                          @change="toggleAllMachinesForTask(task)"
                        >
                        Aplicar a todas las máquinas
                      </label>
                    </div>
                  </div>
                  <div class="machine-chips" v-if="task.machineIds.length > 0">
                    <div 
                      v-for="machineId in task.machineIds" 
                      :key="machineId"
                      class="machine-chip selected small"
                    >
                      {{ getMachineName(machineId) }}
                      <span class="remove-icon" @click="removeMachineFromTask(task, machineId)">×</span>
                    </div>
                    <button 
                      class="add-machine-btn" 
                      @click="showMachineSelector(task)"
                      v-if="task.machineIds.length < selectedLineMachines.length && selectedLineMachines.length > 0"
                    >+</button>
                  </div>
                  <div v-else class="empty-machines">
                    Esta tarea se aplicará a todas las máquinas de la línea
                  </div>
                </div>
              </div>
              
              <button class="remove-task-btn" @click="removeTask(day, taskIndex)">×</button>
            </div>
            
            <div v-if="getTasksForDay(day).length === 0" class="empty-day">
              No hay tareas para este día
            </div>
          </div>
        </div>
      </div>
      
      <div class="form-actions">
        <button class="btn-cancel" @click="close">Cancelar</button>
        <button class="btn-save" @click="savePlan" :disabled="!isFormValid">Guardar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { maintenancePlanService } from '../services/maintenance-plan.service.js';
import { TelemetryService } from '@/core/services/telemetry.service.js';

const emit = defineEmits(['close', 'planCreated']);

const startTime = ref(0);

onMounted(() => {
  startTime.value = Date.now();
});

// Líneas de producción simuladas
const productionLines = ref([
  { id: 1, name: 'Línea de Producción 1' },
  { id: 2, name: 'Línea de Producción 2' },
  { id: 3, name: 'Línea de Producción 3' },
]);

// Repositorio de todas las máquinas disponibles
const allMachines = ref([
  { id: 1, name: 'MT-430', productionLineId: 1 },
  { id: 2, name: 'MT-450', productionLineId: 1 },
  { id: 3, name: 'MT-490', productionLineId: 2 },
  { id: 4, name: 'MT-510', productionLineId: 2 },
  { id: 5, name: 'MT-520', productionLineId: 3 },
]);

// Máquinas filtradas para la línea de producción seleccionada
const filteredMachines = ref([]);
// Máquinas seleccionadas para esta línea específica
const selectedLineMachines = ref([]);

const formData = ref({
  planName: '',
  productionLineId: '',
  startDate: '',
  durationDays: 3,
  items: []
});

// Cargar máquinas cuando se selecciona una línea de producción
const loadMachinesForLine = () => {
  if (!formData.value.productionLineId) {
    filteredMachines.value = [];
    selectedLineMachines.value = [];
    return;
  }
  
  // Filtrar máquinas por la línea de producción seleccionada
  filteredMachines.value = allMachines.value.filter(
    machine => machine.productionLineId === parseInt(formData.value.productionLineId)
  );
  
  // Resetear las máquinas seleccionadas
  selectedLineMachines.value = [];
  
  // Limpiar las tareas existentes cuando cambia la línea de producción
  formData.value.items = [];
};

// Agregar/quitar máquina de la selección general
const toggleLineMachine = (machineId) => {
  const index = selectedLineMachines.value.indexOf(machineId);
  if (index === -1) {
    selectedLineMachines.value.push(machineId);
  } else {
    selectedLineMachines.value.splice(index, 1);
    
    // Eliminar esta máquina de todas las tareas que la contengan
    formData.value.items.forEach(dayItem => {
      if (dayItem.tasks) {
        dayItem.tasks.forEach(task => {
          const machineIndex = task.machineIds.indexOf(machineId);
          if (machineIndex !== -1) {
            task.machineIds.splice(machineIndex, 1);
          }
        });
      }
    });
  }
};

// Generar array de días basado en la duración
const daysArray = computed(() => {
  const days = [];
  for (let i = 1; i <= formData.value.durationDays; i++) {
    days.push(i);
  }
  return days;
});

// Verificar si el formulario es válido
const isFormValid = computed(() => {
  return formData.value.planName.trim() !== '' &&
         formData.value.productionLineId !== '' &&
         formData.value.startDate !== '' &&
         formData.value.durationDays > 0 &&
         formData.value.items.some(item => item.tasks && item.tasks.length > 0);
});

// Obtener tareas para un día específico
const getTasksForDay = (day) => {
  const dayItem = formData.value.items.find(item => item.dayNumber === day);
  return dayItem && dayItem.tasks ? dayItem.tasks : [];
};

// Añadir una tarea a un día específico
const addTaskToDay = (day) => {
  const dayItem = formData.value.items.find(item => item.dayNumber === day);
  
  if (dayItem) {
    dayItem.tasks.push({
      taskId: null,
      taskName: '',
      taskDescription: '',
      machineIds: []  // Array vacío indica "todas las máquinas"
    });
  } else {
    formData.value.items.push({
      dayNumber: day,
      tasks: [{
        taskId: null,
        taskName: '',
        taskDescription: '',
        machineIds: []  // Array vacío indica "todas las máquinas"
      }]
    });
  }
};

// Eliminar una tarea
const removeTask = (day, taskIndex) => {
  const dayItem = formData.value.items.find(item => item.dayNumber === day);
  if (dayItem && dayItem.tasks) {
    dayItem.tasks.splice(taskIndex, 1);
  }
};

// Obtener nombre de máquina por ID
const getMachineName = (machineId) => {
  const machine = allMachines.value.find(m => m.id === machineId);
  return machine ? machine.name : `ID: ${machineId}`;
};

// Mostrar selector de máquinas para una tarea
const showMachineSelector = (task) => {
  // Obtener las máquinas disponibles para esta tarea (las que no están ya asignadas)
  const availableMachinesForTask = selectedLineMachines.value.filter(
    machineId => !task.machineIds.includes(machineId)
  );
  
  // Añadir la primera máquina disponible a la tarea
  if (availableMachinesForTask.length > 0) {
    task.machineIds.push(availableMachinesForTask[0]);
  }
};

// Eliminar máquina de una tarea
const removeMachineFromTask = (task, machineId) => {
  const index = task.machineIds.indexOf(machineId);
  if (index !== -1) {
    task.machineIds.splice(index, 1);
  }
};

// Alternar entre "todas las máquinas" o máquinas específicas
const toggleAllMachinesForTask = (task) => {
  if (task.machineIds.length === 0) {
    // Si está en "todas las máquinas", asignar la primera máquina disponible
    if (selectedLineMachines.value.length > 0) {
      task.machineIds.push(selectedLineMachines.value[0]);
    }
  } else {
    // Si tiene máquinas específicas, cambiar a "todas las máquinas"
    task.machineIds = [];
  }
};

// Guardar el plan
const savePlan = async () => {
  try {
    // Crear el objeto del plan estático
    const staticPlan = {
      // No asignar planId aquí para permitir que el servicio lo maneje
      planName: formData.value.planName,
      productionLineId: parseInt(formData.value.productionLineId),
      startDate: formData.value.startDate,
      durationDays: parseInt(formData.value.durationDays),
      userCreator: 1, // Usuario ficticio
      items: formData.value.items.map(item => ({
        dayNumber: item.dayNumber,
        tasks: item.tasks.map(task => ({
          // No asignar taskId aquí, dejar que el backend lo maneje
          taskName: task.taskName,
          taskDescription: task.taskDescription,
          // Asegurarse de guardar correctamente los IDs de las máquinas
          machineIds: task.machineIds.length > 0 ? [...task.machineIds] : []
        }))
      }))
    };
    
    console.log('Enviando plan a la API:', staticPlan);
    
    // Enviar al servicio
    const savedPlan = await maintenancePlanService.createPlan(staticPlan);
    
    // Telemetría del Experimento EC-01 (Control)
    const duration = Date.now() - startTime.value;
    await TelemetryService.recordMetric({
      experimentName: "EC-01",
      variant: "Control",
      actionType: "Plan_Created_Success",
      durationMilliseconds: duration,
      isSuccess: true
    });

    emit('planCreated', savedPlan);
    close();
  } catch (error) {
    console.error("Error al guardar el plan:", error);
    
    // Telemetría de Falla
    await TelemetryService.recordMetric({
      experimentName: "EC-01",
      variant: "Control",
      actionType: "Plan_Created_Failed",
      isSuccess: false,
      additionalData: error.message || 'Error al guardar el plan'
    });
  }
};

const close = () => {
  emit('close');
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 800px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
}

h2 {
  margin: 0;
  color: var(--clr-primary-500);
  font-size: 1.5rem;
}

.close-button {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.form-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
}

.tab {
  padding: 1rem 1.5rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab.active {
  border-bottom-color: var(--clr-primary-500);
  color: var(--clr-primary-500);
  font-weight: bold;
}

.form-container {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-group.half {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--clr-text);
}

.help-text {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-control.description {
  margin-top: 0.5rem;
}

.machines-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.machine-chip {
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background 0.2s;
}

.machine-chip:hover {
  background: #e0e0e0;
}

.machine-chip.selected {
  background: var(--clr-primary-100);
  color: var(--clr-primary-500);
}

.machine-chip.small {
  padding: 0.25rem 0.75rem;
  font-size: 0.9rem;
}

.remove-icon {
  margin-left: 0.5rem;
  font-weight: bold;
  cursor: pointer;
}

.days-section {
  margin-top: 2rem;
}

h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--clr-primary-500);
}

.day-container {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

h4 {
  margin: 0;
  color: var(--clr-primary-500);
}

.add-task-btn {
  padding: 0.5rem 1rem;
  background: var(--clr-primary-100);
  color: var(--clr-primary-500);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.add-task-btn.small {
  padding: 0.3rem 0.7rem;
  font-size: 0.9rem;
}

.add-task-btn:hover {
  background: var(--clr-primary-200);
}

.task-item {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.task-content {
  flex: 1;
}

.task-inputs {
  margin-bottom: 1rem;
}

.task-machines {
  margin-top: 1rem;
}

.machines-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.all-machines-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  cursor: pointer;
}

.toggle-label input {
  margin-right: 0.5rem;
}

.machine-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.empty-machines {
  padding: 0.5rem;
  background: var(--clr-primary-50, #f0f7ff);
  border-radius: 4px;
  font-size: 0.9rem;
  color: var(--clr-primary-500);
  font-style: italic;
}

.add-machine-btn, .remove-task-btn {
  background: #f0f0f0;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
}

.add-machine-btn:hover {
  background: var(--clr-primary-200);
}

.remove-task-btn {
  color: #ff6b6b;
}

.remove-task-btn:hover {
  background: #ffecec;
}

.empty-day {
  text-align: center;
  padding: 1rem;
  color: #999;
  font-style: italic;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
}

.btn-cancel, .btn-save {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-save {
  background: var(--clr-primary-500);
  color: white;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-save:hover {
  background: var(--clr-primary-600);
}

.btn-save:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style> 