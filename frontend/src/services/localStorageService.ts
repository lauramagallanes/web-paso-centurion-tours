// Servicio para manejar datos localmente cuando el backend no está disponible
class LocalStorageService {
  private getStorageKey(entity: string): string {
    return `tinambu_${entity}`;
  }

  // Generic methods for any entity
  getAll<T>(entity: string): T[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(entity));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error loading ${entity} from localStorage:`, error);
      return [];
    }
  }

  save<T extends { id?: string }>(entity: string, items: T[]): void {
    try {
      localStorage.setItem(this.getStorageKey(entity), JSON.stringify(items));
    } catch (error) {
      console.error(`Error saving ${entity} to localStorage:`, error);
    }
  }

  create<T extends { id?: string }>(entity: string, item: Omit<T, 'id'>): T {
    const items = this.getAll<T>(entity);
    const newItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    } as T;
    
    items.push(newItem);
    this.save(entity, items);
    return newItem;
  }

  update<T extends { id?: string }>(entity: string, id: string, updatedItem: Partial<T>): T | null {
    const items = this.getAll<T>(entity);
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updatedItem };
    this.save(entity, items);
    return items[index];
  }

  delete<T extends { id?: string }>(entity: string, id: string): boolean {
    const items = this.getAll<T>(entity);
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length === items.length) return false;
    
    this.save(entity, filteredItems);
    return true;
  }

  // Entity-specific methods
  getSenderos() {
    return this.getAll('senderos');
  }

  createSendero(sendero: any) {
    const newSendero = {
      ...sendero,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };
    return this.create('senderos', newSendero);
  }

  updateSendero(id: string, sendero: any) {
    const updatedSendero = {
      ...sendero,
      fechaActualizacion: new Date().toISOString(),
    };
    return this.update('senderos', id, updatedSendero);
  }

  deleteSendero(id: string) {
    return this.delete('senderos', id);
  }

  getHabitaciones() {
    return this.getAll('habitaciones');
  }

  createHabitacion(habitacion: any) {
    const newHabitacion = {
      ...habitacion,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };
    return this.create('habitaciones', newHabitacion);
  }

  updateHabitacion(id: string, habitacion: any) {
    const updatedHabitacion = {
      ...habitacion,
      fechaActualizacion: new Date().toISOString(),
    };
    return this.update('habitaciones', id, updatedHabitacion);
  }

  deleteHabitacion(id: string) {
    return this.delete('habitaciones', id);
  }

  getGuias() {
    return this.getAll('guias');
  }

  createGuia(guia: any) {
    const newGuia = {
      ...guia,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };
    return this.create('guias', newGuia);
  }

  updateGuia(id: string, guia: any) {
    const updatedGuia = {
      ...guia,
      fechaActualizacion: new Date().toISOString(),
    };
    return this.update('guias', id, updatedGuia);
  }

  deleteGuia(id: string) {
    return this.delete('guias', id);
  }

  // Initialize with some sample data if empty
  initializeSampleData() {
    // Add sample senderos if none exist
    const senderos = this.getSenderos();
    if (senderos.length === 0) {
      this.createSendero({
        nombre: 'Avistamiento de Aves',
        descripcion: 'Recorrido matutino para observar aves nativas de la zona.',
        duracionHoras: 3,
        nivelDificultad: 'FACIL',
        capacidadMaximaGrupo: 8,
        precioPorPersona: 1200,
        urlImagen: '',
        activo: true
      });

      this.createSendero({
        nombre: 'Sendero del Río',
        descripcion: 'Caminata siguiendo el curso del río con paradas para avistamiento.',
        duracionHoras: 4,
        nivelDificultad: 'MODERADO',
        capacidadMaximaGrupo: 6,
        precioPorPersona: 1500,
        urlImagen: '',
        activo: true
      });
    }

    // Add sample habitaciones if none exist
    const habitaciones = this.getHabitaciones();
    if (habitaciones.length === 0) {
      this.createHabitacion({
        numero: '101',
        nombre: 'Habitación Vista al Río',
        descripcion: 'Habitación doble con vista panorámica al río.',
        capacidadMinima: 1,
        capacidadMaxima: 2,
        precioPorPersonaNoche: 2500,
        urlImagen: '',
        activa: true
      });

      this.createHabitacion({
        numero: '102',
        nombre: 'Suite Familiar',
        descripcion: 'Amplia suite ideal para familias con hasta 4 personas.',
        capacidadMinima: 2,
        capacidadMaxima: 4,
        precioPorPersonaNoche: 2000,
        urlImagen: '',
        activa: true
      });
    }

    // Add sample guias if none exist
    const guias = this.getGuias();
    if (guias.length === 0) {
      this.createGuia({
        nombre: 'Carlos',
        apellido: 'Mendez',
        email: 'carlos.mendez@pasocenturion.com',
        telefono: '+598 99 123 456',
        especialidades: 'Aves, Flora nativa',
        idiomas: 'Español, Inglés',
        activo: true
      });

      this.createGuia({
        nombre: 'Ana',
        apellido: 'Rodriguez',
        email: 'ana.rodriguez@pasocenturion.com',
        telefono: '+598 99 789 012',
        especialidades: 'Fotografía, Senderismo',
        idiomas: 'Español, Portugués',
        activo: true
      });
    }
  }
}

// Singleton instance
const localStorageService = new LocalStorageService();

export default localStorageService;
