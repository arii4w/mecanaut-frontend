<template>
  <div class="container">
    <div
        v-if="notification.visible"
        :class="['toast-notification', notification.type]"
    >
      {{ notification.message }}
    </div>
    <header class="breadcrumb-header">
      <h1>Gestión de Maquinaria</h1>
    </header>

    <!-- Selectores de filtrado -->
    <!-- Filtros -->
    <div class="filters-container">
      <!-- Planta -->
      <div class="filter-group">
        <label for="plant-selector">Planta:</label>
        <select 
          id="plant-selector"
          v-model="selectedPlantId"
          @change="onPlantChange"
          class="filter-select">
          <option value="">Selecciona una planta</option>
          <option 
            v-for="plant in plants" 
            :key="plant.id"
            :value="plant.id">
            {{ plant.name }}
          </option>
        </select>
      </div>

      <!-- Línea de Producción -->
      <div class="filter-group">
        <label for="production-line-selector">Línea de Producción:</label>
        <select 
          id="production-line-selector"
          v-model="selectedProductionLineId"
          @change="onProductionLineChange"
          class="filter-select"
          :disabled="!selectedPlantId || productionLines.length === 0">
          <option disabled value="">Selecciona una línea</option>
          <option 
            v-for="line in productionLines"
            :key="line.id"
            :value="line.id">
            {{ line.name }}
          </option>
        </select>
      </div>
    </div>


    <main class="main-container">
      <div class="search-container" :class="{'full-width': !showDetailPanel}">
        <div v-if="loading && !showDetailPanel" class="loading-indicator">
          Cargando datos...
        </div>
        
        <div v-if="error && !showDetailPanel" class="error-message">
          {{ error }}
          <button @click="loadMachineries()">Reintentar</button>
        </div>
        
        <div v-if="!loading && !error" class="table-container">
          <app-record-table
            :columns="tableColumns"
            :data="filteredMachineryData"
            :search-placeholder="'Buscar maquinaria...'"
            :new-label="'Máquina'"
            :searchable-columns="['id', 'name', 'model', 'manufacturer', 'serialNumber']"
            :show-new-button="true"
            @search="onSearch"
            @filter-change="onFilterChange"
            @new-click="openNewMachineModal"
            @ctaClick="onRowClick">
          </app-record-table>
        </div>
      </div>
      
      <!-- Panel de información -->
      <div v-if="showDetailPanel" class="information-panel-container">
        <div class="panel-header">
          <button class="close-button" @click="closeDetailPanel">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        
        <div v-if="loading" class="loading-indicator">
          Cargando información de la máquina...
        </div>
        
        <div v-if="!loading && selectedMachine">
          <app-information-panel
            :headerText="'Máquina: ' + selectedMachine.name + ' (ID: ' + selectedMachine.id + ')'"
            :showHeader="true"
            :showPrimaryButton="true"
            :primaryButtonText="'Editar'"
            @primaryClick="editMachine">
            
            <app-info-section 
              :infoType="2" 
              :data="machineInfoData">
            </app-info-section>
            
            <app-info-container 
              :title="'Métricas'" 
              :titleType="1">
              <app-info-list-items 
                :type="'simpleList'" 
                :items="metricsItems">
              </app-info-list-items>
            </app-info-container>

            <app-info-container 
              :title="'Estado y Mantenimiento'" 
              :titleType="1">
              <app-info-list-items 
                :type="'simpleList'" 
                :items="maintenanceItems">
              </app-info-list-items>
            </app-info-container>
          </app-information-panel>
        </div>
      </div>
    </main>

    <!-- Modal para crear máquina -->
    <div v-if="showMachineModal" class="modal-overlay" @click="closeMachineModal">
      <div class="modal-container" @click.stop>
        <interact-machinery
            :plant-id="selectedPlantId"
            :production-line-id="selectedProductionLineId"
            @save="saveMachine"
            @cancel="closeMachineModal"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref,reactive, computed, onMounted } from 'vue';
