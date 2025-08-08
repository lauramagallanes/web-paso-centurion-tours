import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { useApi } from '../../hooks/useApi';

interface Sendero {
  id?: number;
  nombre: string;
  descripcion?: string;
  nivelDificultad: 'FACIL' | 'MODERADO' | 'DIFICIL' | 'EXPERTO';
  duracionHoras: number;
  capacidadMaximaGrupo: number;
  precioPorPersona: number;
  activo: boolean;
  urlImagen?: string;
  puntoEncuentro?: string;
  equipamientoNecesario?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

const TrailManagement: React.FC = () => {
  const { data: senderos = [], loading, error, execute: loadSenderos } = useApi<Sendero[]>();
  const { loading: actionLoading, error: actionError, execute: executeAction } = useApi();
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSendero, setSelectedSendero] = useState<Sendero | null>(null);
  const [formData, setFormData] = useState<Sendero>({
    nombre: '',
    descripcion: '',
    nivelDificultad: 'FACIL',
    duracionHoras: 2,
    capacidadMaximaGrupo: 8,
    precioPorPersona: 0,
    activo: true,
    urlImagen: '',
    puntoEncuentro: '',
    equipamientoNecesario: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadSenderos('/api/admin/senderos');
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

  const getDificultadBadge = (dificultad: string) => {
    switch (dificultad) {
      case 'FACIL':
        return <Badge bg="success">Fácil</Badge>;
      case 'MODERADO':
        return <Badge bg="warning">Moderado</Badge>;
      case 'DIFICIL':
        return <Badge bg="danger">Difícil</Badge>;
      case 'EXPERTO':
        return <Badge bg="dark">Experto</Badge>;
      default:
        return <Badge bg="secondary">{dificultad}</Badge>;
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      nivelDificultad: 'FACIL',
      duracionHoras: 2,
      capacidadMaximaGrupo: 8,
      precioPorPersona: 0,
      activo: true,
      urlImagen: '',
      puntoEncuentro: '',
      equipamientoNecesario: ''
    });
    setErrors({});
    setSelectedSendero(null);
  };

  const handleOpenModal = (mode: 'create' | 'edit' | 'view', sendero?: Sendero) => {
    setModalMode(mode);
    
    if (sendero) {
      setSelectedSendero(sendero);
      setFormData({ ...sendero });
    } else {
      resetForm();
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleInputChange = (field: keyof Sendero, value: any) => {
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
      newErrors.nombre = 'Nombre del sendero es obligatorio';
    }

    if (formData.duracionHoras <= 0) {
      newErrors.duracionHoras = 'Duración debe ser mayor a 0';
    }

    if (formData.capacidadMaximaGrupo <= 0) {
      newErrors.capacidadMaximaGrupo = 'Capacidad debe ser mayor a 0';
    }

    if (formData.precioPorPersona <= 0) {
      newErrors.precioPorPersona = 'Precio debe ser mayor a 0';
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
        ? '/api/admin/senderos'
        : `/api/admin/senderos/${formData.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      await executeAction(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      // Recargar senderos
      await loadSenderos('/api/admin/senderos');
      handleCloseModal();
      
    } catch (error) {
      console.error('Error guardando sendero:', error);
    }
  };

  const handleToggleActive = async (sendero: Sendero) => {
    try {
      await executeAction(`/api/admin/senderos/${sendero.id}/toggle-active`, {
        method: 'PUT'
      });

      // Recargar senderos
      await loadSenderos('/api/admin/senderos');
      
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const handleDelete = async (sendero: Sendero) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el sendero "${sendero.nombre}"?`)) {
      return;
    }

    try {
      await executeAction(`/api/admin/senderos/${sendero.id}`, {
        method: 'DELETE'
      });

      // Recargar senderos
      await loadSenderos('/api/admin/senderos');
      
    } catch (error) {
      console.error('Error eliminando sendero:', error);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando senderos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trail-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-hiking me-2"></i>
          Gestión de Senderos
        </h2>
        <Button variant="success" onClick={() => handleOpenModal('create')}>
          <i className="fas fa-plus me-2"></i>
          Nuevo Sendero
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Error al cargar senderos</Alert.Heading>
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
          {senderos.length > 0 ? (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Dificultad</th>
                    <th>Duración</th>
                    <th>Capacidad</th>
                    <th>Precio/Persona</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {senderos.map((sendero) => (
                    <tr key={sendero.id}>
                      <td>
                        <div>
                          <strong>{sendero.nombre}</strong>
                          {sendero.descripcion && (
                            <>
                              <br />
                              <small className="text-muted">
                                {sendero.descripcion.length > 50 
                                  ? `${sendero.descripcion.substring(0, 50)}...`
                                  : sendero.descripcion
                                }
                              </small>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        {getDificultadBadge(sendero.nivelDificultad)}
                      </td>
                      <td>
                        <Badge bg="info">
                          {sendero.duracionHoras}h
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="secondary">
                          Máx. {sendero.capacidadMaximaGrupo}
                        </Badge>
                      </td>
                      <td className="fw-bold">
                        {formatPrice(sendero.precioPorPersona)}
                      </td>
                      <td>
                        <Badge bg={sendero.activo ? 'success' : 'secondary'}>
                          {sendero.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td>
                        {formatDate(sendero.fechaCreacion)}
                      </td>
                      <td>
                        <div className="btn-group">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleOpenModal('view', sendero)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleOpenModal('edit', sendero)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant={sendero.activo ? 'outline-warning' : 'outline-success'}
                            size="sm"
                            onClick={() => handleToggleActive(sendero)}
                            disabled={actionLoading}
                            title={sendero.activo ? 'Desactivar' : 'Activar'}
                          >
                            <i className={`fas ${sendero.activo ? 'fa-pause' : 'fa-play'}`}></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(sendero)}
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
              <i className="fas fa-hiking fa-3x mb-3"></i>
              <h5>No hay senderos registrados</h5>
              <p>Comienza agregando tu primer sendero</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para crear/editar/ver sendero */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' && 'Nuevo Sendero'}
            {modalMode === 'edit' && 'Editar Sendero'}
            {modalMode === 'view' && 'Detalles de Sendero'}
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Sendero *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    isInvalid={!!errors.nombre}
                    disabled={modalMode === 'view'}
                    placeholder="Ej: Sendero de las Aves"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.nombre}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Nivel de Dificultad *</Form.Label>
                  <Form.Select
                    value={formData.nivelDificultad}
                    onChange={(e) => handleInputChange('nivelDificultad', e.target.value)}
                    disabled={modalMode === 'view'}
                  >
                    <option value="FACIL">Fácil</option>
                    <option value="MODERADO">Moderado</option>
                    <option value="DIFICIL">Difícil</option>
                    <option value="EXPERTO">Experto</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Duración (horas) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.duracionHoras}
                    onChange={(e) => handleInputChange('duracionHoras', parseFloat(e.target.value))}
                    isInvalid={!!errors.duracionHoras}
                    disabled={modalMode === 'view'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.duracionHoras}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacidad Máxima *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formData.capacidadMaximaGrupo}
                    onChange={(e) => handleInputChange('capacidadMaximaGrupo', parseInt(e.target.value))}
                    isInvalid={!!errors.capacidadMaximaGrupo}
                    disabled={modalMode === 'view'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.capacidadMaximaGrupo}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio por Persona (UYU) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="100"
                    value={formData.precioPorPersona}
                    onChange={(e) => handleInputChange('precioPorPersona', parseFloat(e.target.value))}
                    isInvalid={!!errors.precioPorPersona}
                    disabled={modalMode === 'view'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.precioPorPersona}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.descripcion || ''}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                disabled={modalMode === 'view'}
                placeholder="Describe el sendero, qué se puede ver, características especiales..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Punto de Encuentro</Form.Label>
              <Form.Control
                type="text"
                value={formData.puntoEncuentro || ''}
                onChange={(e) => handleInputChange('puntoEncuentro', e.target.value)}
                disabled={modalMode === 'view'}
                placeholder="Ej: Recepción del lodge, Entrada del sendero, etc."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Equipamiento Necesario</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.equipamientoNecesario || ''}
                onChange={(e) => handleInputChange('equipamientoNecesario', e.target.value)}
                disabled={modalMode === 'view'}
                placeholder="Ej: Calzado cómodo, repelente, binoculares, etc."
              />
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

            {modalMode !== 'view' && (
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="activo"
                  label="Sendero activo (disponible para reservas)"
                  checked={formData.activo}
                  onChange={(e) => handleInputChange('activo', e.target.checked)}
                />
              </Form.Group>
            )}

            {modalMode === 'view' && selectedSendero && (
              <Row>
                <Col md={6}>
                  <p><strong>Estado:</strong> {selectedSendero.activo ? 'Activo' : 'Inactivo'}</p>
                  <p><strong>Creado:</strong> {formatDate(selectedSendero.fechaCreacion)}</p>
                </Col>
                <Col md={6}>
                  {selectedSendero.fechaActualizacion && (
                    <p><strong>Última actualización:</strong> {formatDate(selectedSendero.fechaActualizacion)}</p>
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
                    <i className={`fas ${modalMode === 'create' ? 'fa-plus' : 'fa-save'} me-2`}></i>
                    {modalMode === 'create' ? 'Crear Sendero' : 'Guardar Cambios'}
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

export default TrailManagement;
