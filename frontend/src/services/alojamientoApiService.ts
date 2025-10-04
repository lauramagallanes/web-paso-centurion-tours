// Accommodation API methods for the frontend
import { apiService } from './apiService';

// Types for TypeScript
interface AlojamientoRequest {
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  capacidadMinima: number;
  capacidadMaxima: number;
  cantidadCamasDobles: number;
  cantidadLiteras: number;
  horaLlegada: string; // HH:mm format
  horaSalida: string; // HH:mm format
  precioPorNoche: number;
}

interface AlojamientoResponse {
  id: string;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  capacidadMinima: number;
  capacidadMaxima: number;
  cantidadCamasDobles: number;
  cantidadLiteras: number;
  horaLlegada: string;
  horaSalida: string;
  precioPorNoche: number;
  imagenPrincipal?: string;
  imagenes: AlojamientoImagenResponse[];
  totalImagenes: number;
  tieneGaleria: boolean;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

interface AlojamientoImagenResponse {
  id: string;
  url: string;
  descripcion?: string;
  orden: number;
  esPrincipal: boolean;
  fechaSubida: string;
  alojamientoId: string;
}

interface AlojamientoDisponibilidadRequest {
  alojamientoId: string;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string; // YYYY-MM-DD
}

// Extended API service with accommodation methods
const alojamientoApiService = {
  // Public endpoints
  async getAlojamientos(): Promise<AlojamientoResponse[]> {
    try {
      const response = await fetch(`${apiService.baseURL}/alojamientos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching accommodations: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching accommodations:', error);
      throw error;
    }
  },

  async getAlojamientoById(id: string): Promise<AlojamientoResponse> {
    try {
      const response = await fetch(`${apiService.baseURL}/alojamientos/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching accommodation: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching accommodation:', error);
      throw error;
    }
  },

  async checkAvailability(id: string, checkIn: string, checkOut: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        checkIn,
        checkOut
      });
      
      const response = await fetch(`${apiService.baseURL}/alojamientos/${id}/verificar-disponibilidad?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.warn(`Availability check failed: ${response.status}`);
        return false;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  },

  // Admin endpoints
  async createAlojamiento(data: AlojamientoRequest): Promise<AlojamientoResponse> {
    try {
      const response = await fetch(`${apiService.baseURL}/alojamientos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiService.getToken()}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Error creating accommodation: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating accommodation:', error);
      throw error;
    }
  },

  async updateAlojamiento(id: string, data: AlojamientoRequest): Promise<AlojamientoResponse> {
    try {
      const response = await fetch(`${apiService.baseURL}/alojamientos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiService.getToken()}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating accommodation: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating accommodation:', error);
      throw error;
    }
  },

  async deleteAlojamiento(id: string): Promise<void> {
    try {
      const response = await fetch(`${apiService.baseURL}/alojamientos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting accommodation: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting accommodation:', error);
      throw error;
    }
  },

  async createAvailability(data: AlojamientoDisponibilidadRequest): Promise<any> {
    try {
      const response = await fetch(`${apiService.baseURL}/alojamientos/${data.alojamientoId}/disponibilidad`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiService.getToken()}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Error creating availability: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating availability:', error);
      throw error;
    }
  },

  // Helper methods
  formatCapacity(alojamiento: AlojamientoResponse): string {
    if (alojamiento.capacidadMinima === alojamiento.capacidadMaxima) {
      return `${alojamiento.capacidadMinima} persona${alojamiento.capacidadMinima > 1 ? 's' : ''}`;
    }
    return `${alojamiento.capacidadMinima}-${alojamiento.capacidadMaxima} personas`;
  },

  formatBedConfiguration(alojamiento: AlojamientoResponse): string {
    const config = [];
    
    if (alojamiento.cantidadCamasDobles > 0) {
      config.push(`${alojamiento.cantidadCamasDobles} cama${alojamiento.cantidadCamasDobles > 1 ? 's' : ''} doble${alojamiento.cantidadCamasDobles > 1 ? 's' : ''}`);
    }
    
    if (alojamiento.cantidadLiteras > 0) {
      config.push(`${alojamiento.cantidadLiteras} litera${alojamiento.cantidadLiteras > 1 ? 's' : ''}`);
    }
    
    return config.join(', ');
  },

  formatSchedule(alojamiento: AlojamientoResponse): string {
    return `Check-in: ${alojamiento.horaLlegada} - Check-out: ${alojamiento.horaSalida}`;
  },

  getMainImageUrl(alojamiento: AlojamientoResponse): string {
    if (alojamiento.imagenPrincipal) {
      return alojamiento.imagenPrincipal;
    }
    
    if (alojamiento.imagenes && alojamiento.imagenes.length > 0) {
      const principalImage = alojamiento.imagenes.find(img => img.esPrincipal);
      return principalImage ? principalImage.url : alojamiento.imagenes[0].url;
    }
    
    return '/placeholder-sendero.svg'; // fallback image
  }
};

export { alojamientoApiService };
export type { AlojamientoRequest, AlojamientoResponse, AlojamientoImagenResponse, AlojamientoDisponibilidadRequest };
