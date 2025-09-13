import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useGuiasAdmin } from '../../hooks/useAdminApi';
import Icon from '../../components/common/Icon';
import BackendError from '../../components/common/BackendError';

interface Guia {
  id?: string;
  nombre: string;
  apellido: string;
  email?: string;
  biografia?: string;
  anosExperiencia?: number;
  especialidades?: string;
  urlFoto?: string;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

const GuideManagement: React.FC = () => {
  const navigate = useNavigate();
  const { 
    data: guias = [], 
    loading, 
    error, 
    loadGuias,
    createGuia,
    updateGuia,
    toggleActive,
    deleteGuia 
  } = useGuiasAdmin();
  
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedGuia, setSelectedGuia] = useState<Guia | null>(null);
  const [formData, setFormData] = useState<Guia>({
    nombre: '',
    apellido: '',
    email: '',
    biografia: '',
    anosExperiencia: 0,
    especialidades: '',
    urlFoto: '',
    activo: true
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    loadGuias();
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-UY');
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      biografia: '',
      anosExperiencia: 0,
      especialidades: '',
      urlFoto: '',
      activo: true
    });
    setErrors({});
    setSelectedGuia(null);
  };

  const handleOpenModal = (mode: 'create' | 'edit' | 'view', guia?: Guia) => {
    setModalMode(mode);
    
    if (guia) {
      setSelectedGuia(guia);
      setFormData({ ...guia });
    } else {
      resetForm();
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleInputChange = (field: keyof Guia, value: any) => {
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

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'Nombre es obligatorio';
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'Apellido es obligatorio';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email no válido';
    }

    if (formData.anosExperiencia && formData.anosExperiencia < 0) {
      newErrors.anosExperiencia = 'Años de experiencia no puede ser negativo';
    }

    if (formData.urlFoto && !isValidUrl(formData.urlFoto)) {
      newErrors.urlFoto = 'URL de foto no válida';
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
        await createGuia(formData);
      } else if (modalMode === 'edit' && formData.id) {
        await updateGuia(parseInt(formData.id), formData);
      }

      // Recargar guías
      await loadGuias();
      handleCloseModal();
      
    } catch (error) {
      console.error('Error guardando guía:', error);
      
      // Show user-friendly error message for backend unavailable
      const errorMessage = typeof error === 'string' ? error : (error as Error)?.message || '';
      const isBackendUnavailable = 
        errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('404') || 
        errorMessage.includes('Not Found') ||
        errorMessage.includes('CORS');
      
      if (isBackendUnavailable) {
        alert('⚠️ No se pudo guardar el guía.\n\nEl backend está en desarrollo. Esta funcionalidad estará disponible próximamente.\n\nTus datos se han preservado en el formulario.');
      } else {
        alert('❌ Error inesperado al guardar el guía. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (guia: Guia) => {
    if (!guia.id) return;
    
    setActionLoading(true);
    try {
      await toggleActive(parseInt(guia.id), !guia.activo);
      await loadGuias();
    } catch (error) {
      console.error('Error cambiando estado:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (guia: Guia) => {
    if (!guia.id || !window.confirm(`¿Estás seguro de que quieres eliminar al guía "${guia.nombre} ${guia.apellido}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await deleteGuia(parseInt(guia.id));
      await loadGuias();
    } catch (error) {
      console.error('Error eliminando guía:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando guías...</p>
        </div>
      </div>
    );
  }

  // If backend not available, continue with empty guias array
  // Allow modal to open but handle errors when saving

  return (
    <div className="guide-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Guías</h2>
        <Button 
          variant="info" 
          onClick={() => handleOpenModal('create')}
          disabled={actionLoading}
        >
          <Icon name="plus" size="sm" className="me-2" />
          Nuevo Guía
        </Button>
      </div>


      <Card>
        <Card.Body>
          {guias.length === 0 ? (
            <div className="text-center py-5">
              <Icon name="user" size="lg" className="text-muted mb-3" />
              <h5 className="text-muted">No hay guías registrados</h5>
              <p className="text-muted">Comienza agregando tu primer guía</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Experiencia</th>
                  <th>Especialidades</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {guias.map((guia) => (
                  <tr key={guia.id}>
                    <td>
                      <div>
                        <div className="fw-bold">{guia.nombre} {guia.apellido}</div>
                        {guia.biografia && (
                          <small className="text-muted">
                            {guia.biografia.length > 50 
                              ? `${guia.biografia.substring(0, 50)}...`
                              : guia.biografia
                            }
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      {guia.email && (
                        <a href={`mailto:${guia.email}`} className="text-decoration-none">
                          {guia.email}
                        </a>
                      )}
                    </td>
                    <td>
                      {guia.anosExperiencia ? `${guia.anosExperiencia} años` : 'N/A'}
                    </td>
                    <td>
                      {guia.especialidades ? (
                        <div className="d-flex flex-wrap gap-1">
                          {guia.especialidades.split(',').slice(0, 3).map((esp, index) => (
                            <Badge key={index} bg="secondary" className="small">
                              {esp.trim()}
                            </Badge>
                          ))}
                          {guia.especialidades.split(',').length > 3 && (
                            <Badge bg="outline-secondary" className="small">
                              +{guia.especialidades.split(',').length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">Sin especialidades</span>
                      )}
                    </td>
                    <td>
                      <Badge bg={guia.activo ? 'success' : 'danger'}>
                        {guia.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenModal('view', guia)}
                          title="Ver detalles"
                        >
                          <Icon name="eye" size="xs" />
                        </Button>
                        
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleOpenModal('edit', guia)}
                          title="Editar"
                        >
                          <Icon name="edit" size="xs" />
                        </Button>
                        
                        <Button
                          variant={guia.activo ? 'outline-warning' : 'outline-success'}
                          size="sm"
                          onClick={() => handleToggleActive(guia)}
                          title={guia.activo ? 'Desactivar' : 'Activar'}
                          disabled={actionLoading}
                        >
                          <Icon name={guia.activo ? 'pause' : 'play'} size="xs" />
                        </Button>
                        
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(guia)}
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

      {/* Modal para crear/editar/ver guía */}
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
                  Nuevo Guía
                </>
              )}
              {modalMode === 'edit' && (
                <>
                  <Icon name="edit" size="sm" className="me-2" />
                  Editar Guía
                </>
              )}
              {modalMode === 'view' && (
                <>
                  <Icon name="eye" size="sm" className="me-2" />
                  Ver Guía
                </>
              )}
            </Modal.Title>
          </Modal.Header>
          
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nombre del guía"
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
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellido *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Apellido del guía"
                    value={formData.apellido}
                    onChange={(e) => handleInputChange('apellido', e.target.value)}
                    isInvalid={!!errors.apellido}
                    disabled={modalMode === 'view'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.apellido}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="correo@ejemplo.com"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                isInvalid={!!errors.email}
                disabled={modalMode === 'view'}
              />
              <Form.Control.Feedback type="invalid">
                {errors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Biografía</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Breve biografía del guía..."
                value={formData.biografia || ''}
                onChange={(e) => handleInputChange('biografia', e.target.value)}
                disabled={modalMode === 'view'}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Años de Experiencia</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.anosExperiencia || ''}
                    onChange={(e) => handleInputChange('anosExperiencia', e.target.value ? parseInt(e.target.value) : undefined)}
                    isInvalid={!!errors.anosExperiencia}
                    disabled={modalMode === 'view'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.anosExperiencia}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>URL de Foto</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://ejemplo.com/foto.jpg"
                    value={formData.urlFoto || ''}
                    onChange={(e) => handleInputChange('urlFoto', e.target.value)}
                    isInvalid={!!errors.urlFoto}
                    disabled={modalMode === 'view'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.urlFoto}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Especialidades</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: Aves, Mamíferos, Botánica (separadas por comas)"
                value={formData.especialidades || ''}
                onChange={(e) => handleInputChange('especialidades', e.target.value)}
                disabled={modalMode === 'view'}
              />
              <Form.Text className="text-muted">
                Separa múltiples especialidades con comas
              </Form.Text>
            </Form.Group>

            {modalMode !== 'create' && (
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="activo-checkbox"
                  label="Guía activo"
                  checked={formData.activo}
                  onChange={(e) => handleInputChange('activo', e.target.checked)}
                  disabled={modalMode === 'view'}
                />
              </Form.Group>
            )}

            {modalMode === 'view' && selectedGuia && (
              <Row>
                <Col md={6}>
                  <p><strong>Estado:</strong> {selectedGuia.activo ? 'Activo' : 'Inactivo'}</p>
                  <p><strong>Registrado:</strong> {formatDate(selectedGuia.fechaCreacion)}</p>
                </Col>
                <Col md={6}>
                  {selectedGuia.fechaActualizacion && (
                    <p><strong>Última actualización:</strong> {formatDate(selectedGuia.fechaActualizacion)}</p>
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
                variant="info" 
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
                    {modalMode === 'create' ? 'Crear Guía' : 'Guardar Cambios'}
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

export default GuideManagement;