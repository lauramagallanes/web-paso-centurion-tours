// Servicio para manejar todas las llamadas a la API
class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
  }

  // Método privado para obtener headers con autenticación
  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Método privado para manejar respuestas
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado, intentar refresh
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          // Redirect to login o limpiar localStorage
          localStorage.clear();
          window.location.href = '/login';
        }
        throw new Error('Token expirado');
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Refresh token
  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          return true;
        }
      }
    } catch (error) {
      console.error('Error al renovar token:', error);
    }

    return false;
  }

  // ========== MÉTODOS DE AUTENTICACIÓN ==========

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    return this.handleResponse(response);
  }

  async signup(email: string, password: string, nombreCompleto: string) {
    const response = await fetch(`${this.baseURL}/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password, nombreCompleto }),
    });

    return this.handleResponse(response);
  }

  async validateToken() {
    const response = await fetch(`${this.baseURL}/auth/validate`, {
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  // ========== MÉTODOS DE HABITACIONES ==========

  async getHabitaciones() {
    const response = await fetch(`${this.baseURL}/habitaciones`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getHabitacionesDisponibles(fechaInicio: string, fechaFin: string, numeroPersonas: number) {
    const params = new URLSearchParams({
      fechaInicio,
      fechaFin,
      numeroPersonas: numeroPersonas.toString(),
    });

    const response = await fetch(`${this.baseURL}/habitaciones/disponibles?${params}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getHabitacion(id: string) {
    const response = await fetch(`${this.baseURL}/habitaciones/${id}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // ========== MÉTODOS DE SENDEROS ==========

  async getSenderos() {
    const response = await fetch(`${this.baseURL}/senderos`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getSendero(id: string) {
    const response = await fetch(`${this.baseURL}/senderos/${id}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getSenderosByDificultad(dificultad: string) {
    const response = await fetch(`${this.baseURL}/senderos/dificultad/${dificultad}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // ========== MÉTODOS DE GUÍAS ==========

  async getGuias() {
    const response = await fetch(`${this.baseURL}/guias`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getGuiasDisponibles(fecha: string, turno: string) {
    const params = new URLSearchParams({ fecha, turno });

    const response = await fetch(`${this.baseURL}/guias/disponibles?${params}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getGuia(id: string) {
    const response = await fetch(`${this.baseURL}/guias/${id}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // ========== MÉTODOS DE RESERVAS ==========

  async createReserva(reservaData: any) {
    const response = await fetch(`${this.baseURL}/reservas`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(reservaData),
    });

    return this.handleResponse(response);
  }

  async verifyAvailability(reservaData: any) {
    const response = await fetch(`${this.baseURL}/reservas/verificar-disponibilidad`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(reservaData),
    });

    return this.handleResponse(response);
  }

  async calculatePrice(reservaData: any) {
    const response = await fetch(`${this.baseURL}/reservas/calcular-precio`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(reservaData),
    });

    return this.handleResponse(response);
  }

  async getReservaByCode(codigo: string) {
    const response = await fetch(`${this.baseURL}/reservas/codigo/${codigo}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getReservasByEmail(email: string) {
    const response = await fetch(`${this.baseURL}/reservas/email/${email}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // ========== MÉTODOS DE ADMINISTRACIÓN ==========

  async getReservasAdmin() {
    const response = await fetch(`${this.baseURL}/reservas/admin`, {
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  async confirmarReserva(id: string) {
    const response = await fetch(`${this.baseURL}/reservas/admin/${id}/confirmar`, {
      method: 'PUT',
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  async cancelarReserva(id: string) {
    const response = await fetch(`${this.baseURL}/reservas/admin/${id}/cancelar`, {
      method: 'PUT',
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  // ========== MÉTODO GENÉRICO ==========

  async get<T>(endpoint: string, includeAuth: boolean = false): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders(includeAuth),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data: any, includeAuth: boolean = false): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(includeAuth),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: any = null, includeAuth: boolean = false): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(includeAuth),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, includeAuth: boolean = false): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(includeAuth),
    });

    return this.handleResponse<T>(response);
  }
}

// Instancia singleton del servicio
export const apiService = new ApiService();
export default apiService;
