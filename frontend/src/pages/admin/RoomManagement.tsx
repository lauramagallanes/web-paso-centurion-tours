import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { useApi } from '../../hooks/useApi';

interface Habitacion {
  id?: number;
  numero: string;
  nombre: string;
  descripcion?: string;
  capacidadMinima: number;
  capacidadMaxima: number;
  precioPorPersonaNoche: number;
  activa: boolean;
  urlImagen?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

const RoomManagement: React.FC = () => {
  const { data: habitaciones = [], loading, error, execute: loadHabitaciones } = useApi<Habitacion[]>();
  const { loading: actionLoading, error: actionError, execute: executeAction } = useApi();
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedHabitacion, setSelectedHabitacion] = useState<Habitacion | null>(null);
  const [formData, setFormData] = useState<Habitacion>({
    numero: '',
    nombre: '',
    descripcion: '',
    capacidadMinima: 1,
    capacidadMaxima: 2,
    precioPorPersonaNoche: 0,
    activa: true,
    urlImagen: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadHabitaciones('/api/admin/habitaciones');
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-UY');
  };

  const resetForm = () => {
    setFormData({
      numero: '',
      nombre: '',
      descripcion: '',
      capacidadMinima: 1,
      capacidadMaxima: 2,
      precioPorPersonaNoche: 0,
      activa: true,
      urlImagen: ''
    });
    setErrors({});
    setSelectedHabitacion(null);
  };

  const handleOpenModal = (mode: 'create' | 'edit' | 'view', habitacion?: Habitacion) => {
    setModalMode(mode);
    
    if (habitacion) {
      setSelectedHabitacion(habitacion);
      setFormData({ ...habitacion });
    } else {
      resetForm();
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleInputChange = (field: keyof Habitacion, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.numero.trim()) {
      newErrors.numero = 'Número de habitación es obligatorio';
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'Nombre es obligatorio';
    }

    if (formData.capacidadMinima < 1) {
      newErrors.capacidadMinima = 'Capacidad mínima debe ser al menos 1';
    }

    if (formData.capacidadMaxima < formData.capacidadMinima) {
      newErrors.capacidadMaxima = 'Capacidad máxima debe ser mayor o igual a la mínima';
    }

    if (formData.precioPorPersonaNoche <= 0) {
      newErrors.precioPorPersonaNoche = 'Precio debe ser mayor a 0';
    }

    if (formData.urlImagen && !isValidUrl(formData.urlImagen)) {
      newErrors.urlImagen = 'URL de imagen no válida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const endpoint = modalMode === 'create' 
        ? '/api/admin/habitaciones'
        : `/api/admin/habitaciones/${formData.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      await executeAction(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      // Recargar habitaciones
      await loadHabitaciones('/api/admin/habitaciones');
      handleCloseModal();
      
    } catch (error) {
      console.error('Error guardando habitación:', error);
    }
  };

  const handleToggleActive = async (habitacion: Habitacion) => {
    try {
      await executeAction(`/api/admin/habitaciones/${habitacion.id}/toggle-active`, {
        method: 'PUT'
      });

      // Recargar habitaciones
      await loadHabitaciones('/api/admin/habitaciones');
      
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const handleDelete = async (habitacion: Habitacion) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la habitación ${habitacion.numero}?`)) {
      return;
    }

    try {
      await executeAction(`/api/admin/habitaciones/${habitacion.id}`, {
        method: 'DELETE'
      });

      // Recargar habitaciones
      await loadHabitaciones('/api/admin/habitaciones');
      
    } catch (error) {
      console.error('Error eliminando habitación:', error);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando habitaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="room-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-bed me-2"></i>
          Gestión de Habitaciones
        </h2>
        <Button variant="primary" onClick={() => handleOpenModal('create')}>
          <i className="fas fa-plus me-2"></i>
          Nueva Habitación
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Error al cargar habitaciones</Alert.Heading>
          {error}
        </Alert>
      )}

      {actionError && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Error en la operación</Alert.Heading>
          {actionError}
        </Alert>
      )}

