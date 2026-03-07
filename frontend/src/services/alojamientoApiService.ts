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
  // Get base URL
  getBaseURL(): string {
    return import.meta.env.VITE_API_BASE_URL || 'https://53dmek6dqk.execute-api.us-east-1.amazonaws.com';
  },

  // Get auth token
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  // Public endpoints
  async getAlojamientos(retries = 1, delay = 1000): Promise<AlojamientoResponse[]> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
        }
        
        // Crear un AbortController para timeout más corto
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
        
        try {
          const response = await fetch(`${this.getBaseURL()}/alojamientos`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Accept': 'application/json; charset=utf-8',
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Error fetching accommodations: ${response.status}`);
          }
          
          return await response.json();
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            // Si es el último intento, lanzar el error
            if (attempt === retries) {
              throw new Error('La solicitud tardó demasiado tiempo. Por favor, intenta nuevamente.');
            }
            // Si no es el último intento, continuar con el siguiente retry
            continue;
          }
          throw fetchError;
        }
      } catch (error) {
        // Si es el último intento, lanzar el error
        if (attempt === retries) {
          console.error('❌ Error en getAlojamientos después de todos los intentos:', error);
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet.');
          }
          throw error;
        }
        // Si no es el último intento, continuar con el siguiente retry
        console.warn(`⚠️ Intento ${attempt + 1} falló, reintentando...`, error);
      }
    }
    // Este código nunca debería ejecutarse, pero TypeScript lo requiere
    throw new Error('Error desconocido al cargar alojamientos');
  },

  async getAlojamientoById(id: string): Promise<AlojamientoResponse> {
    try {
      const response = await fetch(`${this.getBaseURL()}/alojamientos/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
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
      
      const response = await fetch(`${this.getBaseURL()}/alojamientos/${id}/verificar-disponibilidad?${params}`, {
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
      const response = await fetch(`${this.getBaseURL()}/alojamientos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${this.getToken()}`,
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
      const response = await fetch(`${this.getBaseURL()}/alojamientos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${this.getToken()}`,
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
      const response = await fetch(`${this.getBaseURL()}/alojamientos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
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
      const response = await fetch(`${this.getBaseURL()}/alojamientos/${data.alojamientoId}/disponibilidad`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
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
