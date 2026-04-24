<template>
  <div class="machinery-form-container">
    <h2 class="form-title">{{ title }}</h2>
    <div
        v-if="notification.visible"
        :class="['toast-notification', notification.type]"
    >
      {{ notification.message }}
    </div>

    <form @submit.prevent="onSubmit" class="machinery-form">
      <!-- === Datos básicos === -->
      <div class="form-row">
        <label for="name">Nombre <span class="required">*</span></label>
        <input
          id="name"
          type="text"
          v-model="formData.name"
          :class="['form-input', { invalid: errors.name }]"
        />
      </div>

      <div class="form-row">
        <label for="manufacturer">Fabricante <span class="required">*</span></label>
        <input
          id="manufacturer"
          type="text"
          v-model="formData.manufacturer"
          :class="['form-input', { invalid: errors.manufacturer }]"
        />
      </div>

      <div class="form-row">
        <label for="serialNumber">N° de Serie <span class="required">*</span></label>
        <input
          id="serialNumber"
          type="text"
          v-model="formData.serialNumber"
          :class="['form-input', { invalid: errors.serialNumber }]"
        />
      </div>

      <div class="form-row">
        <label for="model">Modelo <span class="required">*</span></label>
        <input
          id="model"
          type="text"
          v-model="formData.model"
          :class="['form-input', { invalid: errors.model }]"
        />
      </div>

      <div class="form-row">
        <label for="type">Tipo de máquina <span class="required">*</span></label>
        <input
          id="type"
          type="text"
          v-model="formData.type"
          :class="['form-input', { invalid: errors.type }]"
        />
      </div>

      <div class="form-row">
        <label for="powerConsumption">Consumo de energía (kW) <span class="required">*</span></label>
        <input
          id="powerConsumption"
          type="number"
          v-model.number="formData.powerConsumption"
          min="0"
          step="0.1"
          :class="['form-input', { invalid: errors.powerConsumption }]"
        />
      </div>

      <!-- === Métricas === -->
      <div class="measurements-section" :class="{ invalid: errors.metrics }">
        <!-- encabezados -->
        <div class="measurements-header">
          <div class="header-cell name-header">Métrica</div>
          <div class="header-cell value-header">Valor</div>
          <div v-if="!isEditMode" class="header-cell action-header"></div>
        </div>

        <!-- lista -->
        <div class="measurements-list">
          <div
            v-for="(metric, index) in formData.metrics"
            :key="index"
            class="measurement-row"
          >
            <div class="measurement-cell name-cell">
              <select
                v-model.number="metric.metricId"
                :disabled="isEditMode"
                :class="['form-input', { invalid: errors[`metrics[${index}].metricId`] }]"
              >
                <option :value="null">Seleccionar métrica</option>
                <option
                  v-for="m in availableMetrics"
                  :key="m.id"
                  :value="m.id"
                >
                  {{ m.name }}
                </option>
              </select>
            </div>

            <div class="measurement-cell value-cell">
              <input
                type="number"
                v-model.number="metric.value"
                min="0"
                step="0.01"
                placeholder="Valor"
                :class="['form-input', { invalid: errors[`metrics[${index}].value`] }]"
              />
            </div>

            <div v-if="!isEditMode" class="measurement-cell action-cell">
              <button
                type="button"
                class="remove-btn"
                @click="removeMetric(index)"
                v-if="formData.metrics.length > 1"
              >
                <!-- ícono X -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- error global -->
        <div class="measurements-error" v-if="typeof errors.metrics === 'string'">
          {{ errors.metrics }}
        </div>

        <!-- botón agregar -->
        <button
          v-if="!isEditMode"
          type="button"
          class="add-measurement-btn"
          @click="addMetric"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Agregar Métrica
        </button>
      </div>

      <!-- === Acciones === -->
      <div class="form-actions">
        <button type="button" class="btn-cancel" @click="onCancel">Cancelar</button>
        <button type="submit" class="btn-save">Guardar</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useForm } from 'vee-validate'
import * as yup from 'yup'
import { MachineryApiService } from '../services/machinery-api.service'

/* ────────────────── Props & Emits ────────────────── */
interface Props {
  machinery?: any
  title?: string
  productionLineId?: number | string | null
  plantId?: number | string | null
}

const props = withDefaults(defineProps<Props>(), {
  machinery: null,
  title: 'Nueva Maquinaria',
  productionLineId: null,
  plantId: null
})

const emit = defineEmits(['save', 'cancel'])
const isEditMode = computed(() => !!props.machinery)

/* ────────────────── Helpers ────────────────── */
const blankMetric = () => ({
  metricId: null as number | null,
  value: null as number | null,
  measuredAt: new Date().toISOString()
})

/* ────────────────── Form state ────────────────── */
const formData = reactive({
  name: '',
  manufacturer: '',
  serialNumber: '',
  model: '',
  type: '',
  powerConsumption: null as number | null,
  plantId: null as number | null,
  metrics: [blankMetric()]
})

