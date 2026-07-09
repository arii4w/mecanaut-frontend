<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Nuevo Plan de Mantenimiento Dinámico</h2>
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
          <label>Parámetro</label>
          <select v-model="formData.parameter" class="form-control">
            <option value="">Seleccionar parámetro</option>
            <option value="1">Kilometraje</option>
            <option value="2">Temperatura</option>
            <option value="3">Presión</option>
            <option value="4">Vibración</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Mantenimiento cada</label>
          <input 
            type="number" 
            v-model="formData.amount" 
            placeholder="10000"
            class="form-control"
          />
        </div>
        
        <div class="form-group">
          <label>Máquinas</label>
          <div class="machines-selector">
            <div 
              v-for="machine in availableMachines" 
              :key="machine.id"
              class="machine-chip"
              :class="{ selected: selectedMachines.includes(machine.id) }"
              @click="toggleMachine(machine.id)"
            >
              {{ machine.name }} - {{ machine.id }}
              <span v-if="selectedMachines.includes(machine.id)" class="remove-icon">×</span>
            </div>
          </div>
        </div>
        
        <div class="tasks-section">
          <h3>Tareas</h3>
          
          <div class="tasks-header">
            <div class="task-column">Tarea</div>
            <div class="actions-column"></div>
          </div>
          
          <div 
            v-for="(task, index) in formData.tasks" 
            :key="index"
            class="task-row"
          >
            <div class="task-column">
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
            <div class="actions-column">
              <button class="remove-task-btn" @click="removeTask(index)">×</button>
            </div>
          </div>
          
          <button class="add-task-btn" @click="addTask">+ Agregar Tarea</button>
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
import { ref, computed, onMounted } from 'vue';
import { maintenanceDynamicPlanService } from '../services/maintenance-dynamic-plan.service.js';
import { MachineParametersService } from '../../machine-parameters/services/machine-parameters.service.js';
import { TelemetryService } from '@/core/services/telemetry.service.js';

const emit = defineEmits(['close', 'planCreated']);

const startTime = ref(0);

onMounted(() => {
  startTime.value = Date.now();
});

// Variables para máquinas disponibles
const availableMachines = ref([]);
const selectedMachines = ref([]);
const currentPlantId = ref(null);
const currentProductionLineId = ref(null);
const formData = ref({
  planName: '',
  parameter: '',
  amount: null,
  tasks: []
});

const isFormValid = computed(() => {
  return formData.value.planName.trim() !== '' &&
         formData.value.parameter !== '' &&
         formData.value.amount &&
         selectedMachines.value.length > 0 &&
         formData.value.tasks.length > 0 &&
         formData.value.tasks.every(task => 
           task.taskName.trim() !== '' && 
           task.taskDescription.trim() !== ''
         );
});

// Función para cargar máquinas disponibles
const loadMachines = async () => {
  try {
    // Obtener plantas primero
    const plants = await MachineParametersService.getPlants();
    
    if (plants.length > 0) {
      // Usar la primera planta por defecto
      const firstPlant = plants[0];
      currentPlantId.value = firstPlant.id;
      
      // Obtener líneas de producción de la primera planta
      const productionLines = await MachineParametersService.getProductionLinesByPlant(firstPlant.id);
      
      if (productionLines.length > 0) {
        // Usar la primera línea de producción por defecto
        const firstProductionLine = productionLines[0];
        currentProductionLineId.value = firstProductionLine.id;
        
        // Obtener máquinas de la primera línea de producción
        const machines = await MachineParametersService.getMachineriesByProductionLine(firstProductionLine.id);
        
        availableMachines.value = machines.map(machine => ({
          id: machine.id,
          name: machine.name || `Máquina ${machine.id}`
        }));
      } else {
        // Si no hay líneas de producción, usar datos simulados
        availableMachines.value = [
          { id: 101, name: 'MT-430' },
          { id: 102, name: 'MT-450' },
          { id: 103, name: 'MT-490' },
          { id: 104, name: 'MT-510' },
        ];
      }
    } else {
      // Si no hay plantas, usar datos simulados
      availableMachines.value = [
        { id: 101, name: 'MT-430' },
        { id: 102, name: 'MT-450' },
        { id: 103, name: 'MT-490' },
        { id: 104, name: 'MT-510' },
      ];
    }
    
    console.log('Máquinas cargadas:', availableMachines.value);
  } catch (error) {
    console.error('Error al cargar máquinas:', error);
    // En caso de error, usar datos simulados
    availableMachines.value = [
      { id: 101, name: 'MT-430' },
      { id: 102, name: 'MT-450' },
      { id: 103, name: 'MT-490' },
      { id: 104, name: 'MT-510' },
    ];
  }
};

const toggleMachine = (machineId) => {
  const index = selectedMachines.value.indexOf(machineId);
  if (index === -1) {
    selectedMachines.value.push(machineId);
  } else {
    selectedMachines.value.splice(index, 1);
    
    // Eliminar esta máquina de todas las tareas que la contengan
    formData.value.tasks.forEach(task => {
      const machineIndex = task.machineIds.indexOf(machineId);
      if (machineIndex !== -1) {
        task.machineIds.splice(machineIndex, 1);
      }
    });
  }
};

const getMachineName = (machineId) => {
  const machine = availableMachines.value.find(m => m.id === machineId);
  return machine ? machine.name : `ID: ${machineId}`;
};

const addTask = () => {
  formData.value.tasks.push({
    taskId: null,
    taskName: '',
    taskDescription: '',
    machineIds: []
  });
};

const removeTask = (index) => {
  formData.value.tasks.splice(index, 1);
};

const savePlan = async () => {
  try {
    // Crear el objeto de plan dinámico
    const dynamicPlan = {
      planName: formData.value.planName,
      parameter: parseInt(formData.value.parameter, 10),
      amount: Number(formData.value.amount),
      productionLineId: currentProductionLineId.value,
      plantLineId: currentPlantId.value,
      machineIds: [...selectedMachines.value],
      tasks: formData.value.tasks.map(task => ({
        taskName: task.taskName,
        taskDescription: task.taskDescription
      }))
    };
    
    console.log('Enviando plan dinámico a la API:', dynamicPlan);
    
    // Enviar al servicio
    const savedPlan = await maintenanceDynamicPlanService.createPlan(dynamicPlan);
    
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

// Cargar máquinas al montar el componente
onMounted(() => {
  loadMachines();
});
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

label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--clr-text);
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
}

.tasks-section {
  margin-top: 2rem;
}

h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--clr-primary-500);
}

.tasks-header {
  display: flex;
  background: #f5f5f5;
  padding: 0.75rem;
  border-radius: 4px 4px 0 0;
  font-weight: bold;
}

.task-column {
  flex: 1;
}

.actions-column {
  flex: 0 0 40px;
  text-align: center;
}

.task-row {
  display: flex;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.remove-task-btn {
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

.remove-task-btn {
  color: #ff6b6b;
}

.remove-task-btn:hover {
  background: #ffecec;
}

.add-task-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--clr-primary-100);
  color: var(--clr-primary-500);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.add-task-btn:hover {
  background: var(--clr-primary-200);
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