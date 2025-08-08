import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { useApi } from '../../hooks/useApi';

interface Guia {
  id?: number;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  anosExperiencia?: number;
  especialidades?: string;
  biografia?: string;
  activo: boolean;
  urlFoto?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

const GuideManagement: React.FC = () => {
  const { data: guias = [], loading, error, execute: loadGuias } = useApi<Guia[]>();
  const { loading: actionLoading, error: actionError, execute: executeAction } = useApi();
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedGuia, setSelectedGuia] = useState<Guia | null>(null);
  const [formData, setFormData] = useState<Guia>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    anosExperiencia: 0,
    especialidades: '',
    biografia: '',
    activo: true,
    urlFoto: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadGuias('/api/admin/guias');
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-UY');
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      anosExperiencia: 0,
      especialidades: '',
      biografia: '',
      activo: true,
      urlFoto: ''
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
        ? '/api/admin/guias'
        : `/api/admin/guias/${formData.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      await executeAction(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      // Recargar guías
      await loadGuias('/api/admin/guias');
      handleCloseModal();
      
    } catch (error) {
      console.error('Error guardando guía:', error);
    }
  };

  const handleToggleActive = async (guia: Guia) => {
    try {
      await executeAction(`/api/admin/guias/${guia.id}/toggle-active`, {
        method: 'PUT'
      });

      // Recargar guías
      await loadGuias('/api/admin/guias');
      
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const handleDelete = async (guia: Guia) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar al guía "${guia.nombre} ${guia.apellido}"?`)) {
      return;
    }

    try {
      await executeAction(`/api/admin/guias/${guia.id}`, {
        method: 'DELETE'
      });

      // Recargar guías
      await loadGuias('/api/admin/guias');
      
    } catch (error) {
      console.error('Error eliminando guía:', error);
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

  return (
    <div className="guide-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-user-tie me-2"></i>
          Gestión de Guías
        </h2>
        <Button variant="info" onClick={() => handleOpenModal('create')}>
          <i className="fas fa-plus me-2"></i>
          Nuevo Guía
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Error al cargar guías</Alert.Heading>
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
          {guias.length > 0 ? (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nombre</th>
                    <th>Contacto</th>
                    <th>Experiencia</th>
                    <th>Especialidades</th>
                    <th>Estado</th>
                    <th>Registrado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {guias.map((guia) => (
                    <tr key={guia.id}>
                      <td>
                        <div className="guide-photo">
                          {guia.urlFoto ? (
                            <img 
                              src={guia.urlFoto} 
                              alt={`${guia.nombre} ${guia.apellido}`}
                              className="rounded-circle"
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div 
                              className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                              style={{ width: '50px', height: '50px' }}
                            >
                              <i className="fas fa-user"></i>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{guia.nombre} {guia.apellido}</strong>
                          {guia.biografia && (
                            <>
                              <br />
                              <small className="text-muted">
                                {guia.biografia.length > 50 
                                  ? `${guia.biografia.substring(0, 50)}...`
                                  : guia.biografia
                                }
                              </small>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          {guia.email && (
                            <>
                              <small className="text-muted">
                                <i className="fas fa-envelope me-1"></i>
                                {guia.email}
                              </small>
                              <br />
                            </>
                          )}
                          {guia.telefono && (
                            <small className="text-muted">
                              <i className="fas fa-phone me-1"></i>
                              {guia.telefono}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        {guia.anosExperiencia ? (
                          <Badge bg="primary">
                            {guia.anosExperiencia} años
                          </Badge>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>
                        {guia.especialidades ? (
                          <small className="text-success">
                            <i className="fas fa-leaf me-1"></i>
                            {guia.especialidades.length > 30 
                              ? `${guia.especialidades.substring(0, 30)}...`
                              : guia.especialidades
                            }
                          </small>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>
                        <Badge bg={guia.activo ? 'success' : 'secondary'}>
                          {guia.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td>
                        {formatDate(guia.fechaCreacion)}
                      </td>
                      <td>
                        <div className="btn-group">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleOpenModal('view', guia)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleOpenModal('edit', guia)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant={guia.activo ? 'outline-warning' : 'outline-success'}
                            size="sm"
                            onClick={() => handleToggleActive(guia)}
                            disabled={actionLoading}
                            title={guia.activo ? 'Desactivar' : 'Activar'}
                          >
                            <i className={`fas ${guia.activo ? 'fa-pause' : 'fa-play'}`}></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(guia)}
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
              <i className="fas fa-user-tie fa-3x mb-3"></i>
              <h5>No hay guías registrados</h5>
              <p>Comienza agregando tu primer guía</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para crear/editar/ver guía */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' && 'Nuevo Guía'}
            {modalMode === 'edit' && 'Editar Guía'}
            {modalMode === 'view' && 'Detalles de Guía'}
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    isInvalid={!!errors.nombre}
                    disabled={modalMode === 'view'}
                    placeholder="Nombre del guía"
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
                    value={formData.apellido}
                    onChange={(e) => handleInputChange('apellido', e.target.value)}
                    isInvalid={!!errors.apellido}
                    disabled={modalMode === 'view'}
                    placeholder="Apellido del guía"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.apellido}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email (opcional)</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    isInvalid={!!errors.email}
                    disabled={modalMode === 'view'}
                    placeholder="email@ejemplo.com"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono (opcional)</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.telefono || ''}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    disabled={modalMode === 'view'}
                    placeholder="+598 99 123 456"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Años de Experiencia</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.anosExperiencia || ''}
                    onChange={(e) => handleInputChange('anosExperiencia', parseInt(e.target.value) || 0)}
                    isInvalid={!!errors.anosExperiencia}
                    disabled={modalMode === 'view'}
                    placeholder="0"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.anosExperiencia}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>URL de Foto (opcional)</Form.Label>
                  <Form.Control
                    type="url"
                    value={formData.urlFoto || ''}
                    onChange={(e) => handleInputChange('urlFoto', e.target.value)}
                    isInvalid={!!errors.urlFoto}
                    disabled={modalMode === 'view'}
                    placeholder="https://ejemplo.com/foto.jpg"
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
                value={formData.especialidades || ''}
                onChange={(e) => handleInputChange('especialidades', e.target.value)}
                disabled={modalMode === 'view'}
                placeholder="Ej: Aves, Mamíferos, Botánica, Fotografía de naturaleza"
              />
              <Form.Text className="text-muted">
                Separar especialidades con comas
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Biografía</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.biografia || ''}
                onChange={(e) => handleInputChange('biografia', e.target.value)}
                disabled={modalMode === 'view'}
                placeholder="Describe la experiencia, formación y pasión del guía por la naturaleza..."
              />
            </Form.Group>

            {modalMode !== 'view' && (
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="activo"
                  label="Guía activo (disponible para excursiones)"
                  checked={formData.activo}
                  onChange={(e) => handleInputChange('activo', e.target.checked)}
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
                    <i className={`fas ${modalMode === 'create' ? 'fa-plus' : 'fa-save'} me-2`}></i>
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
