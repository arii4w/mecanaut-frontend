<script setup>
import { ref, watch, computed } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ThemeToggle from './theme-toggle.component.vue';
import LanguageSwitcher from './language-switcher.component.vue';
import AuthService from '../../features/authentication/services/auth.service.js';

const { t } = useI18n();

// Props
const props = defineProps({
  userName: {
    type: String,
    default: ''
  },
  userRole: {
    type: String,
    default: ''
  }
});

// Computed para obtener datos del usuario desde localStorage
const userData = computed(() => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
});

const displayUserName = computed(() => {
  return userData.value?.username || '';
});

const displayUserRole = computed(() => {
  const roles = userData.value?.roles || [];
  if (roles.includes('RoleAdmin')) {
    return t('sidebar.user.roles.admin');
  } else if (roles.includes('RoleTechnical')) {
    return t('sidebar.user.roles.technical');
  }
  return roles.join(', ') || '';
});

// Emits
const emit = defineEmits(['sidebar-toggle']);

// Estado
const isExpanded = ref(false);

// Observar cambios en isExpanded para emitir eventos
watch(isExpanded, (newValue) => {
  emit('sidebar-toggle', newValue);
});

// Computed para verificar si el usuario es técnico
const isTechnicalUser = computed(() => {
  const roles = userData.value?.roles || [];
  return roles.includes('RoleTechnical');
});

// Computed para verificar si el usuario es administrador
const isAdminUser = computed(() => {
  const roles = userData.value?.roles || [];
  return roles.includes('RoleAdmin');
});

// Opciones del menú usando computed para reactividad
const menuOptions = computed(() => {
  const allOptions = [
    { 
      path: '/', 
      title: t('sidebar.menu.home'), 
      icon: 'pi pi-home'
    },/*
    { 
      path: '/maintenance-calendar',
      title: t('sidebar.menu.calendar'), 
      icon: 'pi pi-calendar' 
    },*/

    {
      path: '/machinery',
      title: t('sidebar.menu.assetManagement.title'),
      icon: 'pi pi-cog',
      submenu: [
        {
          path: '/machinery',
          title: t('sidebar.menu.assetManagement.machinery')
        },
        {
          path: '/gestion-activos/lineas-produccion',
          title: t('sidebar.menu.assetManagement.productionLines')
        },
        {
          path: '/gestion-activos/plantas',
          title: t('sidebar.menu.assetManagement.plants')
        }
      ]
    },
    {
      path: '/inventario-parts',
      title: t('sidebar.menu.inventory.title'),
      icon: 'pi pi-box',
      submenu: [
        { 
          path: '/inventory-parts', 
          title: t('sidebar.menu.inventory.parts')
        },
        { 
          path: '/purchase-orders', 
          title: t('sidebar.menu.inventory.purchaseOrders')
        }
      ]
    },
    { 
      path: '/orden-trabajo', 
      title: t('sidebar.menu.workOrder'), 
      icon: 'pi pi-file'
    },
    { 
      path: '/maintenance-plan', 
      title: t('sidebar.menu.maintenancePlan'), 
      icon: 'pi pi-wrench'
    },
    { 
      path: '/execution', 
      title: t('sidebar.menu.execution'), 
      icon: 'pi pi-play',
      adminOnly: false // Los admin NO pueden ver esto
    },/*
    { 
      path: '/dashboard', 
      title: t('sidebar.menu.dashboard'), 
      icon: 'pi pi-chart-bar' 
    },*/
  { 
    path: '/machine-parameters', 
    title: t('sidebar.menu.machineParameters'), 
    icon: 'pi pi-sliders-h'
  },
    { 
      path: '/administracion-personal', 
      title: t('sidebar.menu.staffManagement'), 
      icon: 'pi pi-users',
      technicalOnly: false // Los técnicos NO pueden ver esto
    }/*
    { 
      path: '/configuracion', 
      title: t('sidebar.menu.settings'), 
      icon: 'pi pi-cog'
    }*/
  ];

  // Filtrar opciones según el rol del usuario
  return allOptions.filter(option => {
    // Los administradores NO pueden ver execution
    if (option.adminOnly === false && isAdminUser.value) {
      return false;
    }
    // Los técnicos NO pueden ver administracion-personal
    if (option.technicalOnly === false && isTechnicalUser.value) {
      return false;
    }
    return true;
  });
});

// Router
const router = useRouter();

// Métodos
const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value;
};

const expandSidebar = () => {
  isExpanded.value = true;
};

const collapseSidebar = () => {
  isExpanded.value = false;
};

const handleLogout = () => {
  AuthService.logout();
  router.push('/login');
};
</script>

