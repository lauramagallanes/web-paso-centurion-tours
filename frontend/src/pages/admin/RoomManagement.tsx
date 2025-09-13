import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useHabitacionesAdmin } from '../../hooks/useAdminApi';
import Icon from '../../components/common/Icon';
import BackendError from '../../components/common/BackendError';

interface Habitacion {
  id?: string;
  numero: string;
  nombre: string;
  descripcion?: string;
  capacidadMinima?: number;
  capacidadMaxima: number;
  precioPorPersonaNoche: number;
  urlImagen?: string;
  activa: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

const RoomManagement: React.FC = () => {
  const navigate = useNavigate();
  const { 
    data: habitaciones = [], 
    loading, 
    error, 
    loadHabitaciones,
    createHabitacion,
    updateHabitacion,
    toggleActive,
    deleteHabitacion 
  } = useHabitacionesAdmin();
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedHabitacion, setSelectedHabitacion] = useState<Habitacion | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState<Habitacion>({
    numero: '',
    nombre: '',
    descripcion: '',
    capacidadMinima: 1,
    capacidadMaxima: 2,
    precioPorPersonaNoche: 1500,
    urlImagen: '',
    activa: true
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    loadHabitaciones();
  }, [navigate]);

  // Redirigir a login si hay error de autenticación
  useEffect(() => {
    if (error && error.includes('401')) {
      console.log('Error de autenticación detectado, redirigiendo al login...');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [error, navigate]);

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
      precioPorPersonaNoche: 1500,
      urlImagen: '',
      activa: true
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

    if (formData.capacidadMaxima < 1) {
      newErrors.capacidadMaxima = 'Capacidad máxima debe ser al menos 1';
    }

    if (formData.capacidadMinima && formData.capacidadMinima < 1) {
      newErrors.capacidadMinima = 'Capacidad mínima debe ser al menos 1';
    }

    if (formData.capacidadMinima && formData.capacidadMaxima < formData.capacidadMinima) {
      newErrors.capacidadMaxima = 'Capacidad máxima debe ser mayor o igual a la mínima';
    }

    if (formData.precioPorPersonaNoche <= 0) {
      newErrors.precioPorPersonaNoche = 'Precio debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setActionLoading(true);
    try {
      if (modalMode === 'create') {
        await createHabitacion(formData);
      } else if (modalMode === 'edit' && formData.id) {
        await updateHabitacion(parseInt(formData.id), formData);
      }

      // Recargar habitaciones
      await loadHabitaciones();
      handleCloseModal();
      
    } catch (error) {
      console.error('Error guardando habitación:', error);
      
      // Show user-friendly error message for backend unavailable
      const errorMessage = typeof error === 'string' ? error : (error as Error)?.message || '';
      const isBackendUnavailable = 
        errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('404') || 
        errorMessage.includes('Not Found') ||
        errorMessage.includes('CORS');
      
      if (isBackendUnavailable) {
        alert('⚠️ No se pudo guardar la habitación.\n\nEl backend está en desarrollo. Esta funcionalidad estará disponible próximamente.\n\nTus datos se han preservado en el formulario.');
      } else {
        alert('❌ Error inesperado al guardar la habitación. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (habitacion: Habitacion) => {
    if (!habitacion.id) return;
    
    setActionLoading(true);
    try {
      await toggleActive(parseInt(habitacion.id));
      await loadHabitaciones();
    } catch (error) {
      console.error('Error cambiando estado:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (habitacion: Habitacion) => {
    if (!habitacion.id || !window.confirm(`¿Estás seguro de que quieres eliminar la habitación "${habitacion.nombre}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await deleteHabitacion(parseInt(habitacion.id));
      await loadHabitaciones();
    } catch (error) {
      console.error('Error eliminando habitación:', error);
    } finally {
      setActionLoading(false);
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

  // If backend not available, continue with empty habitaciones array
  // Allow modal to open but handle errors when saving

  return (
    <div className="room-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Habitaciones</h2>
        <Button 
          variant="success" 
          onClick={() => handleOpenModal('create')}
          disabled={actionLoading}
        >
          <Icon name="plus" size="sm" className="me-2" />
          Nueva Habitación
        </Button>
      </div>


      <Card>
        <Card.Body>
          {habitaciones.length === 0 ? (
            <div className="text-center py-5">
              <Icon name="bed" size="lg" className="text-muted mb-3" />
              <h5 className="text-muted">No hay habitaciones registradas</h5>
              <p className="text-muted">Crea la primera habitación para empezar</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Número</th>
                  <th>Nombre</th>
                  <th>Capacidad</th>
                  <th>Precio por Persona/Noche</th>
                  <th>Estado</th>
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
                        <div className="fw-bold">{habitacion.nombre}</div>
                        {habitacion.descripcion && (
                          <small className="text-muted">
                            {habitacion.descripcion.length > 50 
                              ? `${habitacion.descripcion.substring(0, 50)}...`
                              : habitacion.descripcion
                            }
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      {habitacion.capacidadMinima && habitacion.capacidadMinima !== habitacion.capacidadMaxima
                        ? `${habitacion.capacidadMinima}-${habitacion.capacidadMaxima}`
                        : habitacion.capacidadMaxima
                      } personas
                    </td>
                    <td className="fw-bold">
                      {formatPrice(habitacion.precioPorPersonaNoche)}
                    </td>
                    <td>
                      <Badge bg={habitacion.activa ? 'success' : 'danger'}>
                        {habitacion.activa ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenModal('view', habitacion)}
                          title="Ver detalles"
                        >
                          <Icon name="eye" size="xs" />
                        </Button>
                        
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleOpenModal('edit', habitacion)}
                          title="Editar"
                        >
                          <Icon name="edit" size="xs" />
                        </Button>
                        
                        <Button
                          variant={habitacion.activa ? 'outline-warning' : 'outline-success'}
                          size="sm"
                          onClick={() => handleToggleActive(habitacion)}
                          title={habitacion.activa ? 'Desactivar' : 'Activar'}
                          disabled={actionLoading}
                        >
                          <Icon name={habitacion.activa ? 'pause' : 'play'} size="xs" />
                        </Button>
                        
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(habitacion)}
                          title="Eliminar"
                          disabled={actionLoading}
                        >
                          <Icon name="trash" size="xs" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal para crear/editar/ver habitación */}
      <Modal 
        show={showModal} 
        onHide={handleCloseModal} 
        size="lg"
        backdrop="static"
      >
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              {modalMode === 'create' && (
                <>
                  <Icon name="plus" size="sm" className="me-2" />
                  Nueva Habitación
                </>
              )}
              {modalMode === 'edit' && (
                <>
                  <Icon name="edit" size="sm" className="me-2" />
                  Editar Habitación
                </>
              )}
              {modalMode === 'view' && (
                <>
                  <Icon name="eye" size="sm" className="me-2" />
                  Ver Habitación
                </>
              )}
            </Modal.Title>
          </Modal.Header>
          
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Número de Habitación *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: 101, A1, Suite1"
                    value={formData.numero}
                    onChange={(e) => handleInputChange('numero', e.target.value)}
                    isInvalid={!!errors.numero}
                    disabled={modalMode === 'view'}
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
                    placeholder="Nombre descriptivo de la habitación"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    isInvalid={!!errors.nombre}
                    disabled={modalMode === 'view'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.nombre}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Descripción detallada de la habitación"
                value={formData.descripcion || ''}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                disabled={modalMode === 'view'}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacidad Mínima</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formData.capacidadMinima || ''}
                    onChange={(e) => handleInputChange('capacidadMinima', e.target.value ? parseInt(e.target.value) : undefined)}
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
                    onChange={(e) => handleInputChange('capacidadMaxima', e.target.value ? parseInt(e.target.value) : 1)}
                    isInvalid={!!errors.capacidadMaxima}
                    disabled={modalMode === 'view'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.capacidadMaxima}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio por Persona/Noche (UYU) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="100"
                    value={formData.precioPorPersonaNoche}
                    onChange={(e) => handleInputChange('precioPorPersonaNoche', e.target.value ? parseFloat(e.target.value) : 0)}
                    isInvalid={!!errors.precioPorPersonaNoche}
                    disabled={modalMode === 'view'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.precioPorPersonaNoche}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>URL de Imagen</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={formData.urlImagen || ''}
                    onChange={(e) => handleInputChange('urlImagen', e.target.value)}
                    disabled={modalMode === 'view'}
                  />
                </Form.Group>
              </Col>
            </Row>

            {modalMode !== 'create' && (
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="activa-checkbox"
                  label="Habitación activa"
                  checked={formData.activa}
                  onChange={(e) => handleInputChange('activa', e.target.checked)}
                  disabled={modalMode === 'view'}
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
                variant="success" 
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
                    <Icon name={modalMode === 'create' ? 'plus' : 'save'} size="sm" className="me-2" />
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