import { MachineryApiService } from '../services/machinery-api.service.js';
import InteractMachinery from '../components/interact-machinery.component.vue';
import AppRecordTable from '../../../shared/components/record-table.component.vue';
import AppInformationPanel from '../../../shared/components/information-panel/information-panel.component.vue';
import AppInfoSection from '../../../shared/components/information-panel/info-section.component.vue';
import AppInfoContainer from '../../../shared/components/information-panel/info-container.component.vue';
import AppInfoListItems from '../../../shared/components/information-panel/info-list-items.component.vue';
import { PlantApiService } from '../services/plant-api.service.js';
import { ProductionLineApiService } from '../services/production-line-api.service.js';

// Variables reactivas
const allMachineryData = ref([]);
const filteredMachineryData = ref([]);
const showDetailPanel = ref(false);
const selectedMachine = ref(null);
const metricsItems = ref([]);
const machineInfoData = ref([]);
const maintenanceItems = ref([]);
const loading = ref(false);
const error = ref('');

// Variables para los selectores
const plants = ref([]);
const productionLines = ref([]);
const selectedPlantId = ref('');
const selectedProductionLineId = ref('');

// Estados para el modal
const showMachineModal = ref(false);

// Estado para la búsqueda y filtrado
const searchQuery = ref('');
const activeFilters = ref({});

// Configuración de la tabla
const tableColumns = ref([
  { key: 'id', label: 'ID', type: 'texto' },
  { key: 'name', label: 'Nombre', type: 'texto' },
  { key: 'model', label: 'Modelo', type: 'texto' },
  { key: 'manufacturer', label: 'Fabricante', type: 'texto' },
  { key: 'serialNumber', label: 'N° Serie', type: 'texto' },
  { key: 'status', label: 'Estado', type: 'texto' },
  { key: 'actions', label: 'Acciones', type: 'cta', ctaLabel: 'Ver', ctaVariant: 'primary' }
]);

const getStatusText = (status) => {
  const statusMap = {
    1: 'Activo',
    0: 'Inactivo',
    'ACTIVE': 'Activo',
    'INACTIVE': 'Inactivo',
    'MAINTENANCE': 'En Mantenimiento'
  };
  return statusMap[status] || 'Desconocido';
};

/* ────────────────── Notificaciones ────────────────── */
const notification = reactive({
  visible: false,
  message: '',
  type: 'success'
});

const showNotification = (msg, type) => {
  notification.message = msg;
  notification.type = type;
  notification.visible = true;

  // Ocultar automáticamente después de 4 segundos
  setTimeout(() => {
    notification.visible = false;
  }, 4000);
};

// Funciones para la búsqueda y filtrado
const onSearch = (query) => {
  searchQuery.value = query;
  filterMachinery();
};

const onFilterChange = (filters) => {
  activeFilters.value = filters;
  filterMachinery();
};

const filterMachinery = () => {
  if (!allMachineryData.value.length) {
    filteredMachineryData.value = [];
    return;
  }

  // Mapea para agregar campos legibles (si quieres)
  let filtered = allMachineryData.value.map(machine => ({
    id: machine.id,
    name: machine.name || 'Sin nombre',
    model: machine.model || 'Sin modelo',
    manufacturer: machine.manufacturer || 'Sin fabricante',
    serialNumber: machine.serialNumber || 'Sin número de serie',
    status: getStatusText(machine.status),
    type: machine.type || 'Sin tipo',
    powerConsumption: machine.powerConsumption,
    metrics: machine.metrics || [],
    plantId: machine.plantId,
    productionLineId: machine.productionLineId,
    lastMaintenanceDate: machine.lastMaintenanceDate,
    nextMaintenanceDate: machine.nextMaintenanceDate,
    original: machine
  }));

  // Solo búsqueda por texto si quieres
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(machine => 
      machine.name?.toLowerCase().includes(query) || 
      machine.model?.toLowerCase().includes(query) ||
      machine.manufacturer?.toLowerCase().includes(query) ||
      machine.serialNumber?.toLowerCase().includes(query)
    );
  }

  filteredMachineryData.value = filtered;
};

