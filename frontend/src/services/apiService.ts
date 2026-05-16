// ====== Sendero availability & block types (shared with admin UI) ======
export type TurnoSendero = 'MANANA' | 'TARDE';

export interface SenderoDisponibilidad {
  id: string;
  senderoId: string;
  fechaInicio: string; // ISO YYYY-MM-DD
  fechaFin: string;
  turno: TurnoSendero;
  diasSemana: string | null; // CSV "LUNES,MARTES,..." or null = all days
  cuposTotal: number;
  activo: boolean;
}

export interface SenderoDisponibilidadRequest {
  fechaInicio: string;
  fechaFin: string;
  turno: TurnoSendero;
  diasSemana?: string | null;
  activo?: boolean;
}

export interface SenderoBloqueo {
  id: string;
  senderoId: string;
  fechaInicio: string;
  fechaFin: string;
  turno: TurnoSendero | null; // null = both shifts
  motivo: string | null;
}

export interface SenderoBloqueoRequest {
  fechaInicio: string;
  fechaFin: string;
  turno?: TurnoSendero | null;
  motivo?: string | null;
}

// Servicio para manejar todas las llamadas a la API
class ApiService {
  private baseURL: string;

  constructor() {
    // Usar variable de entorno o fallback a la URL actual
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://53dmek6dqk.execute-api.us-east-1.amazonaws.com';
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
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          localStorage.clear();
          window.location.href = '/login';
        }
        throw new Error('Token expirado');
      }

      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      // Attach full errorData to the error so callers can inspect structured fields
      // (e.g. alternativas from SinDisponibilidadException responses)
      const err = new Error(errorData.error || `HTTP ${response.status}`) as any;
      err.responseData = errorData;
      err.httpStatus = response.status;
      throw err;
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

  // ========== MÉTODOS DE ALOJAMIENTOS ==========

  async getHabitaciones() {
    const response = await fetch(`${this.baseURL}/alojamientos`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Alias used by RoomDetails for related accommodations
  async getAlojamientos() {
    return this.getHabitaciones();
  }

  async verificarDisponibilidadAlojamiento(id: string, fechaCheckIn: string, fechaCheckOut: string, _numeroHuespedes?: number) {
    const params = new URLSearchParams({ checkIn: fechaCheckIn, checkOut: fechaCheckOut });
    const response = await fetch(`${this.baseURL}/alojamientos/${id}/verificar-disponibilidad?${params}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!response.ok) return null; // ignore 500 errors — backend will validate at checkout
    const result = await response.json();
    // Backend returns a plain boolean
    return { disponible: result === true };
  }

  async getAlojamientoById(id: string) {
    const response = await fetch(`${this.baseURL}/alojamientos/${id}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      return { success: false, error: `Error ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    // El backend devuelve el objeto directamente, no envuelto en { success, data }
    return { success: true, data };
  }

  async getHabitacionesDisponibles(fechaInicio: string, fechaFin: string, numeroPersonas: number) {
    const params = new URLSearchParams({
      fechaInicio,
      fechaFin,
      numeroPersonas: numeroPersonas.toString(),
    });

    const response = await fetch(`${this.baseURL}/alojamientos/disponibles?${params}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getHabitacion(id: string) {
    const response = await fetch(`${this.baseURL}/alojamientos/${id}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // ========== MÉTODOS DE SENDEROS ==========

  async getSenderos(retries = 3, delay = 3000) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          // Backoff exponencial: 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
        }
        
        // Crear un AbortController para timeout más largo para cold start
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 segundos timeout
        
        try {
          const response = await fetch(`${this.baseURL}/senderos`, {
            headers: this.getHeaders(),
            method: 'GET',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);

          // Si es un error 503 (Service Unavailable), reintentar automáticamente
          if (response.status === 503) {
            if (attempt === retries) {
              throw new Error('El servidor no está disponible temporalmente. Por favor, intenta nuevamente en unos momentos.');
            }
            continue;
          }

          return this.handleResponse(response);
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
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet.');
          }
          throw error;
        }
        // Si no es el último intento, continuar con el siguiente retry
      }
    }
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
    
    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    
    // Add files to FormData
    fileArray.forEach((file, index) => {
      formData.append('files', file);
    });
    
    // Add descriptions if provided
    if (descriptions && descriptions.length > 0) {
      descriptions.forEach((desc, index) => {
        if (desc) {
          formData.append('descriptions', desc);
        }
      });
    }

    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = {};
    // DON'T set Content-Type for FormData - let browser set it with boundary
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}/images/senderos/${senderoId}`, {
      method: 'POST',
      headers,
      body: formData, // Send FormData instead of JSON
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

  // ============ ALOJAMIENTO IMAGES ============

  // Upload images for an alojamiento
  async uploadAlojamientoImages(alojamientoId: string, files: FileList | File[], descriptions?: string[]) {
    // Convert FileList to Array if needed
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    
    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    
    // Add files to FormData
    fileArray.forEach((file, index) => {
      formData.append('files', file);
    });
    
    // Add descriptions if provided
    if (descriptions && descriptions.length > 0) {
      descriptions.forEach((desc, index) => {
        if (desc) {
          formData.append('descriptions', desc);
        }
      });
    }
    
    // Custom headers for multipart/form-data (don't set Content-Type, let browser set it with boundary)
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseURL}/images/alojamientos/${alojamientoId}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  // Get images for an alojamiento
  async getAlojamientoImages(alojamientoId: string) {
    const response = await fetch(`${this.baseURL}/images/alojamientos/${alojamientoId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Delete single image (same endpoint as senderos)
  async deleteAlojamientoImage(imageId: string) {
    const response = await fetch(`${this.baseURL}/images/${imageId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  async setAlojamientoMainImage(imageId: string) {
    const response = await fetch(`${this.baseURL}/images/alojamientos/${imageId}/principal`, {
      method: 'PUT',
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  async getAlojamientoDisponibilidades(alojamientoId: string) {
    const response = await fetch(`${this.baseURL}/alojamientos/${alojamientoId}/disponibilidad`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async createAlojamientoDisponibilidad(alojamientoId: string, fechaInicio: string, fechaFin: string) {
    const response = await fetch(`${this.baseURL}/alojamientos/${alojamientoId}/disponibilidad`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ alojamientoId, fechaInicio, fechaFin }),
    });
    return this.handleResponse(response);
  }

  async deleteAlojamientoDisponibilidad(alojamientoId: string, disponibilidadId: string) {
    const response = await fetch(`${this.baseURL}/alojamientos/${alojamientoId}/disponibilidad/${disponibilidadId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  async getBloqueosManuales(alojamientoId: string) {
    const response = await fetch(`${this.baseURL}/alojamientos/${alojamientoId}/bloqueos-manuales`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async createBloqueoManual(alojamientoId: string, fechaInicio: string, fechaFin: string) {
    const response = await fetch(`${this.baseURL}/alojamientos/${alojamientoId}/bloqueos-manuales`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ fechaInicio, fechaFin }),
    });
    return this.handleResponse(response);
  }

  async deleteBloqueoManual(alojamientoId: string, fechaInicio: string, fechaFin: string) {
    const response = await fetch(`${this.baseURL}/alojamientos/${alojamientoId}/bloqueos-manuales`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ fechaInicio, fechaFin }),
    });
    return this.handleResponse(response);
  }

  // ============ ALOJAMIENTO PRESIGNED URL METHODS (for large files >10MB) ============

  /**
   * Get a presigned URL for uploading directly to S3
   * This bypasses API Gateway/Lambda size limits
   */
  async getAlojamientoPresignedUploadUrl(alojamientoId: string, filename: string, contentType: string) {
    const params = new URLSearchParams({
      filename,
      contentType: contentType || 'image/jpeg'
    });
    
    const response = await fetch(`${this.baseURL}/images/alojamientos/${alojamientoId}/presigned-url?${params}`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  /**
   * Upload file directly to S3 using presigned URL
   */
  async uploadToS3(presignedUrl: string, file: File) {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  /**
   * Register uploaded image in database after S3 upload
   */
  async registerAlojamientoImage(alojamientoId: string, imageUrl: string, descripcion?: string) {
    const response = await fetch(`${this.baseURL}/images/alojamientos/${alojamientoId}/register`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ imageUrl, descripcion }),
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

  // Get active availability windows for a sendero (public).
  // Used by the ActivityDetails calendar to filter bookable dates.
  async getSenderoDisponibilidades(senderoId: string): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      senderoId: string;
      fechaInicio: string;
      fechaFin: string;
      turno: 'MANANA' | 'TARDE';
      diasSemana: string | null;
      cuposTotal: number;
      activo: boolean;
    }>;
    message?: string;
  }> {
    const response = await fetch(`${this.baseURL}/senderos/${senderoId}/disponibilidad`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  // ========== ADMIN: SENDERO AVAILABILITY WINDOWS ==========

  async listSenderoDisponibilidadesAdmin(senderoId: string): Promise<SenderoDisponibilidad[]> {
    const response = await fetch(`${this.baseURL}/senderos/admin/${senderoId}/disponibilidad`, {
      headers: this.getHeaders(true),
    });
    const json = await this.handleResponse<{ data: SenderoDisponibilidad[] }>(response);
    return Array.isArray(json?.data) ? json.data : [];
  }

  async createSenderoDisponibilidad(
    senderoId: string,
    payload: SenderoDisponibilidadRequest,
  ): Promise<SenderoDisponibilidad> {
    const response = await fetch(`${this.baseURL}/senderos/admin/${senderoId}/disponibilidad`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    const json = await this.handleResponse<{ data: SenderoDisponibilidad }>(response);
    return json.data;
  }

  async updateSenderoDisponibilidad(
    disponibilidadId: string,
    payload: SenderoDisponibilidadRequest,
  ): Promise<SenderoDisponibilidad> {
    const response = await fetch(`${this.baseURL}/senderos/admin/disponibilidad/${disponibilidadId}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    const json = await this.handleResponse<{ data: SenderoDisponibilidad }>(response);
    return json.data;
  }

  async deleteSenderoDisponibilidad(disponibilidadId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/senderos/admin/disponibilidad/${disponibilidadId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    await this.handleResponse(response);
  }

  // ========== ADMIN: GUÍAS ASIGNADOS A UNA DISPONIBILIDAD ==========

  async listGuiasDeDisponibilidad(disponibilidadId: string): Promise<Array<{
    id: string;
    nombre: string;
    apellido: string;
    nombreCompleto?: string;
    email?: string;
    activo?: boolean;
  }>> {
    const response = await fetch(
      `${this.baseURL}/senderos/admin/disponibilidad/${disponibilidadId}/guias`,
      { headers: this.getHeaders(true) }
    );
    const json = await this.handleResponse<{ data: any[] }>(response);
    return Array.isArray(json?.data) ? json.data : [];
  }

  async asignarGuiaADisponibilidad(disponibilidadId: string, guiaId: string): Promise<void> {
    const response = await fetch(
      `${this.baseURL}/senderos/admin/disponibilidad/${disponibilidadId}/guias/${guiaId}`,
      { method: 'POST', headers: this.getHeaders(true) }
    );
    await this.handleResponse(response);
  }

  async removerGuiaDeDisponibilidad(disponibilidadId: string, guiaId: string): Promise<void> {
    const response = await fetch(
      `${this.baseURL}/senderos/admin/disponibilidad/${disponibilidadId}/guias/${guiaId}`,
      { method: 'DELETE', headers: this.getHeaders(true) }
    );
    await this.handleResponse(response);
  }

  // ========== ADMIN/PUBLIC: SENDERO DATE BLOCKS ==========

  async listSenderoBloqueos(senderoId: string, asAdmin: boolean = false): Promise<SenderoBloqueo[]> {
    const url = asAdmin
      ? `${this.baseURL}/senderos/admin/${senderoId}/bloqueos`
      : `${this.baseURL}/senderos/${senderoId}/bloqueos`;
    const response = await fetch(url, {
      headers: this.getHeaders(asAdmin),
    });
    const json = await this.handleResponse<{ data: SenderoBloqueo[] }>(response);
    return Array.isArray(json?.data) ? json.data : [];
  }

  async createSenderoBloqueo(
    senderoId: string,
    payload: SenderoBloqueoRequest,
  ): Promise<SenderoBloqueo> {
    const response = await fetch(`${this.baseURL}/senderos/admin/${senderoId}/bloqueos`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    const json = await this.handleResponse<{ data: SenderoBloqueo }>(response);
    return json.data;
  }

  async deleteSenderoBloqueo(bloqueoId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/senderos/admin/bloqueos/${bloqueoId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    await this.handleResponse(response);
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

  async getReservasSenderoPorEmail(email: string) {
    const response = await fetch(`${this.baseURL}/reservas/sendero/email/${encodeURIComponent(email)}`, {
      headers: this.getHeaders(true),
    });

    return this.handleResponse(response);
  }

  async getReservasAlojamientoPorEmail(email: string) {
    const response = await fetch(`${this.baseURL}/reservas/alojamiento/email/${encodeURIComponent(email)}`, {
      headers: this.getHeaders(true),
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

  // ========== PLACETOPAY PAYMENT INTEGRATION ==========

  // Create a sendero reservation
  async createSenderoReservation(data: {
    tipoReserva: string;
    emailContacto: string;
    nombreContacto: string;
    telefonoContacto?: string;
    numeroPersonas: number;
    fechaInicio: string;
    fechaFin: string;
    senderoId: string;
    guiaId: string;
    turno: string;
    observaciones?: string;
  }) {
    const response = await fetch(`${this.baseURL}/reservas/sendero`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * Pre-check availability for a sendero before entering checkout.
   * Never returns guide names — only cupos and a boolean flag.
   */
  async checkSenderoDisponibilidad(
    senderoId: string,
    fecha: string,
    turno: 'MANANA' | 'TARDE'
  ): Promise<{
    success: boolean;
    data: {
      disponible: boolean;
      cuposTotal: number;
      cuposOcupados: number;
      cuposRestantes: number;
      hayGuiaDisponible: boolean;
      senderoNombre: string;
      mensajeUsuario?: string;
      alternativas?: Array<{ id: string; nombre: string }>;
    };
  }> {
    const response = await fetch(
      `${this.baseURL}/reservas/sendero/disponibilidad?senderoId=${senderoId}&fecha=${fecha}&turno=${turno}`,
      { headers: this.getHeaders(true) }
    );
    return this.handleResponse(response);
  }

  // Create an alojamiento reservation
  async createAlojamientoReservation(data: {
    emailContacto: string;
    nombreContacto: string;
    telefonoContacto?: string;
    alojamientoId: string;
    fechaCheckIn: string;
    fechaCheckOut: string;
    numeroHuespedes: number;
    observaciones?: string;
    observacionesEspeciales?: string;
  }) {
    const response = await fetch(`${this.baseURL}/reservas/alojamiento`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  // Get blocked dates for an accommodation in a date range
  async getFechasBloqueadas(alojamientoId: string, desde: string, hasta: string) {
    const response = await fetch(
      `${this.baseURL}/alojamientos/${alojamientoId}/fechas-bloqueadas?desde=${desde}&hasta=${hasta}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse(response);
  }

  // Create a PlacetoPay payment session
  async createPaymentSession(reservaId: string, tipoReserva: string, tipoPago: string = 'TOTAL') {
    const response = await fetch(`${this.baseURL}/pagos/crear-sesion`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        reservaId,
        tipoReserva,
        tipoPago,
        ipAddress: null, // Backend will detect from request
        userAgent: navigator.userAgent,
      }),
    });

    return this.handleResponse(response);
  }

  // Get payment status for a single reservation
  async getPaymentStatus(reservaId: string, tipoReserva: string = 'SENDERO') {
    const response = await fetch(
      `${this.baseURL}/pagos/estado/${reservaId}?tipo=${tipoReserva}`,
      { headers: this.getHeaders() }
    );

    return this.handleResponse(response);
  }

  // Create checkout order for multiple cart items (new multi-item flow)
  async createOrdenCheckout(payload: {
    emailContacto: string;
    nombreContacto: string;
    telefonoContacto?: string;
    observaciones?: string;
    tipoPago: string;
    metodoPago?: 'CARD' | 'PREX';
    paisComprador?: string;
    items: Array<{
      tipo: string;
      productoId: string;
      fechaInicio?: string;
      fechaFin?: string;
      turno?: string;
      numeroPersonas?: number;
      fechaCheckIn?: string;
      fechaCheckOut?: string;
      numeroHuespedes?: number;
    }>;
  }) {
    const response = await fetch(`${this.baseURL}/checkout/orden`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    return this.handleResponse(response);
  }

  // Get payment status for an orden (multi-item order)
  async getOrdenPaymentStatus(ordenId: string) {
    const response = await fetch(
      `${this.baseURL}/pagos/estado/orden/${ordenId}`,
      { headers: this.getHeaders() }
    );

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