<template>
  <div 
    class="sidebar" 
    :class="{ expanded: isExpanded }" 
    @mouseenter="expandSidebar" 
    @mouseleave="collapseSidebar"
  >
    <div class="toggle-btn" @click="toggleSidebar">
      <i :class="isExpanded ? 'pi pi-chevron-left' : 'pi pi-chevron-right'"></i>
    </div>

    <div class="header-container">
      <div class="logo-container">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 41 55">
          <path d="M12.2119 27.7217C10.5205 29.561 9.49028 31.9892 9.49023 34.6523C9.49061 40.3932 14.27 45.0477 20.166 45.0479C26.062 45.0478 30.8424 40.3933 30.8428 34.6523C30.8427 31.9894 29.8122 29.5609 28.1211 27.7217H35.8271C36.042 28.3558 36.2234 29.0072 36.3672 29.6729L38.6113 30.2393C39.4989 30.4637 40.1209 31.2632 40.1211 32.1787V35.9883C40.1209 36.9063 39.4953 37.7067 38.6045 37.9287L36.0508 38.5645C35.7097 39.7293 35.2536 40.8424 34.6973 41.8887L36.5273 45.1162C36.9631 45.8855 36.8234 46.8435 36.1855 47.4648L33.2754 50.2988C32.653 50.9046 31.6999 51.0504 30.917 50.6592L27.5928 48.9951C26.4982 49.5671 25.3352 50.0174 24.1191 50.3271L23.5156 52.5967C23.2822 53.4721 22.489 54.0819 21.583 54.082H17.5449C16.6364 54.082 15.8416 53.4694 15.6104 52.5908L14.9131 49.9365C13.9389 49.5978 13.0047 49.1674 12.1201 48.6553L8.81836 50.5322C8.02328 50.984 7.01433 50.8573 6.36328 50.2236L3.54785 47.4814C2.89398 46.8446 2.76568 45.8572 3.23633 45.082L5.42383 41.4805C4.96946 40.5691 4.58994 39.6096 4.29492 38.6123L1.50977 37.9092C0.622107 37.6848 0.000211538 36.8853 0 35.9697V32.1602C0.000256578 31.2421 0.625714 30.4417 1.5166 30.2197L3.97949 29.6055C4.12085 28.9629 4.30007 28.3347 4.50781 27.7217H12.2119ZM23.1602 30.1562C23.8179 29.5159 24.8842 29.516 25.542 30.1562C25.6306 30.2425 25.7068 30.3368 25.7715 30.4355C25.973 30.6908 26.0937 31.0128 26.0938 31.3633V37.6123C26.0938 38.4405 25.4228 39.1121 24.5947 39.1123C23.7666 39.1121 23.0947 38.4405 23.0947 37.6123V34.8584L21.3105 36.5957C20.9627 36.9344 20.5005 37.0918 20.0449 37.0723C19.5898 37.0915 19.1279 36.934 18.7803 36.5957L17.0957 34.9551V37.6123C17.0957 38.4406 16.424 39.1123 15.5957 39.1123C14.7678 39.1119 14.0967 38.4403 14.0967 37.6123V31.6719C13.9763 31.1429 14.1262 30.5668 14.5488 30.1553C15.2065 29.5153 16.2729 29.5153 16.9307 30.1553L20.0449 33.1885L23.1602 30.1562ZM20.166 0C21.751 0 23.0361 1.25162 23.0361 2.79492C23.036 3.70802 22.5834 4.51556 21.8877 5.02539V8.08496H28.4746C31.8159 8.08502 34.6283 10.3416 35.4766 13.4131H35.96C37.0642 13.4133 37.9598 14.3088 37.96 15.4131V19.2383C37.9597 20.3425 37.0642 21.238 35.96 21.2383H35.6641V23.5908C35.664 24.1429 35.2161 24.5906 34.6641 24.5908H5.66797C5.11589 24.5906 4.66799 24.1429 4.66797 23.5908V21.2383H4.37207C3.26776 21.2381 2.37229 20.3426 2.37207 19.2383V15.4131C2.37227 14.3088 3.26775 13.4132 4.37207 13.4131H5.00781C5.85601 10.3415 8.66942 8.08506 12.0107 8.08496H18.4434V5.02539C17.7481 4.51552 17.2961 3.70768 17.2959 2.79492C17.296 1.2517 18.5811 0.000122358 20.166 0ZM13.2783 13.4131C11.6935 13.4132 10.4084 14.6649 10.4082 16.208C10.4085 17.7511 11.6936 19.0018 13.2783 19.002C14.8631 19.0019 16.1482 17.7511 16.1484 16.208C16.1483 14.6649 14.8632 13.4132 13.2783 13.4131ZM28.2012 13.4131C26.6166 13.4135 25.3322 14.6651 25.332 16.208C25.3323 17.7509 26.6167 19.0016 28.2012 19.002C29.786 19.002 31.071 17.7511 31.0713 16.208C31.0711 14.6648 29.7861 13.4131 28.2012 13.4131Z"/>
        </svg>
        <span v-if="isExpanded" class="sidebar-title">Mecanet</span>
      </div>
    </div>

    <div class="menu">
      <ul>
        <li v-for="option in menuOptions" :key="option.path">
          <RouterLink :to="option.path" class="menu-link">
            <i :class="option.icon"></i>
            <span v-if="isExpanded">{{ option.title }}</span>
          </RouterLink>
          <div v-if="isExpanded && option.submenu" class="submenu">
            <RouterLink 
              v-for="subItem in option.submenu" 
              :key="subItem.path"
              :to="subItem.path"
              class="submenu-link"
            >
              <span>• {{ subItem.title }}</span>
            </RouterLink>
          </div>
        </li>
      </ul>
    </div>

    <div class="settings-section">
      <div class="settings-header" v-if="isExpanded">
        <i class="pi pi-sliders-h"></i>
        <span>{{ t('sidebar.settings.title') }}</span>
      </div>
      <div class="settings-content">
        <div class="setting-item">
          <ThemeToggle />
        </div>
        <div class="setting-item" v-if="isExpanded">
          <LanguageSwitcher />
        </div>
      </div>
    </div>

    <div class="sidebar-footer">
      <a href="#">
        <i class="pi pi-user"></i>
        <span v-if="isExpanded">
          {{ displayUserName }}<br>
          <small>{{ t('sidebar.user.role') }}: {{ displayUserRole }}</small>
        </span>
      </a>
      <a v-if="isExpanded" href="#" @click.prevent="handleLogout">
        <i class="pi pi-sign-out"></i>
      </a>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sidebar {
  width: 70px;
  background: linear-gradient(180deg, var(--clr-primary-100), var(--clr-primary-200));
  transition: all 0.3s ease;
  overflow: visible;
  height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  position: relative;
  margin: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  z-index: 10;

  &.expanded {
    width: 280px;
  }

  .toggle-btn {
    position: absolute;
    right: -16px;
    top: 24px;
    background: var(--clr-primary-200);
    border: none;
    color: var(--clr-bg);
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    z-index: 10;

    &:hover {
      background: var(--clr-primary-100);
    }

    i {
      font-size: 1rem;
    }
  }

  .menu {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    flex: 1;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--clr-primary-200);
      border-radius: 3px;
      border: 1px solid var(--clr-primary-300);
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        margin: 4px;
        border-radius: 6px;

        .menu-link {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          color: var(--clr-bg);
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s ease;
          cursor: pointer;

          i {
            min-width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
            font-size: 1.2rem;
          }

          span {
            font-size: 0.95rem;
            white-space: nowrap;
          }

          &:hover {
            background: var(--clr-primary-200);
            color: var(--clr-bg);
          }

          &.router-link-active {
            background: var(--clr-primary-200);
            color: var(--clr-bg);
          }
        }

        .submenu {
          margin-left: 48px;
          margin-top: 4px;

          .submenu-link {
            padding: 8px 12px;
            color: var(--clr-bg);
            opacity: 0.8;
            text-decoration: none;
            display: block;
            border-radius: 8px;

            &:hover {
              opacity: 1;
              background: var(--clr-primary-200);
            }

            &.router-link-active {
              opacity: 1;
              background: var(--clr-primary-200);
            }
          }
        }
      }
    }
  }

  .sidebar-footer {
    margin-top: auto;
    padding: 16px;
    border-top: 1px solid var(--clr-primary-200);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    a {
      padding: 12px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      color: var(--clr-bg);
      text-decoration: none;
      cursor: pointer;

      &:first-child {
        flex: 1;
      }

      i {
        min-width: 24px;
        margin-right: 12px;
        font-size: 1.2rem;

        &:only-child {
          margin-right: 0;
        }
      }

      small {
        color: var(--clr-bg);
        opacity: 0.7;
        font-size: 0.8rem;
      }

      &:hover {
        background: var(--clr-primary-200);
      }
    }
  }
}