/* ────────────────── Validation ────────────────── */
const schema = yup.object({
  name: yup.string().required('El nombre es requerido'),
  manufacturer: yup.string().required('El fabricante es requerido'),
  serialNumber: yup.string().required('El número de serie es requerido'),
  model: yup.string().required('El modelo es requerido'),
  type: yup.string().required('El tipo es requerido'),
  powerConsumption: yup
    .number()
    .typeError('El consumo de energía debe ser un número')
    .required('El consumo de energía es requerido')
    .min(0, 'El consumo debe ser mayor o igual a 0'),
  plantId: yup.number().nullable(),
  metrics: yup
    .array()
    .of(
      yup.object({
        metricId: yup
          .number()
          .nullable()
          .required('Debe seleccionar una métrica'),
        value: yup
          .number()
          .nullable()
          .required('El valor es requerido')
          .min(0, 'El valor debe ser mayor o igual a 0'),
        measuredAt: yup.string().required()
      })
    )
    .min(1, 'Debe agregar al menos una métrica válida')
})

const { handleSubmit, errors,setValues } = useForm({
  validationSchema: schema,
  initialValues: formData
})
watch(formData, (newValues) => {
  setValues(newValues)
}, { deep: true })

watch(errors, (val) => {
  console.log('Errores de validación:', val);
})

/* ────────────────── Métricas disponibles ────────────────── */
const availableMetrics = ref<{ id: number; name: string; unit?: string }[]>([])

onMounted(async () => {
  // cargar métricas
  try {
    const metrics = await MachineryApiService.getAvailableMetrics()
    availableMetrics.value = (metrics || []).filter(
      (m: any) => m && m.name !== undefined
    )
  } catch (e) {
    console.error('Error cargando métricas:', e)
  }

  // modo edición → rellenar formulario
  if (isEditMode.value && props.machinery) {
    Object.assign(formData, {
      name: props.machinery.name ?? '',
      manufacturer: props.machinery.manufacturer ?? '',
      serialNumber: props.machinery.serialNumber ?? '',
      model: props.machinery.model ?? '',
      type: props.machinery.type ?? '',
      powerConsumption: props.machinery.powerConsumption ?? null,
      plantId: props.machinery.plantId ?? null,
      metrics:
        props.machinery.metrics?.length > 0
          ? props.machinery.metrics.map((m: any) => ({
              metricId: Number(m.metricId),
              value: Number(m.value),
              measuredAt: m.measuredAt ?? new Date().toISOString()
            }))
          : [blankMetric()]
    })
  }
})

/* ────────────────── Acciones métrica ────────────────── */
const addMetric = () => {
  if (!isEditMode.value) formData.metrics.push(blankMetric())
}

const removeMetric = (index: number) => {
  if (!isEditMode.value && formData.metrics.length > 1) {
    formData.metrics.splice(index, 1)
  }
}

/* ────────────────── Submit ────────────────── */
const productionLineIdNum = computed(() => {
  if (
    props.productionLineId === null ||
    props.productionLineId === undefined ||
    props.productionLineId === ''
  )
    return null
  return Number(props.productionLineId)
})

/* ────────────────── Notificaciones ────────────────── */
const notification = reactive({
  visible: false,
  message: '',
  type: 'success' // puede ser 'success' o 'error'
})

const showNotification = (msg: string, type: 'success' | 'error') => {
  notification.message = msg
  notification.type = type
  notification.visible = true

  // Ocultar la notificación después de 3 segundos si es un error
  // (Si es éxito, el modal se cerrará antes de que esto termine)
  if (type === 'error') {
    setTimeout(() => {
      notification.visible = false
    }, 4000)
  }
}

/* ────────────────── Submit Actualizado ────────────────── */
const onSubmit = handleSubmit(async () => {
  try {
    const validMetrics = formData.metrics
        .filter((m) => m.metricId !== null && m.value !== null)
        .map((m) => ({
          metricId: Number(m.metricId),
          value: Number(m.value),
          measuredAt: m.measuredAt
        }))

    const machineData = {
      serialNumber: formData.serialNumber,
      name: formData.name,
      manufacturer: formData.manufacturer,
      // Usamos el ID de la planta que viene desde la vista
      plantId: props.plantId ? Number(props.plantId) : null,
      model: formData.model,
      type: formData.type,
      powerConsumption:
          formData.powerConsumption !== null
              ? Number(formData.powerConsumption)
              : null,
      metrics: validMetrics
    }
    const createdMachine = await MachineryApiService.createMachine(machineData)

    if (productionLineIdNum.value !== null) {
      await MachineryApiService.assignMachineToProductionLine(
          createdMachine.id,
          productionLineIdNum.value
      )
    }

    // 1. Mostrar notificación de éxito
    showNotification('Maquinaria creada con éxito', 'success')

    // 2. Esperar 1.5 segundos para que el usuario lo lea, y luego cerrar el modal
    setTimeout(() => {
      emit('save', createdMachine)
    }, 1500)

  } catch (err: any) {
    console.error('Error guardando máquina:', err)

    // 3. Mostrar notificación de error capturando el mensaje del Service
    const errorMessage = err.message || 'Ocurrió un error inesperado al crear la maquinaria'
    showNotification(errorMessage, 'error')
  }
})
/* ────────────────── Cancelar ────────────────── */
const onCancel = () => emit('cancel')

