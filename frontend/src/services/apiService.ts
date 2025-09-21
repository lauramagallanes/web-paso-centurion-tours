// Servicio para manejar todas las llamadas a la API
class ApiService {
  private baseURL: string;

  constructor() {
    // Usar variable de entorno o fallback a la URL actual
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://53dmek6dqk.execute-api.us-east-1.amazonaws.com';
    console.log('🔗 API Service: Usando URL:', this.baseURL);
    console.log('🔗 Entorno:', import.meta.env.VITE_ENV || 'production');
    console.log('🔗 Hostname actual:', typeof window !== 'undefined' ? window.location.hostname : 'server');
  }

  // Método privado para obtener headers con autenticación
  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json; charset=utf-8',
      'Accept-Charset': 'utf-8',
    };

    if (includeAuth) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Método público para obtener headers de autenticación (para useApi)
  public getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Getter público para baseURL (para useApi)
  public get apiBaseURL(): string {
    return this.baseURL;
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

  // ========== MÉTODOS DE SENDEROS - IMAGE MANAGEMENT ==========

  // Upload multiple images to a sendero
  async uploadSenderoImages(senderoId: string, files: FileList | File[], descriptions?: string[]) {
    // Convert FileList to Array if needed
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    
    // Convert files to base64 for API Gateway compatibility
    const filesData = await Promise.all(
      fileArray.map(async (file, index) => {
        const base64 = await this.fileToBase64(file);
        return {
          filename: file.name,
          contentType: file.type,
          size: file.size,
          content: base64,
          descripcion: descriptions?.[index] || ''
        };
      })
    );

    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}/images/senderos/${senderoId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        files: filesData
      }),
    });

    return this.handleResponse(response);
  }

  // Helper method to convert file to base64
  // Compress and convert file to base64
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // If file is larger than 2MB, compress it
      if (file.size > 2 * 1024 * 1024) {
        this.compressImage(file, 0.7).then(compressedFile => {
          const reader = new FileReader();
          reader.readAsDataURL(compressedFile);
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            console.log(`🗜️ Compressed image from ${file.size} to ${compressedFile.size} bytes`);
            resolve(base64);
          };
          reader.onerror = error => reject(error);
        }).catch(reject);
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:image/jpeg;base64, prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = error => reject(error);
      }
    });
  }

  // Compress image to reduce size
  private compressImage(file: File, quality: number = 0.7): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1920x1080)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback to original if compression fails
          }
        }, file.type, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Get images for a sendero
  async getSenderoImages(senderoId: string) {
    const response = await fetch(`${this.baseURL}/images/senderos/${senderoId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Delete single image
  async deleteSenderoImage(imageId: string) {
    const response = await fetch(`${this.baseURL}/images/${imageId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  // Set as main image
  async setSenderoMainImage(imageId: string) {
    const response = await fetch(`${this.baseURL}/images/${imageId}/principal`, {
      method: 'PUT',
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  // Update display order
  async updateSenderoImageOrder(senderoId: string, imageIds: string[]) {
    const response = await fetch(`${this.baseURL}/images/${senderoId}/orden`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify({ imageIds }),
    });

    return this.handleResponse(response);
  }

  // ========== MÉTODOS DE SENDEROS - BOOKING FUNCTIONALITY ==========

  // Calculate detailed price with adults/children breakdown (with debouncing)
  private priceCalculationTimeouts = new Map<string, NodeJS.Timeout>();
  
  async calculateSenderoPrice(
    senderoId: string, 
    adults: number, 
    children: number, 
    startDate?: string, 
    endDate?: string,
    debounced: boolean = true
  ) {
    const key = `${senderoId}-${adults}-${children}-${startDate}-${endDate}`;
    
    if (debounced) {
      // Clear existing timeout
      if (this.priceCalculationTimeouts.has(key)) {
        clearTimeout(this.priceCalculationTimeouts.get(key)!);
      }
  
      // Return a promise that resolves after debounce delay
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(async () => {
          try {
            const result = await this._calculateSenderoPriceInternal(senderoId, adults, children, startDate, endDate);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            this.priceCalculationTimeouts.delete(key);
          }
        }, 500); // 500ms debounce
        
        this.priceCalculationTimeouts.set(key, timeout);
      });
    }
    
    return this._calculateSenderoPriceInternal(senderoId, adults, children, startDate, endDate);
  }
  
  // Internal method for price calculation
  private async _calculateSenderoPriceInternal(
    senderoId: string, 
    adults: number, 
    children: number, 
    startDate?: string, 
    endDate?: string
  ) {
    const requestData = {
      adultos: adults,
      ninos: children,
      ...(startDate && { fechaInicio: startDate }),
      ...(endDate && { fechaFin: endDate })
    };

    const response = await fetch(`${this.baseURL}/senderos/${senderoId}/calcular-precio`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(requestData),
    });

    return this.handleResponse(response);
  }

  // Live price calculation (debounced for real-time updates)
  async calculateSenderoPriceLive(senderoId: string, adults: number, children: number) {
    return this.calculateSenderoPrice(senderoId, adults, children, undefined, undefined, true);
  }

  // Check sendero availability for specific dates
  async checkSenderoAvailability(senderoId: string, startDate: string, endDate: string, shift?: string) {
    const params = new URLSearchParams({
      fechaInicio: startDate,
      fechaFin: endDate,
      ...(shift && { turno: shift })
    });

    const response = await fetch(`${this.baseURL}/senderos/${senderoId}/disponibilidad?${params}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Get available guides for date/shift
  async getAvailableGuides(senderoId: string, date: string, shift: string) {
    const params = new URLSearchParams({ fecha: date, turno: shift });

    const response = await fetch(`${this.baseURL}/senderos/${senderoId}/guias-disponibles?${params}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Get related senderos for recommendations
  async getRelatedSenderos(senderoId: string, limit: number = 3) {
    const params = new URLSearchParams({ limite: limit.toString() });

    const response = await fetch(`${this.baseURL}/senderos/${senderoId}/relacionados?${params}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Verify sendero booking availability
  async verifySenderoBooking(senderoId: string, bookingData: any) {
    const response = await fetch(`${this.baseURL}/senderos/${senderoId}/verificar-disponibilidad`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(bookingData),
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

  // ========== ADMIN - PAYMENT MANAGEMENT ==========

  // Get detailed reservations with payment info
  async getDetailedReservations() {
    const response = await fetch(`${this.baseURL}/reservas/admin/detalladas`, {
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  // Update reservation status
  async updateReservationStatus(reservationId: string, status: string) {
    const response = await fetch(`${this.baseURL}/reservas/${reservationId}/estado`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify({ estado: status }),
    });

    return this.handleResponse(response);
  }

  // Register payment for reservation
  async registerPayment(paymentData: any) {
    const response = await fetch(`${this.baseURL}/pagos/registrar`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(paymentData),
    });

    return this.handleResponse(response);
  }

  // Get payment history for reservation
  async getPaymentHistory(reservationId: string) {
    const response = await fetch(`${this.baseURL}/pagos/reserva/${reservationId}`, {
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  // Get reservations with pending payments
  async getPendingPayments() {
    const response = await fetch(`${this.baseURL}/pagos/pendientes`, {
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  // Get reservation statistics for admin dashboard
  async getReservationStatistics() {
    const response = await fetch(`${this.baseURL}/reservas/admin/estadisticas`, {
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  // ========== ADMIN - GUIDE MANAGEMENT ==========

  // Assign guide to sendero
  async assignGuideToSendero(senderoId: string, guiaId: string) {
    const response = await fetch(`${this.baseURL}/senderos/${senderoId}/guias/${guiaId}`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  // Remove guide from sendero
  async removeGuideFromSendero(senderoId: string, guiaId: string) {
    const response = await fetch(`${this.baseURL}/senderos/${senderoId}/guias/${guiaId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  // Get assigned guides for sendero
  async getAssignedGuides(senderoId: string) {
    const response = await fetch(`${this.baseURL}/senderos/${senderoId}/guias`, {
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  // ========== ADMIN - SENDERO AVAILABILITY MANAGEMENT ==========

  // Create availability range
  async createSenderoAvailability(availabilityData: any) {
    const response = await fetch(`${this.baseURL}/senderos/${availabilityData.senderoId}/disponibilidad`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(availabilityData),
    });

    return this.handleResponse(response);
  }

  // Update availability range
  async updateSenderoAvailability(senderoId: string, disponibilidadId: string, availabilityData: any) {
    const response = await fetch(`${this.baseURL}/senderos/${senderoId}/disponibilidad/${disponibilidadId}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(availabilityData),
    });

    return this.handleResponse(response);
  }

  // Delete availability range
  async deleteSenderoAvailability(senderoId: string, disponibilidadId: string) {
    const response = await fetch(`${this.baseURL}/senderos/${senderoId}/disponibilidad/${disponibilidadId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  // Get all availability ranges for sendero (admin)
  async getSenderoAvailabilities(senderoId: string) {
    const response = await fetch(`${this.baseURL}/senderos/${senderoId}/disponibilidad`, {
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  // Get availability for specific date (public)
  async getSenderoAvailabilityByDate(senderoId: string, fecha: string) {
    const response = await fetch(`${this.baseURL}/senderos/${senderoId}/disponibilidad/fecha/${fecha}`, {
      headers: this.getHeaders(),
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

  // ========== MÉTODOS DE IMÁGENES ==========
  // (Los métodos de imágenes están definidos arriba en la clase)

  async setMainSenderoImage(imageId: string): Promise<any> {
    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}/api/images/${imageId}/principal`, {
      method: 'PUT',
      headers,
    });

    return this.handleResponse(response);
  }

}

// Instancia singleton del servicio
export const apiService = new ApiService();
export default apiService;
