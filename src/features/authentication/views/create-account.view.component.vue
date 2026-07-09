<script>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import ThemeToggle from '../../../shared/components/theme-toggle.component.vue';
import LanguageSwitcher from '../../../shared/components/language-switcher.component.vue';
import { useI18n } from 'vue-i18n';
import Button from '../../../shared/components/button.component.vue';
import AuthService from '../services/auth.service';
import { TelemetryService } from '../../../core/services/telemetry.service';

export default {
  name: 'register',
  components: {
    ThemeToggle,
    LanguageSwitcher,
    Button
  },
  setup() {
    const { t } = useI18n();
    const router = useRouter();
    const currentStep = ref(1);
    const showPassword = ref(false);
    const showConfirmPassword = ref(false);
    const isLoading = ref(false);
    const errorMessage = ref('');
    const isYearly = ref(false);

    const registerForm = reactive({
      // Paso 1: Información de la Empresa
      ruc: '',
      legalName: '',
      commercialName: '',
      address: '',
      city: '',
      country: '',
      tenantPhone: '',
      tenantEmail: '',
      website: '',

      // Paso 2: Plan de Suscripción
      subscriptionPlanId: null,

      // Paso 3: Información Personal
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false
    });

    const plans = [
      {
        id: 1,
        name: 'Free Plan',
        price: '00.00',
        yearlyPrice: '30.00',
        icon: '/gratiuto.svg',
        features: [
          'Up to 10 assets',
          'Basic maintenance',
          '1 admin user'
        ]
      },
      {
        id: 2,
        name: 'Professional Plan',
        price: '15.00',
        yearlyPrice: '144.00',
        icon: '/profesional.svg',
        features: [
          'Up to 50 assets',
          'Advanced maintenance',
          '5 admin users'
        ]
      },
      {
        id: 3,
        name: 'Corporate Plan',
        price: '30.00',
        yearlyPrice: '288.00',
        icon: '/corporativo.svg',
        features: [
          'Unlimited assets',
          'Full maintenance suite',
          'Unlimited users'
        ]
      }
    ];

    const togglePassword = (field) => {
      if (field === 'password') {
        showPassword.value = !showPassword.value;
      } else {
        showConfirmPassword.value = !showConfirmPassword.value;
      }
    };

    const validateEmail = (email) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    };

    const validateRuc = (ruc) => {
      return /^\d{11}$/.test(ruc);
    };

    const validatePhone = (phone) => {
      return /^\+?[\d\s-]{9,}$/.test(phone);
    };

    const errors = computed(() => {
      const result = {};
      
      if (currentStep.value === 1) {
        if (registerForm.ruc && !validateRuc(registerForm.ruc)) {
          result.ruc = 'El RUC debe tener 11 dígitos';
        }
        if (registerForm.tenantEmail && !validateEmail(registerForm.tenantEmail)) {
          result.tenantEmail = 'Email inválido';
        }
        if (registerForm.tenantPhone && !validatePhone(registerForm.tenantPhone)) {
          result.tenantPhone = 'Teléfono inválido';
        }
      } else if (currentStep.value === 3) {
        if (registerForm.email && !validateEmail(registerForm.email)) {
          result.email = 'Email inválido';
        }
        if (registerForm.password && registerForm.password.length < 8) {
          result.password = 'La contraseña debe tener al menos 8 caracteres';
        }
        if (registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword) {
          result.confirmPassword = 'Las contraseñas no coinciden';
        }
      }

      return result;
    });

    const nextStep = () => {
      if (currentStep.value === 1 && isStep1Valid.value && Object.keys(errors.value).length === 0) {
        currentStep.value = 2;
        errorMessage.value = '';
      } else if (currentStep.value === 2 && registerForm.subscriptionPlanId) {
        currentStep.value = 3;
        errorMessage.value = '';
      }
    };

    const previousStep = () => {
      if (currentStep.value > 1) {
        currentStep.value--;
        errorMessage.value = '';
      }
    };

    const selectPlan = (planId) => {
      registerForm.subscriptionPlanId = planId;
    };

    const isStep1Valid = computed(() => {
      return registerForm.ruc && 
             registerForm.legalName && 
             registerForm.commercialName && 
             registerForm.address && 
             registerForm.city && 
             registerForm.country && 
             registerForm.tenantPhone && 
             registerForm.tenantEmail;
    });

    const isFormValid = computed(() => {
      if (currentStep.value === 1) {
        return isStep1Valid.value && Object.keys(errors.value).length === 0;
      } else if (currentStep.value === 2) {
        return registerForm.subscriptionPlanId !== null;
      } else {
        return registerForm.username &&
               registerForm.firstName &&
               registerForm.lastName &&
               registerForm.email &&
               registerForm.password &&
               registerForm.confirmPassword &&
               registerForm.password === registerForm.confirmPassword &&
               registerForm.terms &&
               Object.keys(errors.value).length === 0;
      }
    });

    const onSubmit = async () => {
      if (!isFormValid.value) return;
      
      isLoading.value = true;
      errorMessage.value = '';

      try {
        const registrationData = {
          ruc: registerForm.ruc,
          legalName: registerForm.legalName,
          commercialName: registerForm.commercialName,
          address: registerForm.address,
          city: registerForm.city,
          country: registerForm.country,
          tenantPhone: registerForm.tenantPhone,
          tenantEmail: registerForm.tenantEmail,
          website: registerForm.website,
          subscriptionPlanId: registerForm.subscriptionPlanId,
          username: registerForm.username,
          password: registerForm.password,
          email: registerForm.email,
          firstName: registerForm.firstName,
          lastName: registerForm.lastName
        };

        await AuthService.register(registrationData);
        
        // Telemetría del Experimento IAM-UX (Control)
        await TelemetryService.recordMetric({
          experimentName: "IAM-UX",
          variant: "Control",
          actionType: "User_Registered_Autonomous",
          isSuccess: true,
          additionalData: `planId: ${registerForm.subscriptionPlanId}`
        });

        router.push('/login?registered=true');
      } catch (error) {
        errorMessage.value = error.message;
        
        // Telemetría de Falla
        await TelemetryService.recordMetric({
          experimentName: "IAM-UX",
          variant: "Control",
          actionType: "User_Registered_Autonomous",
          isSuccess: false,
          additionalData: error.message || 'Registration failed'
        });
      } finally {
        isLoading.value = false;
      }
    };

    return {
      t,
      currentStep,
      showPassword,
      showConfirmPassword,
      isLoading,
      errorMessage,
      registerForm,
      errors,
      plans,
      togglePassword,
      nextStep,
      previousStep,
      selectPlan,
      isStep1Valid,
      isFormValid,
      onSubmit,
      isYearly
    };
  },
};
</script>