/* ────────────────── Helper UI ────────────────── */
const getMetricUnit = (metricId: number | null) => {
  if (metricId == null) return ''
  const metric = availableMetrics.value.find((m) => m.id === metricId)
  return metric?.unit ?? ''
}
</script>

<style lang="scss" scoped>
*{
    font-family: "Montserrat" !important; 
}
.machinery-form-container {
  width: 100%;
  background-color: var(--clr-bg);
  border-radius: var(--radius-md);
  padding: 1.5em;
  box-shadow: 0 2px 10px var(--clr-shadow);
}


.form-title {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--clr-primary-400);
  font-size: 1.5rem;
  font-weight: 600;
}

.machinery-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    color: var(--clr-text);
    font-weight: 500;
    font-size: 0.9rem;
  }
}

.form-input {
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
  background-color: var(--clr-bg);
  color: var(--clr-text);
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: var(--clr-primary-300);
    box-shadow: 0 0 0 2px rgba(var(--clr-primary-300), 0.1);
  }

  &.with-unit {
    padding-right: 3rem;
  }
  
  &[readonly] {
    background-color: var(--clr-surface);
    cursor: default;
    opacity: 0.9;
  }
}

.measurements-section {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
  background-color: var(--clr-bg);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 2px 8px var(--clr-shadow);
  }
}

.measurements-header {
  display: flex;
  background-color: var(--clr-primary-400);
  color: white;
  padding: 0.6rem 1rem;
  font-weight: 500;
}

.header-cell {
  flex: 1;
  
  &.unit-header {
    flex: 0 0 80px;
    text-align: center;
  }
  
  &.value-header {
    flex: 0 0 100px;
    text-align: center;
  }
  
  &.action-header {
    flex: 0 0 50px;
  }
}

.measurements-list {
  max-height: 200px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--clr-primary-200);
    border-radius: 3px;
  }
}

.measurement-row {
  display: flex;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: var(--clr-surface);
  }
}

.measurement-cell {
  padding: 0.5rem;
  flex: 1;
  
  .form-input {
    border: 1px solid transparent;
    border-radius: 4px;
    padding: 0.5rem;
    background-color: transparent;
    
    &:focus {
      background-color: var(--clr-bg);
      border-color: var(--clr-primary-300);
    }
  }
  
  &.unit-cell {
    flex: 0 0 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  &.value-cell {
    flex: 0 0 100px;
  }
  
  &.action-cell {
    flex: 0 0 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.remove-btn {
  background: none;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ff5252;
  opacity: 0.5;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(255, 82, 82, 0.1);
    opacity: 1;
  }
  
  svg {
    stroke: currentColor;
  }
}

.unit-display {
  padding: 0.5rem;
  background-color: var(--clr-surface, #f5f5f5);
  border-radius: 4px;
  font-size: 0.85rem;
  color: var(--clr-text, #333);
  text-align: center;
  min-height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
}

.add-measurement-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: var(--clr-primary-300);
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
  
  &:hover {
    background-color: var(--clr-surface);
    color: var(--clr-primary-400);
  }
  
  svg {
    stroke: currentColor;
  }
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-cancel, .btn-save {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  
  &:active {
    transform: translateY(1px);
  }
}

.btn-cancel {
  background-color: transparent;
  border: 1px solid #ddd;
  color: var(--clr-text);
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.btn-save {
  background-color: var(--clr-primary-300);
  border: none;
  color: white;
  
  &:hover {
    background-color: var(--clr-primary-400);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
}

.required {
  color: var(--clr-danger, #e53935);
  font-weight: bold;
  margin-left: 2px;
  font-size: 1em;
}

.optional {
  color: var(--clr-primary-300);
  font-size: 0.95em;
  margin-left: 4px;
}

.form-input.invalid {
  border-color: var(--clr-danger, #e53935);
  background-color: #fff6f6;
}

.measurements-section.invalid {
  border-color: var(--clr-danger, #e53935);
}

.measurements-error {
  color: var(--clr-danger, #e53935);
  font-size: 0.95em;
  margin: 0.5em 0 0 1em;
}

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

  &.success {
    background-color: #4caf50; // Verde de éxito
  }

  &.error {
    background-color: var(--clr-danger, #e53935); // Rojo de error
  }
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

// Soporte para tema oscuro
[data-theme='dark'] {
  .form-input {
    border-color: #444;
    
    &:focus {
      border-color: var(--clr-primary-200);
    }
    
    &[readonly] {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }
  
  .measurements-section {
    border-color: #444;
  }
  
  .measurement-row {
    border-bottom-color: #333;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }
  
  .btn-cancel {
    border-color: #444;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }
  
  .remove-btn:hover {
    background-color: rgba(255, 82, 82, 0.2);
  }
}

// Media queries para responsive
@media (max-width: 576px) {
  .machinery-form-container {
    padding: 1.5rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>
