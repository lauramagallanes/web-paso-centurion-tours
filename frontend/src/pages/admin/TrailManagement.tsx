import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Spinner, Row, Col, Badge, Tab, Tabs } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSenderosAdmin } from '../../hooks/useAdminApi';
import Icon from '../../components/common/Icon';
import BackendError from '../../components/common/BackendError';
import SenderoImageUploader from '../../components/admin/SenderoImageUploader';

interface Sendero {
  id?: string;
  nombre: string;
  descripcion?: string;
  duracionHoras: number;
  nivelDificultad: 'FACIL' | 'MODERADO' | 'DIFICIL' | 'EXPERTO';
  capacidadMaximaGrupo: number;
  precioPorPersona: number;
  urlImagen?: string;
  activo: boolean;
  
  // New image fields
  imagenPrincipal?: string;
  tieneGaleria?: boolean;
  totalImagenes?: number;
  imagenes?: SenderoImage[];

  fechaCreacion?: string;
  fechaActualizacion?: string;
}

interface SenderoImage {
  id: string;
  url: string;
  descripcion?: string;
  orden: number;
  esPrincipal: boolean;
}

const TrailManagement: React.FC = () => {
  const navigate = useNavigate();
  const { 
    data: senderos = [], 
    loading, 
    error, 
    loadSenderos,
    createSendero,
    updateSendero,
    toggleActive,
    deleteSendero
  } = useSenderosAdmin();
  
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSendero, setSelectedSendero] = useState<Sendero | null>(null);
  const [formData, setFormData] = useState<Sendero>({
    nombre: '',
    descripcion: '',
    duracionHoras: 2,
    nivelDificultad: 'FACIL',
    capacidadMaximaGrupo: 8,
    precioPorPersona: 1100,
    urlImagen: '',
    activo: true,
    imagenes: []
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [senderoImages, setSenderoImages] = useState<SenderoImage[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    loadSenderos();
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

  const getDificultadBadge = (dificultad: string) => {
    switch (dificultad) {
      case 'FACIL':
        return <Badge bg="success">Fácil</Badge>;
      case 'MODERADO':
        return <Badge bg="info">Moderado</Badge>;
      case 'DIFICIL':
        return <Badge bg="warning">Difícil</Badge>;
      case 'EXPERTO':
        return <Badge bg="danger">Experto</Badge>;
      default:
        return <Badge bg="secondary">{dificultad}</Badge>;
    }
  };

  const getDificultadText = (dificultad: string) => {
    switch (dificultad) {
      case 'FACIL':
        return 'Fácil - Apto para todas las edades y condiciones físicas';
      case 'MODERADO':
        return 'Moderado - Requiere condición física básica';
      case 'DIFICIL':
        return 'Difícil - Requiere buena condición física y experiencia';
      case 'EXPERTO':
        return 'Experto - Solo para personas con excelente condición física';
      default:
        return dificultad;
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      duracionHoras: 2,
      nivelDificultad: 'FACIL',
      capacidadMaximaGrupo: 8,
      precioPorPersona: 1100,
      urlImagen: '',
      activo: true,
      imagenes: []
    });
    setErrors({});
    setSelectedSendero(null);
    setSenderoImages([]);
    setActiveTab('basic');
  };

  const loadSenderoImages = async (senderoId: string) => {
    try {
      const response = await fetch(`/api/images/senderos/${senderoId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const images = await response.json();
        setSenderoImages(images || []);
      } else {
        console.error('Error loading images');
        setSenderoImages([]);
      }
    } catch (error) {
      console.error('Error loading sendero images:', error);
      setSenderoImages([]);
    }
  };

  const handleImagesChange = (newImages: SenderoImage[]) => {
    setSenderoImages(newImages);
  };

  const handleOpenModal = (mode: 'create' | 'edit' | 'view', sendero?: Sendero) => {
    setModalMode(mode);
    
    if (sendero) {
      setSelectedSendero(sendero);
      setFormData({ ...sendero });
      // Load images for existing sendero
      if (sendero.id && (mode === 'edit' || mode === 'view')) {
        loadSenderoImages(sendero.id);
      }
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

    if (formData.duracionHoras <= 0.5) {
      newErrors.duracionHoras = 'Duración debe ser al menos 0.5 horas';
    }

    if (formData.capacidadMaximaGrupo <= 0) {
      newErrors.capacidadMaximaGrupo = 'Capacidad debe ser mayor a 0';
    }

    if (formData.precioPorPersona <= 0) {
      newErrors.precioPorPersona = 'Precio debe ser mayor a 0';
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
        await createSendero(formData);
      } else if (modalMode === 'edit' && formData.id) {
        await updateSendero(formData.id, formData);
      }

      // Recargar senderos
      await loadSenderos();
      handleCloseModal();
      
    } catch (error) {
      console.error('Error guardando sendero:', error);
      alert('❌ Error al guardar el sendero. Por favor, inténtalo de nuevo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (sendero: Sendero) => {
    if (!sendero.id) return;
    
    setActionLoading(true);
    try {
      await toggleActive(sendero.id, !sendero.activo);
      await loadSenderos();
    } catch (error) {
      console.error('Error cambiando estado:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (sendero: Sendero) => {
    if (!sendero.id || !window.confirm(`¿Estás seguro de que quieres eliminar el sendero "${sendero.nombre}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await deleteSendero(sendero.id);
      await loadSenderos();
    } catch (error) {
      console.error('Error eliminando sendero:', error);
    } finally {
      setActionLoading(false);
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

  // If backend not available, continue with empty senderos array
  // Allow modal to open but handle errors when saving

  return (
    <div className="trail-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Gestión de Senderos</h2>
        </div>
        <Button 
          variant="success" 
          onClick={() => handleOpenModal('create')}
          disabled={actionLoading}
        >
          <Icon name="plus" size="sm" className="me-2" />
          Nuevo Sendero
        </Button>
      </div>


      <Card>
        <Card.Body>
          {senderos.length === 0 ? (
            <div className="text-center py-5">
              <Icon name="hiking" size="lg" className="text-muted mb-3" />
              <h5 className="text-muted">No hay senderos registrados</h5>
              <p className="text-muted">Comienza agregando tu primer sendero</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Duración</th>
                  <th>Dificultad</th>
                  <th>Capacidad</th>
                  <th>Precio por Persona</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {senderos.map((sendero) => (
                  <tr key={sendero.id}>
                    <td>
                      <div>
                        <div className="fw-bold">{sendero.nombre}</div>
                        {sendero.descripcion && (
                          <small className="text-muted">
                            {sendero.descripcion.length > 50 
                              ? `${sendero.descripcion.substring(0, 50)}...`
                              : sendero.descripcion
                            }
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong>{sendero.duracionHoras}h</strong>
                    </td>
                    <td>
                      {getDificultadBadge(sendero.nivelDificultad)}
                    </td>
                    <td>
                      {sendero.capacidadMaximaGrupo} personas
                    </td>
                    <td className="fw-bold">
                      {formatPrice(sendero.precioPorPersona)}
                    </td>
                    <td>
                      <Badge bg={sendero.activo ? 'success' : 'danger'}>
                        {sendero.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenModal('view', sendero)}
                          title="Ver detalles"
                        >
                          <Icon name="eye" size="xs" />
                        </Button>
                        
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleOpenModal('edit', sendero)}
                          title="Editar"
                        >
                          <Icon name="edit" size="xs" />
                        </Button>
                        
                        <Button
                          variant={sendero.activo ? 'outline-warning' : 'outline-success'}
                          size="sm"
                          onClick={() => handleToggleActive(sendero)}
                          title={sendero.activo ? 'Desactivar' : 'Activar'}
                          disabled={actionLoading}
                        >
                          <Icon name={sendero.activo ? 'pause' : 'play'} size="xs" />
                        </Button>
                        
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(sendero)}
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

      {/* Modal para crear/editar/ver sendero */}
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
                  Nuevo Sendero
                </>
              )}
              {modalMode === 'edit' && (
                <>
                  <Icon name="edit" size="sm" className="me-2" />
                  Editar Sendero
                </>
              )}
              {modalMode === 'view' && (
                <>
                  <Icon name="eye" size="sm" className="me-2" />
                  Ver Sendero
                </>
              )}
            </Modal.Title>
          </Modal.Header>
          
          <Modal.Body>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Sendero *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nombre descriptivo del sendero"
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
                placeholder="Descripción detallada del sendero"
                value={formData.descripcion || ''}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                disabled={modalMode === 'view'}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Duración (horas) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.duracionHoras}
                    onChange={(e) => handleInputChange('duracionHoras', e.target.value ? parseFloat(e.target.value) : 0.5)}
                    isInvalid={!!errors.duracionHoras}
                    disabled={modalMode === 'view'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.duracionHoras}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
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
                  {modalMode === 'view' && (
                    <Form.Text className="text-muted">
                      {getDificultadText(formData.nivelDificultad)}
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacidad Máxima del Grupo *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formData.capacidadMaximaGrupo}
                    onChange={(e) => handleInputChange('capacidadMaximaGrupo', e.target.value ? parseInt(e.target.value) : 1)}
                    isInvalid={!!errors.capacidadMaximaGrupo}
                    disabled={modalMode === 'view'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.capacidadMaximaGrupo}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio por Persona (UYU) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="100"
                    value={formData.precioPorPersona}
                    onChange={(e) => handleInputChange('precioPorPersona', e.target.value ? parseFloat(e.target.value) : 0)}
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
              <Form.Label>URL de Imagen</Form.Label>
              <Form.Control
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={formData.urlImagen || ''}
                onChange={(e) => handleInputChange('urlImagen', e.target.value)}
                disabled={modalMode === 'view'}
              />
            </Form.Group>

            {modalMode !== 'create' && (
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="activo-checkbox"
                  label="Sendero activo"
                  checked={formData.activo}
                  onChange={(e) => handleInputChange('activo', e.target.checked)}
                  disabled={modalMode === 'view'}
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
                    <Icon name={modalMode === 'create' ? 'plus' : 'save'} size="sm" className="me-2" />
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