// Cargar datos
const loadMachineries = async () => {
  loading.value = true;
  error.value = '';
  try {
    let machines = [];

    // ✔️ Si hay línea de producción, filtra por línea
    if (selectedProductionLineId.value) {
      const lineId = Number(selectedProductionLineId.value);
      console.log('Obteniendo máquinas por línea:', lineId);
      machines = await MachineryApiService.getMachinesByProductionLine(lineId);

    // ✔️ Si NO hay línea pero sí planta, filtra por planta
    } else if (selectedPlantId.value) {
      const plantId = Number(selectedPlantId.value);
      console.log('Obteniendo máquinas por planta:', plantId);
      machines = await MachineryApiService.getMachinesByPlant(plantId);

    // ✔️ Si no hay filtros, trae todas
    } else {
      console.log('Obteniendo todas las máquinas');
      machines = await MachineryApiService.getMachines();
    }

    allMachineryData.value = machines;
    filterMachinery();

  } catch (err) {
    console.error('Error al cargar máquinas:', err);
    error.value = err?.message ?? 'Error inesperado';
    allMachineryData.value = [];
    filteredMachineryData.value = [];
  } finally {
    loading.value = false;
  }
};



const loadPlants = async () => {
  try {
    const response = await PlantApiService.getPlants();
    plants.value = response || [];
    console.log('Plantas cargadas:', plants.value);
  } catch (error) {
    console.error('Error al cargar plantas:', error);
    plants.value = [];
  }
};

const loadProductionLines = async (plantId) => {
  try {
    if (!plantId) {
      productionLines.value = [];
      return;
    }
    
    const response = await ProductionLineApiService.getProductionLines(plantId);
    productionLines.value = response || [];
    console.log('Líneas de producción cargadas:', productionLines.value);
  } catch (error) {
    console.error('Error al cargar líneas de producción:', error);
    productionLines.value = [];
  }
};

// Manejadores de eventos
const onPlantChange = async () => {
  selectedProductionLineId.value = '';
  await loadProductionLines(selectedPlantId.value);
  await loadMachineries();
};

const onProductionLineChange = () => {
  loadMachineries();
};

const onRowClick = ({ row }) => {
  selectedMachine.value = row;
  
  machineInfoData.value = [
    { subtitle: 'ID', info: row.id },
    { subtitle: 'Nombre', info: row.name },
    { subtitle: 'Modelo', info: row.model },
    { subtitle: 'Fabricante', info: row.manufacturer },
    { subtitle: 'N° Serie', info: row.serialNumber },
    { subtitle: 'Tipo', info: row.type },
    { subtitle: 'Consumo de energía', info: `${row.powerConsumption} kW` }
  ];
  
  metricsItems.value = row.metrics?.map(metric => ({
    model: `${metric.name}: ${metric.value} ${metric.unit}`
  })) || [];
  
  maintenanceItems.value = [
    { model: `Estado: ${row.status}` },
    { model: `Último mantenimiento: ${formatDate(row.lastMaintenanceDate)}` },
    { model: `Próximo mantenimiento: ${formatDate(row.nextMaintenanceDate)}` }
  ];
  
  showDetailPanel.value = true;
};

const openNewMachineModal = () => {
  if (!selectedProductionLineId.value) {
    showNotification('Por favor, selecciona una Planta y una Línea de Producción antes de registrar una maquinaria.', 'error');    return;
  }
  showMachineModal.value = true;
};
const closeMachineModal = () => {
  showMachineModal.value = false;
};

const editMachine = () => {
  // Por ahora no hacemos nada aquí ya que la edición se manejará de otra manera
  console.log('La edición de máquinas se manejará de otra manera');
};

const saveMachine = async (machineData) => {
  try {
    await MachineryApiService.createMachine(machineData);
    await loadMachineries();
    closeMachineModal();
  } catch (error) {
    console.error('Error al guardar la máquina:', error);
  }
};

const closeDetailPanel = () => {
  showDetailPanel.value = false;
  selectedMachine.value = null;
};

const formatDate = (dateString) => {
  if (!dateString) return 'No programado';
  return new Date(dateString).toLocaleDateString('es-ES');
};