<template>
  <div class="container">
    <!-- Fondo con clip-path -->
    <div class="skew-background">
      <svg class="screws" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 535 659">
        <!-- ... mantener el SVG existente ... -->
      </svg>
      <svg class="skew-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 41 55" width="100%" height="100%">
        <defs>
          <linearGradient id="gradient" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="var(--clr-primary-100)" />
            <stop offset="100%" stop-color="var(--clr-primary-300)" />
          </linearGradient>
        </defs>
        <path fill="url(#gradient)" d="M12.2119 27.7217C10.5205 29.561 9.49028 31.9892 9.49023 34.6523C9.49061 40.3932 14.27 45.0477 20.166 45.0479C26.062 45.0478 30.8424 40.3933 30.8428 34.6523C30.8427 31.9894 29.8122 29.5609 28.1211 27.7217H35.8271C36.042 28.3558 36.2234 29.0072 36.3672 29.6729L38.6113 30.2393C39.4989 30.4637 40.1209 31.2632 40.1211 32.1787V35.9883C40.1209 36.9063 39.4953 37.7067 38.6045 37.9287L36.0508 38.5645C35.7097 39.7293 35.2536 40.8424 34.6973 41.8887L36.5273 45.1162C36.9631 45.8855 36.8234 46.8435 36.1855 47.4648L33.2754 50.2988C32.653 50.9046 31.6999 51.0504 30.917 50.6592L27.5928 48.9951C26.4982 49.5671 25.3352 50.0174 24.1191 50.3271L23.5156 52.5967C23.2822 53.4721 22.489 54.0819 21.583 54.082H17.5449C16.6364 54.082 15.8416 53.4694 15.6104 52.5908L14.9131 49.9365C13.9389 49.5978 13.0047 49.1674 12.1201 48.6553L8.81836 50.5322C8.02328 50.984 7.01433 50.8573 6.36328 50.2236L3.54785 47.4814C2.89398 46.8446 2.76568 45.8572 3.23633 45.082L5.42383 41.4805C4.96946 40.5691 4.58994 39.6096 4.29492 38.6123L1.50977 37.9092C0.622107 37.6848 0.000211538 36.8853 0 35.9697V32.1602C0.000256578 31.2421 0.625714 30.4417 1.5166 30.2197L3.97949 29.6055C4.12085 28.9629 4.30007 28.3347 4.50781 27.7217H12.2119ZM23.1602 30.1562C23.8179 29.5159 24.8842 29.516 25.542 30.1562C25.6306 30.2425 25.7068 30.3368 25.7715 30.4355C25.973 30.6908 26.0937 31.0128 26.0938 31.3633V37.6123C26.0938 38.4405 25.4228 39.1121 24.5947 39.1123C23.7666 39.1121 23.0947 38.4405 23.0947 37.6123V34.8584L21.3105 36.5957C20.9627 36.9344 20.5005 37.0918 20.0449 37.0723C19.5898 37.0915 19.1279 36.934 18.7803 36.5957L17.0957 34.9551V37.6123C17.0957 38.4406 16.424 39.1123 15.5957 39.1123C14.7678 39.1119 14.0967 38.4403 14.0967 37.6123V31.6719C13.9763 31.1429 14.1262 30.5668 14.5488 30.1553C15.2065 29.5153 16.2729 29.5153 16.9307 30.1553L20.0449 33.1885L23.1602 30.1562ZM20.166 0C21.751 0 23.0361 1.25162 23.0361 2.79492C23.036 3.70802 22.5834 4.51556 21.8877 5.02539V8.08496H28.4746C31.8159 8.08502 34.6283 10.3416 35.4766 13.4131H35.96C37.0642 13.4133 37.9598 14.3088 37.96 15.4131V19.2383C37.9597 20.3425 37.0642 21.238 35.96 21.2383H35.6641V23.5908C35.664 24.1429 35.2161 24.5906 34.6641 24.5908H5.66797C5.11589 24.5906 4.66799 24.1429 4.66797 23.5908V21.2383H4.37207C3.26776 21.2381 2.37229 20.3426 2.37207 19.2383V15.4131C2.37227 14.3088 3.26775 13.4132 4.37207 13.4131H5.00781C5.85601 10.3415 8.66942 8.08506 12.0107 8.08496H18.4434V5.02539C17.7481 4.51552 17.2961 3.70768 17.2959 2.79492C17.296 1.2517 18.5811 0.000122358 20.166 0ZM13.2783 13.4131C11.6935 13.4132 10.4084 14.6649 10.4082 16.208C10.4085 17.7511 11.6936 19.0018 13.2783 19.002C14.8631 19.0019 16.1482 17.7511 16.1484 16.208C16.1483 14.6649 14.8632 13.4132 13.2783 13.4131ZM28.2012 13.4131C26.6166 13.4135 25.3322 14.6651 25.332 16.208C25.3323 17.7509 26.6167 19.0016 28.2012 19.002C29.786 19.002 31.071 17.7511 31.0713 16.208C31.0711 14.6648 29.7861 13.4131 28.2012 13.4131Z"></path>
      </svg>
    </div>

    <!-- Área del formulario -->
    <div class="form-area">
      <div class="login-form">
        <div class="form-content">
          <svg class="form-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 41 55" width="100%" height="100%">
          <defs>
            <linearGradient id="gradient" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="var(--clr-primary-200)" />
              <stop offset="100%" stop-color="var(--clr-primary-100)" />
            </linearGradient>
          </defs>
          <path fill="url(#gradient)" d="M12.2119 27.7217C10.5205 29.561 9.49028 31.9892 9.49023 34.6523C9.49061 40.3932 14.27 45.0477 20.166 45.0479C26.062 45.0478 30.8424 40.3933 30.8428 34.6523C30.8427 31.9894 29.8122 29.5609 28.1211 27.7217H35.8271C36.042 28.3558 36.2234 29.0072 36.3672 29.6729L38.6113 30.2393C39.4989 30.4637 40.1209 31.2632 40.1211 32.1787V35.9883C40.1209 36.9063 39.4953 37.7067 38.6045 37.9287L36.0508 38.5645C35.7097 39.7293 35.2536 40.8424 34.6973 41.8887L36.5273 45.1162C36.9631 45.8855 36.8234 46.8435 36.1855 47.4648L33.2754 50.2988C32.653 50.9046 31.6999 51.0504 30.917 50.6592L27.5928 48.9951C26.4982 49.5671 25.3352 50.0174 24.1191 50.3271L23.5156 52.5967C23.2822 53.4721 22.489 54.0819 21.583 54.082H17.5449C16.6364 54.082 15.8416 53.4694 15.6104 52.5908L14.9131 49.9365C13.9389 49.5978 13.0047 49.1674 12.1201 48.6553L8.81836 50.5322C8.02328 50.984 7.01433 50.8573 6.36328 50.2236L3.54785 47.4814C2.89398 46.8446 2.76568 45.8572 3.23633 45.082L5.42383 41.4805C4.96946 40.5691 4.58994 39.6096 4.29492 38.6123L1.50977 37.9092C0.622107 37.6848 0.000211538 36.8853 0 35.9697V32.1602C0.000256578 31.2421 0.625714 30.4417 1.5166 30.2197L3.97949 29.6055C4.12085 28.9629 4.30007 28.3347 4.50781 27.7217H12.2119ZM23.1602 30.1562C23.8179 29.5159 24.8842 29.516 25.542 30.1562C25.6306 30.2425 25.7068 30.3368 25.7715 30.4355C25.973 30.6908 26.0937 31.0128 26.0938 31.3633V37.6123C26.0938 38.4405 25.4228 39.1121 24.5947 39.1123C23.7666 39.1121 23.0947 38.4405 23.0947 37.6123V34.8584L21.3105 36.5957C20.9627 36.9344 20.5005 37.0918 20.0449 37.0723C19.5898 37.0915 19.1279 36.934 18.7803 36.5957L17.0957 34.9551V37.6123C17.0957 38.4406 16.424 39.1123 15.5957 39.1123C14.7678 39.1119 14.0967 38.4403 14.0967 37.6123V31.6719C13.9763 31.1429 14.1262 30.5668 14.5488 30.1553C15.2065 29.5153 16.2729 29.5153 16.9307 30.1553L20.0449 33.1885L23.1602 30.1562ZM20.166 0C21.751 0 23.0361 1.25162 23.0361 2.79492C23.036 3.70802 22.5834 4.51556 21.8877 5.02539V8.08496H28.4746C31.8159 8.08502 34.6283 10.3416 35.4766 13.4131H35.96C37.0642 13.4133 37.9598 14.3088 37.96 15.4131V19.2383C37.9597 20.3425 37.0642 21.238 35.96 21.2383H35.6641V23.5908C35.664 24.1429 35.2161 24.5906 34.6641 24.5908H5.66797C5.11589 24.5906 4.66799 24.1429 4.66797 23.5908V21.2383H4.37207C3.26776 21.2381 2.37229 20.3426 2.37207 19.2383V15.4131C2.37227 14.3088 3.26775 13.4132 4.37207 13.4131H5.00781C5.85601 10.3415 8.66942 8.08506 12.0107 8.08496H18.4434V5.02539C17.7481 4.51552 17.2961 3.70768 17.2959 2.79492C17.296 1.2517 18.5811 0.000122358 20.166 0ZM13.2783 13.4131C11.6935 13.4132 10.4084 14.6649 10.4082 16.208C10.4085 17.7511 11.6936 19.0018 13.2783 19.002C14.8631 19.0019 16.1482 17.7511 16.1484 16.208C16.1483 14.6649 14.8632 13.4132 13.2783 13.4131ZM28.2012 13.4131C26.6166 13.4135 25.3322 14.6651 25.332 16.208C25.3323 17.7509 26.6167 19.0016 28.2012 19.002C29.786 19.002 31.071 17.7511 31.0713 16.208C31.0711 14.6648 29.7861 13.4131 28.2012 13.4131Z"></path>
        </svg>
          <h1 class="title">{{ t('auth.createAccount') }}</h1>
          <p class="subtitle">{{ t('auth.welcomeMessage') }}</p>

          <!-- Stepper -->
          <div class="stepper-container">
            <div class="stepper">
              <div class="step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
                <div class="step-number">1</div>
                <div class="step-label">{{ t('auth.companyInfo') }}</div>
              </div>
              <div class="step-line" :class="{ completed: currentStep > 1 }"></div>
              <div class="step" :class="{ active: currentStep === 2, completed: currentStep > 2 }">
                <div class="step-number">2</div>
                <div class="step-label">{{ t('auth.planSelection') }}</div>
              </div>
              <div class="step-line" :class="{ completed: currentStep > 2 }"></div>
              <div class="step" :class="{ active: currentStep === 3 }">
                <div class="step-number">3</div>
                <div class="step-label">{{ t('auth.personalInfo') }}</div>
              </div>
            </div>
          </div>

          <!-- Error general -->
          <div v-if="errorMessage" class="error-banner">
            {{ errorMessage }}
          </div>

          <!-- Formulario -->
          <form @submit.prevent="onSubmit" class="register-form">
            <!-- Paso 1: Información de la Empresa -->
            <div v-if="currentStep === 1" class="step-content">

              <div class="form-grid">
                <!-- Columna 1 -->
                <div class="form-column">
                  <div class="form-field">
                    <label>{{ t('auth.ruc') }}</label>
                    <input 
                      v-model="registerForm.ruc" 
                      type="text" 
                      :placeholder="t('auth.rucPlaceholder')"
                      required 
                    />
                    <span v-if="errors.ruc" class="error-message">
                      {{ errors.ruc }}
                    </span>
                  </div>

                  <div class="form-field">
                    <label>{{ t('auth.legalName') }}</label>
                    <input 
                      v-model="registerForm.legalName" 
                      type="text" 
                      :placeholder="t('auth.legalNamePlaceholder')"
                      required 
                    />
                  </div>

                  <div class="form-field">
                    <label>{{ t('auth.commercialName') }}</label>
                    <input 
                      v-model="registerForm.commercialName" 
                      type="text" 
                      :placeholder="t('auth.commercialNamePlaceholder')"
                      required 
                    />
                  </div>

                  <div class="form-field">
                    <label>{{ t('auth.address') }}</label>
                    <input 
                      v-model="registerForm.address" 
                      type="text" 
                      :placeholder="t('auth.addressPlaceholder')"
                      required 
                    />
                  </div>

                  <div class="form-field">
                    <label>{{ t('auth.city') }}</label>
                    <input 
                      v-model="registerForm.city" 
                      type="text" 
                      :placeholder="t('auth.cityPlaceholder')"
                      required 
                    />
                  </div>
                </div>

                <!-- Columna 2 -->
                <div class="form-column">
                  <div class="form-field">
                    <label>{{ t('auth.country') }}</label>
                    <input 
                      v-model="registerForm.country" 
                      type="text" 
                      :placeholder="t('auth.countryPlaceholder')"
                      required 
                    />
                  </div>

                  <div class="form-field phone-field">
                    <label>{{ t('auth.phone') }}</label>
                    <input 
                      v-model="registerForm.tenantPhone" 
                      type="tel" 
                      pattern="[+]?[\d\s-]{9,}"
                      :placeholder="t('auth.phonePlaceholder')"
                      required 
                    />
                    <span v-if="errors.tenantPhone" class="error-message">
                      {{ errors.tenantPhone }}
                    </span>
                  </div>

                  <div class="form-field">
                    <label>{{ t('auth.email') }}</label>
                    <input 
                      v-model="registerForm.tenantEmail" 
                      type="email" 
                      :placeholder="t('auth.emailPlaceholder')"
                      required 
                    />
                    <span v-if="errors.tenantEmail" class="error-message">
                      {{ errors.tenantEmail }}
                    </span>
                  </div>

                  <div class="form-field website-field">
                    <label>{{ t('auth.website') }}</label>
                    <input 
                      v-model="registerForm.website" 
                      type="url" 
                      pattern="https?://.+"
                      :placeholder="t('auth.websitePlaceholder')"
                    />
                  </div>
                </div>
              </div>

              <!-- Botón Siguiente -->
              <Button 
                type="button"
                class="next-btn"
                :disabled="!isStep1Valid || isLoading"
                @click="nextStep"
              >
                <span v-if="!isLoading">{{ t('common.next') }}</span>
                <span v-else class="spinner"></span>
              </Button>
            </div>

            <!-- Paso 2: Selección de Plan -->
            <div v-if="currentStep === 2" class="step-content">
              <div class="billing-toggle">
                <span :class="{ active: !isYearly }" @click="isYearly = false">{{ t('auth.monthly') }}</span>
                <span :class="{ active: isYearly }" @click="isYearly = true">
                  {{ t('auth.yearly') }}
                </span>
              </div>

              <div class="plans-container">
                <div 
                  v-for="plan in plans" 
                  :key="plan.id"
                  class="plan-card"
                  :class="{ selected: registerForm.subscriptionPlanId === plan.id }"
                  @click="selectPlan(plan.id)"
                >
                  <img :src="plan.icon" :alt="plan.name" class="plan-icon">
                  <h4 class="plan-name">{{ plan.name }}</h4>
                  <div class="plan-price">
                    <span class="currency">s/</span>
                    <span class="amount">{{ isYearly ? plan.yearlyPrice : plan.price }}</span>
                    <span class="period">{{ isYearly ? '/año' : '/mes' }}</span>
                  </div>
                  <ul class="plan-features">
                    <li v-for="feature in plan.features" :key="feature">
                      <span class="check-icon">✓</span>
                      {{ feature }}
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Botones de navegación -->
              <div class="buttons-container">
                <Button 
                  type="button"
                  class="back-btn"
                  @click="previousStep"
                  :disabled="isLoading"
                >
                  {{ t('common.back') }}
                </Button>

                <Button 
                  type="button"
                  class="next-btn"
                  :disabled="!registerForm.subscriptionPlanId || isLoading"
                  @click="nextStep"
                >
                  <span v-if="!isLoading">{{ t('common.next') }}</span>
                  <span v-else class="spinner"></span>
                </Button>
              </div>
            </div>

            <!-- Paso 3: Información Personal -->
            <div v-if="currentStep === 3" class="step-content">
              <h3 class="step-title">{{ t('auth.personalInfo') }}</h3>
              <p class="step-description">{{ t('auth.personalInfoDesc') }}</p>

              <div class="form-grid">
                <!-- Columna 1 -->
                <div class="form-column">
                  <div class="form-field">
                    <label>{{ t('auth.username') }}</label>
                    <input 
                      v-model="registerForm.username" 
                      type="text" 
                      :placeholder="t('auth.usernamePlaceholder')"
                      required 
                    />
                  </div>

                  <div class="form-field">
                    <label>{{ t('auth.firstName') }}</label>
                    <input 
                      v-model="registerForm.firstName" 
                      type="text" 
                      :placeholder="t('auth.firstNamePlaceholder')"
                      required 
                    />
                  </div>

                  <div class="form-field">
                    <label>{{ t('auth.lastName') }}</label>
                    <input 
                      v-model="registerForm.lastName" 
                      type="text" 
                      :placeholder="t('auth.lastNamePlaceholder')"
                      required 
                    />
                  </div>
                </div>

                <!-- Columna 2 -->
                <div class="form-column">
                  <div class="form-field">
                    <label>{{ t('auth.email') }}</label>
                    <input 
                      v-model="registerForm.email" 
                      type="email" 
                      :placeholder="t('auth.emailPlaceholder')"
                      required 
                    />
                    <span v-if="errors.email" class="error-message">
                      {{ errors.email }}
                    </span>
                  </div>

                  <div class="form-field">
                    <label>{{ t('auth.password') }}</label>
                    <div class="password-field">
                      <input 
                        v-model="registerForm.password"
                        :type="showPassword ? 'text' : 'password'"
                        :placeholder="t('auth.passwordPlaceholder')"
                        required 
                      />
                      <button 
                        type="button" 
                        class="toggle-password"
                        @click="togglePassword('password')"
                      >
                        <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                      </button>
                    </div>
                    <span v-if="errors.password" class="error-message">
                      {{ errors.password }}
                    </span>
                  </div>

                  <div class="form-field">
                    <label>{{ t('auth.confirmPassword') }}</label>
                    <div class="password-field">
                      <input 
                        v-model="registerForm.confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        :placeholder="t('auth.confirmPasswordPlaceholder')"
                        required 
                      />
                      <button 
                        type="button" 
                        class="toggle-password"
                        @click="togglePassword('confirm')"
                      >
                        <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                      </button>
                    </div>
                    <span v-if="errors.confirmPassword" class="error-message">
                      {{ errors.confirmPassword }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Términos y condiciones -->
              <div class="terms-container">
                <label class="checkbox-container">
                  <input 
                    type="checkbox"
                    v-model="registerForm.terms"
                    required
                  />
                  <span class="checkmark"></span>
                  <span class="terms-text">
                    {{ t('auth.acceptTerms') }}
                    <a href="/terms" target="_blank">{{ t('auth.termsLink') }}</a>
                  </span>
                </label>
              </div>

              <!-- Botones de navegación -->
              <div class="buttons-container">
                <Button 
                  type="button"
                  class="back-btn"
                  @click="previousStep"
                  :disabled="isLoading"
                >
                  {{ t('common.back') }}
                </Button>

                <Button 
                  type="submit"
                  class="submit-btn"
                  :disabled="!isFormValid || isLoading"
                >
                  <span v-if="!isLoading">{{ t('auth.createAccount') }}</span>
                  <span v-else class="spinner"></span>
                </Button>
              </div>
            </div>
          </form>

          <!-- Link a login -->
          <p class="login-link">
            {{ t('auth.alreadyHaveAccount') }}
            <router-link to="/login">{{ t('auth.login') }}</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: var(--clr-white);
  overflow: hidden;
  display: flex;
}

