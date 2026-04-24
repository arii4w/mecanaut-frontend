import { PlantAssembler } from "./plant.assembler.js";
import axios from 'axios';
import authHeader from "../../../shared/infraestructure/auth-header.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL+'/api/v1';

const http = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

http.interceptors.request.use((config) => {
    const headers = authHeader();
    config.headers = {
        ...config.headers,
        ...headers
    };
    return config;
});

export class PlantApiService {
    static async getPlants() {
        try {
            const response = await http.get('/plants');
            return PlantAssembler.toEntitiesFromResponse(response);
        } catch (err) {
            console.error('Error loading plant list:', err);
            return [];
        }
    }

    static async getPlantById(id) {
        try {
            const response = await http.get(`/plants/${id}`);
            return PlantAssembler.toEntityFromResource(response.data);
        } catch (err) {
            console.error(`Error loading plant with ID ${id}:`, err);
            throw err;
        }
    }

    static async createPlant(plantData) {
        try {
            if (!plantData.name || !plantData.address || !plantData.email) {
                throw new Error('Name, Address and Email are required');
            }

            const resourceData = PlantAssembler.toResourceFromEntity(plantData);
            const response = await http.post('/plants', resourceData);
            return PlantAssembler.toEntityFromResource(response.data);
        } catch (err) {
            console.error('Error creating plant:', err);
            throw err;
        }
    }

    static async updatePlant(id, plantData) {
        try {
            const resourceData = PlantAssembler.toResourceFromEntity({
                ...plantData,
                id
            });

            const response = await http.put(`/plants/${id}`, resourceData);
            return PlantAssembler.toEntityFromResource(response.data);
        } catch (err) {
            console.error(`Error updating plant ${id}:`, err);
            throw err;
        }
    }

    static async deletePlant(id) {
        try {
            await http.delete(`/plants/${id}`);
            return true;
        } catch (err) {
            console.error(`Error deleting plant ${id}:`, err);
            throw err;
        }
    }
}