// Inicialización
onMounted(() => {
  loadPlants();
  loadMachineries();
});
</script>

<style scoped>
.container {
  height: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  background: var(--clr-bg, #f5f7f9);
  transition: background 0.3s;
  padding: 1.5rem;
}

.filters-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--clr-surface, #fff);
  border-radius: var(--radius-md, 8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--clr-shadow, rgba(0,0,0,0.1));
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 180px;
}

.filter-group label {
  font-weight: 600;
  color: var(--clr-text, #333);
  font-size: 0.85rem;
  white-space: nowrap;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--clr-border, #ddd);
  border-radius: var(--radius-sm, 4px);
  background-color: var(--clr-surface, #fff);
  color: var(--clr-text, #333);
  font-size: 0.85rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  min-width: 120px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--clr-primary, #007bff);
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.filter-select:disabled {
  background-color: var(--clr-disabled, #f5f5f5);
  color: var(--clr-text-muted, #999);
  cursor: not-allowed;
}

.breadcrumb-header {
  margin-bottom: 2em;
}

.main-container {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 2.5em;
  min-height: 80vh;
  width: 100%;
  transition: gap 0.3s;
}

.search-container {
  display: flex;
  flex-direction: column;
  gap: 2em;
  width: 72%;
  height: 100%;
  transition: width 0.3s ease;
}

.search-container.full-width {
  width: 100% !important;
}

.table-container {
  padding: 1em;
  border: 1px solid var(--clr-shadow, rgba(0,0,0,0.1));
  border-radius: var(--radius-md, 8px);
  height: 100%;
  min-width: 0;
  overflow: hidden;
  transition: box-shadow 0.3s, border 0.3s;
  background-color: var(--clr-surface, #fff);
}

.information-panel-container {
  width: 28%;
  border-radius: var(--radius-md, 8px);
  min-height: 70vh;
  transition: box-shadow 0.3s, border 0.3s, width 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
  position: relative;
  background-color: var(--clr-surface, #fff);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.panel-header {
  position: absolute;
  top: 0.5em;
  right: 0.5em;
  z-index: 2;
}

.close-button {
  background: transparent;
  border: none;
  color: var(--clr-text, #333);
  font-size: 1.5em;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.close-button:hover {
  opacity: 1;
}

.loading-indicator {
  text-align: center;
  padding: 2rem;
  color: var(--clr-gris2, #666);
}

.error-message {
  text-align: center;
  padding: 1rem;
  color: var(--clr-error, #f44336);
  background-color: var(--clr-surface, #fff);
  border-radius: var(--radius-md, 8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.modal-container {
  position: relative;
  width: 650px;
  max-height: 90vh;
  overflow-y: auto;
  background-color: var(--clr-surface, #fff);
  border-radius: var(--radius-md, 8px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}


/* ────────────────── Estilos de Notificación ────────────────── */
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out forwards;
}

.toast-notification.success {
  background-color: #4caf50;
}

.toast-notification.error {
  background-color: var(--clr-danger, #e53935);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Tablet: apila los paneles */
@media (max-width: 1024px) {
  .main-container {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5em;
    min-height: unset;
  }
  .search-container,
  .information-panel-container {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }
  .information-panel-container {
    margin-top: 0.5em;
    height: auto;
    min-height: 50vh;
  }
  
  .filters-container {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }
  
  .filter-group {
    min-width: unset;
    width: 100%;
    justify-content: space-between;
  }
}

/* Móvil */
@media (max-width: 600px) {
  .container {
    padding: 1em 0.2em;
  }
  .breadcrumb-header {
    margin-bottom: 1em;
  }
  .main-container {
    gap: 1em;
  }
  .table-container,
  .information-panel-container {
    border-radius: 12px;
    box-shadow: 0 1px 4px 0 var(--clr-shadow, rgba(0,0,0,0.1));
  }
  .information-panel-container {
    margin-top: 0.5em;
  }
  
  .modal-container {
    width: 95%;
    max-height: 95vh;
  }
}
</style>