/* Fondo inclinado usando clip-path */
.skew-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 120%;
  height: 100%;
  background: linear-gradient(to bottom right, var(--clr-primary-200), var(--clr-primary-100));
  clip-path: polygon(0 0, 35% 0, 25% 100%, 0% 100%);
  z-index: 1;
}

.skew-logo {
  width: 25vw;
  height: 25vw;
  position: absolute;
  bottom: -5vw;
  left: -30px;
  transform: rotate(-20deg);
}

.screws {
  width: 20vw;
  height: 20vw;
  position: absolute;
  top: -5vw;
  left: 10vw;
  transform: rotate(20deg);
}

/* Área del formulario */
.form-area {
  position: absolute;
  top: 0;
  right: 0;
  width: 65%;
  height: 100%;
  background: var(--clr-white);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
}

.login-form {
  width: 90%;
  max-width: 900px;
  text-align: center;
  padding: 1.5rem;
}

.form-logo {
  width: 40px;
  margin-bottom: 0.75rem;
}

h1 {
  font-size: 1.6rem;
  color: var(--clr-primary-400);
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.welcome-text {
  font-size: 1.3rem;
  color: var(--clr-primary-300);
  margin-bottom: 2rem;
  font-weight: 700;
}

label {
  display: block;
  text-align: left;
  margin: 0.5rem 0 0.2rem;
  color: var(--clr-primary-400);
  font-size: 0.85rem;
}

input::placeholder {
  color: var(--clr-gris2);
}

input[type="email"],
input[type="password"],
input[type="text"],
input[type="tel"],
input[type="url"] {
  width: 100%;
  padding: 0.5rem;
  border-radius: 6px;
  border: 2px solid var(--clr-gris2);
  font-size: 0.9rem;
  background: var(--clr-white);
  color: var(--clr-text);
}

.input-container {
  position: relative;
  width: 100%;
  margin-bottom: 1rem;
}

.toggle-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-icon svg {
  fill: var(--clr-primary-400);
  animation: keyframes-fill 0.5s;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.hidden {
  opacity: 0;
  transform: scale(0);
  pointer-events: none;
}

.visible {
  opacity: 1;
  transform: scale(1);
}

@keyframes keyframes-fill {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 1rem 0;
}

.step-content {
  margin: 1rem 0;
}

.step-title {
  font-size: 1.4rem;
  color: var(--clr-primary-400);
  margin-bottom: 0.5rem;
}

.step-description {
  color: var(--clr-primary-300);
  margin-bottom: 2rem;
}

.stepper-container {
  margin: 1rem 0;
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.step-number {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background-color: var(--clr-gris2);
  color: var(--clr-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.step.active .step-number {
  background-color: var(--clr-primary-400);
}

.step.completed .step-number {
  background-color: var(--clr-success);
}

.step-line {
  flex: 1;
  height: 2px;
  background-color: var(--clr-gris2);
}

.step-line.completed {
  background-color: var(--clr-success);
}

.buttons-container {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.back-btn {
  flex: 1;
}

.next-btn, .submit-btn {
  flex: 2;
}

.error-message {
  color: var(--clr-error);
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.error-banner {
  background-color: var(--clr-error-light);
  color: var(--clr-error);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.terms-container {
  margin: 1rem 0;
  text-align: left;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.terms-text {
  font-size: 0.9rem;
  color: var(--clr-text);
  
  a {
    color: var(--clr-primary-400);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.login-link {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--clr-text);
  
  a {
    color: var(--clr-primary-400);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

@media (max-width: 1200px) {
  .form-area {
    width: 70%;
  }
  
  .form-grid {
    gap: 1rem;
  }
}

@media (max-width: 992px) {
  .form-area {
    width: 75%;
  }
  
  .login-form {
    width: 95%;
  }
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
  
  .skew-background {
    height: 150px;
    clip-path: polygon(0 0, 100% 0, 100% 70%, 0 100%);
  }
  
  .form-area {
    position: relative;
    width: 100%;
    padding: 1rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .skew-logo,
  .screws {
    display: none;
  }
}

/* Ajustes específicos para los campos de teléfono y sitio web */
input[type="tel"],
input[type="url"] {
  &:focus {
    border-color: var(--clr-primary-300);
    outline: none;
  }
  
  &:invalid {
    border-color: var(--clr-error);
  }
}

.form-field {
  margin-bottom: 0.5rem;
  
  &.phone-field,
  &.website-field {
    input {
      padding-left: 0.75rem;
    }
  }
}

/* Estilos para las tarjetas de plan */
.billing-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background: var(--clr-white);
  padding: 0.25rem;
  border-radius: 1.5rem;
  width: fit-content;
  margin: 0 auto 1.5rem;

  span {
    padding: 0.25rem 1rem;
    cursor: pointer;
    border-radius: 1rem;
    color: var(--clr-text);
    font-size: 0.875rem;
    transition: all 0.3s ease;

    &.active {
      background: var(--clr-primary-100);
      color: var(--clr-white);
    }
  }
}

.plans-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.plan-card {
  background: var(--clr-white);
  border-radius: 0.75rem;
  padding: 1.25rem;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid var(--clr-gris2);
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    border-color: var(--clr-primary-300);
  }

  &.selected {
    border-color: var(--clr-primary-300);
    background: var(--clr-primary-100);
    color: var(--clr-white);

    .plan-name, .plan-price, .plan-features li {
      color: var(--clr-white);
    }

    .check-icon {
      color: var(--clr-white);
    }
  }
}

.plan-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 0.75rem;
}

.plan-name {
  font-size: 1rem;
  color: var(--clr-primary-400);
  margin-bottom: 0.5rem;
}

.plan-price {
  font-size: 1.5rem;
  color: var(--clr-primary-300);
  margin-bottom: 1rem;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;

  .currency {
    font-size: 0.875rem;
  }

  .period {
    font-size: 0.75rem;
    color: var(--clr-text);
  }
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;

  li {
    margin: 0.375rem 0;
    font-size: 0.8125rem;
    color: var(--clr-text);
    display: flex;
    align-items: center;
    gap: 0.375rem;

    .check-icon {
      color: var(--clr-success);
      font-size: 0.75rem;
    }
  }
}

@media (max-width: 992px) {
  .plans-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .plans-container {
    grid-template-columns: 1fr;
  }
}
</style>