      <Card>
        <Card.Body>
          {habitaciones.length > 0 ? (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Nombre</th>
                    <th>Capacidad</th>
                    <th>Precio/Persona/Noche</th>
                    <th>Estado</th>
                    <th>Creada</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {habitaciones.map((habitacion) => (
                    <tr key={habitacion.id}>
                      <td>
                        <strong>{habitacion.numero}</strong>
                      </td>
                      <td>
                        <div>
                          <strong>{habitacion.nombre}</strong>
                          {habitacion.descripcion && (
                            <>
                              <br />
                              <small className="text-muted">
                                {habitacion.descripcion.length > 50 
                                  ? `${habitacion.descripcion.substring(0, 50)}...`
                                  : habitacion.descripcion
                                }
                              </small>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <Badge bg="info">
                          {habitacion.capacidadMinima}-{habitacion.capacidadMaxima} personas
                        </Badge>
                      </td>
                      <td className="fw-bold">
                        {formatPrice(habitacion.precioPorPersonaNoche)}
                      </td>
                      <td>
                        <Badge bg={habitacion.activa ? 'success' : 'secondary'}>
                          {habitacion.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td>
                        {formatDate(habitacion.fechaCreacion)}
                      </td>
                      <td>
                        <div className="btn-group">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleOpenModal('view', habitacion)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleOpenModal('edit', habitacion)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant={habitacion.activa ? 'outline-warning' : 'outline-success'}
                            size="sm"
                            onClick={() => handleToggleActive(habitacion)}
                            disabled={actionLoading}
                            title={habitacion.activa ? 'Desactivar' : 'Activar'}
                          >
                            <i className={`fas ${habitacion.activa ? 'fa-pause' : 'fa-play'}`}></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(habitacion)}
                            disabled={actionLoading}
                            title="Eliminar"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-muted py-5">
              <i className="fas fa-bed fa-3x mb-3"></i>
              <h5>No hay habitaciones registradas</h5>
              <p>Comienza agregando tu primera habitación</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para crear/editar/ver habitación */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' && 'Nueva Habitación'}
            {modalMode === 'edit' && 'Editar Habitación'}
            {modalMode === 'view' && 'Detalles de Habitación'}
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Número de Habitación *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.numero}
                    onChange={(e) => handleInputChange('numero', e.target.value)}
                    isInvalid={!!errors.numero}
                    disabled={modalMode === 'view'}
                    placeholder="Ej: 101, A1, etc."
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.numero}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    isInvalid={!!errors.nombre}
                    disabled={modalMode === 'view'}
                    placeholder="Ej: Habitación Doble, Suite, etc."
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.nombre}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacidad Mínima *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formData.capacidadMinima}
                    onChange={(e) => handleInputChange('capacidadMinima', parseInt(e.target.value))}
                    isInvalid={!!errors.capacidadMinima}
                    disabled={modalMode === 'view'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.capacidadMinima}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacidad Máxima *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formData.capacidadMaxima}
                    onChange={(e) => handleInputChange('capacidadMaxima', parseInt(e.target.value))}
                    isInvalid={!!errors.capacidadMaxima}
                    disabled={modalMode === 'view'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.capacidadMaxima}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Precio por Persona por Noche (UYU) *</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="100"
                value={formData.precioPorPersonaNoche}
                onChange={(e) => handleInputChange('precioPorPersonaNoche', parseFloat(e.target.value))}
                isInvalid={!!errors.precioPorPersonaNoche}
                disabled={modalMode === 'view'}
                placeholder="Ej: 2500"
              />
              <Form.Control.Feedback type="invalid">
                {errors.precioPorPersonaNoche}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Precio en pesos uruguayos por persona por noche
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>URL de Imagen (opcional)</Form.Label>
              <Form.Control
                type="url"
                value={formData.urlImagen || ''}
                onChange={(e) => handleInputChange('urlImagen', e.target.value)}
                isInvalid={!!errors.urlImagen}
                disabled={modalMode === 'view'}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              <Form.Control.Feedback type="invalid">
                {errors.urlImagen}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descripción (opcional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.descripcion || ''}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                disabled={modalMode === 'view'}
                placeholder="Describe las características de la habitación..."
              />
            </Form.Group>

            {modalMode !== 'view' && (
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="activa"
                  label="Habitación activa (disponible para reservas)"
                  checked={formData.activa}
                  onChange={(e) => handleInputChange('activa', e.target.checked)}
                />
              </Form.Group>
            )}

            {modalMode === 'view' && selectedHabitacion && (
              <Row>
                <Col md={6}>
                  <p><strong>Estado:</strong> {selectedHabitacion.activa ? 'Activa' : 'Inactiva'}</p>
                  <p><strong>Creada:</strong> {formatDate(selectedHabitacion.fechaCreacion)}</p>
                </Col>
                <Col md={6}>
                  {selectedHabitacion.fechaActualizacion && (
                    <p><strong>Última actualización:</strong> {formatDate(selectedHabitacion.fechaActualizacion)}</p>
                  )}
                </Col>
              </Row>
            )}
          </Modal.Body>
          
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              {modalMode === 'view' ? 'Cerrar' : 'Cancelar'}
            </Button>
            
            {modalMode !== 'view' && (
              <Button 
                variant="primary" 
                type="submit"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    {modalMode === 'create' ? 'Creando...' : 'Guardando...'}
                  </>
                ) : (
                  <>
                    <i className={`fas ${modalMode === 'create' ? 'fa-plus' : 'fa-save'} me-2`}></i>
                    {modalMode === 'create' ? 'Crear Habitación' : 'Guardar Cambios'}
                  </>
                )}
              </Button>
            )}
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default RoomManagement;
