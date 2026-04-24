import ApiService from '../../../core/services/api.service';
import axios from 'axios';

class AuthService extends ApiService {
  constructor() {
    super();
    this.baseUrl = import.meta.env.VITE_API_BASE_URL+'/api/v1';
    
    // Inicializar token desde localStorage si existe
    const token = localStorage.getItem('token');
    if (token) {
      this.setAuthToken(token);
    }
  }


  /**
 * Configura el token en el header Authorization para futuras peticiones.
 * @param {string} token - El token JWT a ser enviado en el header.
 */
setAuthToken(token) {
    if (token) {
      // Configurar el token en el header Authorization para futuras solicitudes
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      // Eliminar el token del header si no se proporciona uno
      delete axios.defaults.headers.common['Authorization'];
    }
  }
  
  /**
   * Registra un nuevo usuario y empresa
   * @param {Object} registrationData - Datos de registro
   * @returns {Promise} - Promesa con la respuesta
   */
  async register(registrationData) {
    console.log('registrationData', registrationData);
    try {
      const dataToSend = {
        ruc: registrationData.ruc,
        legalName: registrationData.legalName,
        commercialName: registrationData.commercialName,
        address: registrationData.address,
        city: registrationData.city,
        country: registrationData.country,
        tenantPhone: registrationData.tenantPhone,
        tenantEmail: registrationData.tenantEmail,
        website: registrationData.website,
        subscriptionPlanId: registrationData.subscriptionPlanId,
        username: registrationData.username,
        password: registrationData.password,
        email: registrationData.email,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName
      };

      
      return await this.post('/authentication/sign-up', dataToSend, { skipAuth: true });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al registrar usuario');
    }
  }

  /**
   * Inicia sesión de usuario
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Promise} - Promesa con la respuesta
   */


  async login(loginData) {
    try {
      
      // Verificar que los datos no estén vacíos
      if (!loginData.username || !loginData.password) {
        throw new Error('El nombre de usuario y contraseña son requeridos.');
      }
      
      const dataToSend = {
        username: loginData.username.trim(),
        password: loginData.password
      };

      const response = await this.post('/authentication/sign-in', dataToSend, { skipAuth: true });
      
      // Guardar datos de autenticación si existen
      if (response.data?.token) {
        // Guardar token
        localStorage.setItem('token', response.data.token);
        this.setAuthToken(response.data.token);
        
        // Guardar información básica del usuario
        const userData = {
          id: response.data.id,
          username: response.data.username
        };
        localStorage.setItem('user', JSON.stringify(userData));
        


        // Obtener información completa del usuario
        try {
          const userInfoResponse = await this.get(`/users/${response.data.id}`);
          
          // Actualizar datos del usuario con información completa
          const completeUserData = {
            id: userInfoResponse.data.id,
            username: userInfoResponse.data.username,
            fullName: userInfoResponse.data.fullName,
            email: userInfoResponse.data.email,
            roles: userInfoResponse.data.roles
          };
          
          localStorage.setItem('user', JSON.stringify(completeUserData));
          

        } catch (userInfoError) {
          console.error('❌ Error al obtener información completa del usuario:', userInfoError);
          // No fallar el login si no se puede obtener la información completa
        }
      }
      
      return response.data;
    } catch (error) {
      
      // Mensajes de error más específicos
      if (error.response?.status === 401) {
        throw new Error('Credenciales inválidas. Verifica tu nombre de usuario y contraseña.');
      } else if (error.response?.status === 404) {
        throw new Error('Servicio no disponible. Contacta al administrador.');
      } else if (error.response?.status >= 500) {
        throw new Error('Error del servidor. Intenta más tarde.');
      } else {
        throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
      }
    }
  }
  

  /**
   * Cierra la sesión del usuario
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.setAuthToken(null); 
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean} - true si está autenticado, false en caso contrario
   */
  isAuthenticated() {
    const token = localStorage.getItem('token');
    const isAuth = !!token;
    return isAuth;
  }

  /**
   * Obtiene el token almacenado
   * @returns {string|null} - El token o null si no existe
   */
  getToken() {
    const token = localStorage.getItem('token');
    return token;
  }

  /**
   * Obtiene la información del usuario almacenada
   * @returns {object|null} - La información del usuario o null si no existe
   */
  getUser() {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return user;
  }

  /**
   * Verifica la conectividad con el backend usando un endpoint público
   * @returns {Promise<boolean>} - true si el backend responde, false en caso contrario
   */
  async checkBackendHealth() {
    try {
      
      // Intentar hacer una petición simple al endpoint base para verificar conectividad
      const response = await fetch(import.meta.env.VITE_API_BASE_URL+'/api/v1/authentication/health', {
        method: 'HEAD',
        mode: 'cors'
      });
      
      if (response.ok || response.status === 401) {
        // Si responde 401, significa que el servidor está funcionando pero requiere auth
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('❌ Error de conectividad:', error.message);
      return false;
    }
  }

  /**
   * Método temporal para probar credenciales específicas
   */
  async testSpecificCredentials() {
    try {
      
      const testData = {
        username: 'admin_andina',
        password: 'andina2025'
      };
      
      
      const response = await this.post('/sign-in', testData, { skipAuth: true });
      
      return response.data;
    } catch (error) {
      console.error('❌ Credenciales no funcionan:', error.response?.status, error.response?.data);
      throw error;
    }
  }
}

export default new AuthService();