.header-container {
  padding: 16px;
  padding-bottom: 0;

  .logo-container {
    display: flex;
    align-items: center;
    padding: 12px 7px;
    gap: 16px;

    svg {
      width: 24px;
      height: 24px;
      min-width: 24px;
      display: flex;
      align-items: center;
      justify-content: center;

      path {
        fill: var(--clr-bg);
      }
    }

    .sidebar-title {
      color: var(--clr-bg);
      font-size: 0.95rem;
      white-space: nowrap;
      display: flex;
      align-items: center;
    }
  }
}

.settings-section {
  padding: 16px;
  border-top: 1px solid var(--clr-primary-200);
  border-bottom: 1px solid var(--clr-primary-200);
  margin: 8px 0;

  .settings-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    color: var(--clr-bg);
    opacity: 0.9;

    i {
      font-size: 1.1rem;
    }

    span {
      font-size: 0.9rem;
      font-weight: 500;
    }
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
    


    :deep(.pv-select-button) {
      background: transparent;
      border: none;
      
      .p-button {
        background: transparent;
        border: none;
        color: var(--clr-bg);
        
        &:hover {
          background: var(--clr-primary-300);
        }
      }
    }
  }
}

.theme-toggle-switch {
  width: 48px;
  height: 24px;
  background: linear-gradient(90deg, #8e8cd8 0%, #3a336c 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  position: relative;
  box-sizing: border-box;
  cursor: pointer;
  transition: background 0.3s;
}

.theme-toggle-switch .icon {
  font-size: 1rem;
  color: #fff;
  z-index: 2;
}

.theme-toggle-switch .toggle-circle {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #cfcaf7;
  border-radius: 50%;
  transition: left 0.3s, right 0.3s;
  z-index: 1;
}
</style>