import axios from 'axios';

const baseEndpoint = import.meta.env.VITE_API_BASE_URL+'/api/v1';
const usersEndpoint = `${baseEndpoint}/users`;

const http = axios.create({
    baseURL: baseEndpoint,
    headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
    }
});

// Interceptor para agregar el token de autenticación
http.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export class PersonalApiService {
    static async getPersonals() {
        try {
            const response = await http.get('/users');
            return response.data.map(user => ({
                id: user.id,
                code: user.username,
                firstName: user.fullName ? user.fullName.split(' ')[0] : '',
                lastName: user.fullName ? user.fullName.split(' ').slice(1).join(' ') : '',
                email: user.email,
                phone: '', 
                role: user.roles && user.roles.length > 0 ? user.roles[0] : '',
                dni: '', 
                note: '' 
            }));
        } catch (err) {
            console.error('Error loading personal list:', err);
            return [];
        }
    }

    static async getPersonalById(id) {
        try {
            const response = await http.get(`/users/${id}`);
            const user = response.data;
            return {
                id: user.id,
                code: user.username,
                firstName: user.fullName ? user.fullName.split(' ')[0] : '',
                lastName: user.fullName ? user.fullName.split(' ').slice(1).join(' ') : '',
                email: user.email,
                phone: '', // Not available in the API response
                role: user.roles && user.roles.length > 0 ? user.roles[0] : '',
                dni: '', // Not available in the API response
                note: '' // Not available in the API response
            };
        } catch (err) {
            console.error(`Error loading personal with ID ${id}:`, err);
            throw err;
        }
    }

    static async createPersonal(personalData) {
        try {
            if (!personalData.code || !personalData.firstName || !personalData.lastName || !personalData.email || !personalData.password) {
                throw new Error('Username, first name, last name, email and password are required');
            }

            const requestData = {
                username: personalData.code,
                password: personalData.password,
                email: personalData.email,
                firstName: personalData.firstName,
                lastName: personalData.lastName,
                roles: personalData.role ? [personalData.role] : ['RoleTechnical']
            };
            console.log('requestData', requestData);
            const response = await http.post('/users', requestData);

            const user = response.data;
            return {
                id: user.id,
                code: user.username,
                firstName: user.fullName ? user.fullName.split(' ')[0] : '',
                lastName: user.fullName ? user.fullName.split(' ').slice(1).join(' ') : '',
                email: user.email,
                phone: '',
                role: user.roles && user.roles.length > 0 ? user.roles[0] : '',
                dni: '',
                note: ''
            };
        } catch (err) {
            console.error('Error creating personal:', err);
            throw err;
        }
    }

    static async updatePersonal(id, personalData) {
        try {
            const requestData = {
                email: personalData.email,
                firstName: personalData.firstName,
                lastName: personalData.lastName,
                roles: personalData.role ? [personalData.role] : ['RoleTechnical']
            };

            console.log('updatePersonal requestData', requestData);
            const response = await http.put(`/users/${id}`, requestData);

            const user = response.data;
            return {
                id: user.id,
                code: user.username,
                firstName: user.fullName ? user.fullName.split(' ')[0] : '',
                lastName: user.fullName ? user.fullName.split(' ').slice(1).join(' ') : '',
                email: user.email,
                phone: '',
                role: user.roles && user.roles.length > 0 ? user.roles[0] : '',
                dni: '',
                note: ''
            };
        } catch (err) {
            console.error(`Error updating personal ${id}:`, err);
            throw err;
        }
    }

    static async deletePersonal(id) {
        try {
            await http.delete(`/users/${id}`);
            return true;
        } catch (err) {
            console.error(`Error deleting personal ${id}:`, err);
            throw err;
        }
    }
}
