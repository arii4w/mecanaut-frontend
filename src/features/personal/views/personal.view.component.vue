<script>
import {ref, onMounted} from 'vue';
import Search from '../../../shared/components/search.component.vue';
import RecordTable from '../../../shared/components/record-table.component.vue';
import InformationPanel from '../../../shared/components/information-panel/information-panel.component.vue';
import InfoSection from '../../../shared/components/information-panel/info-section.component.vue';
import { PersonalApiService } from '../services/personal-api.service.js';
import PersonalFormModal from '../components/personal-form-modal.component.vue';
import ButtonComponent from '../../../shared/components/button.component.vue';

export default {
  components: {
    Search,
    RecordTable,
    InformationPanel,
    InfoSection,
    PersonalFormModal,
    ButtonComponent
  },
  setup() {
    const personalList = ref([]);
    const selectedPerson = ref(null);
    const showInfoPanel = ref(false);
    const showCreateModal = ref(false);
    const showEditModal = ref(false);

    const columns = [
      { key: 'code', label: 'Username', type: 'texto' },
      { key: 'name', label: 'Full Name', type: 'texto' },
      { key: 'email', label: 'Email', type: 'texto' },
      { key: 'role', label: 'Role', type: 'texto', filterable: true },
      { key: 'info', label: 'Info', type: 'informacion' }
    ];
    const roleTranslations = {
      'RoleAdmin': 'Administrador',
      'RoleTechnical': 'Técnico'
    };
    const loadPersonal = async () => {
      try {
        const data = await PersonalApiService.getPersonals();
        personalList.value = data.map(p => ({
          id: p.id,
          code: p.code,
          name: `${p.firstName} ${p.lastName}`,
          email: p.email,
          role: roleTranslations[p.role] || p.role        }));
      } catch (error) {
        console.error('Error loading personal:', error);
      }
    };

    const handleInfoClick = async (item) => {
      try {
        const person = await PersonalApiService.getPersonalById(item.id);
        selectedPerson.value = {
          ...person,
          generalInfo: [
            { subtitle: 'Username', info: person.code },
            { subtitle: 'Full Name', info: `${person.firstName} ${person.lastName}` },
            { subtitle: 'Email', info: person.email },
            { subtitle: 'Role', info: person.role }
          ]
        };
        showInfoPanel.value = true;
      } catch (error) {
        console.error('Error loading personal detail:', error);
      }
    };

    const handleCreate = async (formData) => {
      try {
        await PersonalApiService.createPersonal(formData);
        showCreateModal.value = false;
        await loadPersonal();
      } catch (error) {
        console.error('Error creating person:', error);
      }
    };

    const handleEdit = async (formData) => {
      try {
        await PersonalApiService.updatePersonal(formData.id, formData);
        showEditModal.value = false;
        selectedPerson.value = null;
        await loadPersonal();
      } catch (error) {
        console.error('Error updating person:', error);
      }
    };

    const handleDelete = async (id) => {
      try {
        await PersonalApiService.deletePersonal(id);
        showEditModal.value = false;
        selectedPerson.value = null;
        await loadPersonal();
      } catch (error) {
        console.error('Error deleting person:', error);
      }
    };

    const closePanel = () => {
      showInfoPanel.value = false;
      setTimeout(() => {
        selectedPerson.value = null;
      }, 300);
    };

    onMounted(loadPersonal);

    return {
      personalList,
      selectedPerson,
      showInfoPanel,
      showCreateModal,
      showEditModal,
      handleInfoClick,
      handleCreate,
      handleEdit,
      handleDelete,
      columns,
      closePanel
    };
  },
  methods: {
    handleCtaClick({ row }) {
      this.selectedPerson = row;
      this.showEditModal = true;
    }
  }
}
</script>

<template>
  <div class="container">
    <div class="header-main">
      <h1>Personal Management</h1>
      <div class="divider"></div>
    </div>

    <div class="main-content">
      <div class="left-container">
        <RecordTable
            :columns="columns"
            :data="personalList"
            :searchable-columns="['code', 'name']"
            search-placeholder="Search by username or full name..."
            :show-new-button="true"
            :new-label="'Personal'"
            @action-click="handleCtaClick"
            @info-click="handleInfoClick"
            @new-click="() => showCreateModal = true"
        />
      </div>
      <div class="right-container" :class="{ 'show-panel': showInfoPanel }">
        <InformationPanel
            v-if="showInfoPanel"
            :headerText="'Detailed Information'"
            class="info-panel"
        >
          <template #header>
            <div class="panel-header">
              <h2>Personal Details</h2>
            </div>
          </template>

          <InfoSection
              v-if="selectedPerson"
              :infoType="1"
              title="General Info"
              :data="selectedPerson.generalInfo"
          />
        </InformationPanel>
        <div class="panel-actions">
          <button-component
              variant="primary"
              size="sm"
              icon-left="pi pi-pencil"
              @clicked="showEditModal = true"
          >
            Edit
          </button-component>
          <button-component
              variant="warning"
              size="sm"
              icon-left="pi pi-times"
              @clicked="closePanel"
          >
            Close
          </button-component>
        </div>
      </div>
    </div>

    <PersonalFormModal
        v-if="showCreateModal"
        :is-edit="false"
        :personal-data="selectedPerson"
        @submit="handleCreate"
        @cancel="() => { showCreateModal = false; selectedPerson = null; }"
    />

    <PersonalFormModal
        v-if="showEditModal"
        :is-edit="true"
        :personal-data="selectedPerson"
        @submit="handleEdit"
        @delete="handleDelete"
        @cancel="showEditModal = false"
    />
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  height: 100%;
}

.header-main {
  width: 100%;
}

.header-main h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--clr-text);
}

.divider {
  width: 100%;
  height: 1px;
  background-color: var(--clr-primary-100);
  margin: 10px 0;
}

.main-content {
  display: flex;
  gap: 20px;
  height: calc(100% - 80px);
}

.left-container {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-container {
  flex: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
  width: 0;
}

.right-container.show-panel {
  flex: 1;
  width: auto;
}

.info-panel {
  height: 100%;
  transition: all 0.3s ease;
  min-width: 350px;
  background: var(--clr-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--clr-border);
}

.panel-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--clr-text);
}

.panel-actions {
  display: flex;
  gap: 0.5rem;
}
</style>