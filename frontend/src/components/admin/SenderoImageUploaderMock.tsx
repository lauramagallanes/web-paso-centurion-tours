import React, { useState, useRef, useCallback } from 'react';
import { Button, Alert, ProgressBar, Card, Modal, Image, Row, Col, Badge } from 'react-bootstrap';

interface SenderoImage {
  id: string;
  url: string;
  descripcion?: string;
  orden: number;
  esPrincipal: boolean;
}

interface SenderoImageUploaderProps {
  senderoId?: string;
  images: SenderoImage[];
  onImagesChange: (images: SenderoImage[]) => void;
  disabled?: boolean;
}

// Mock images for development
const MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1544966503-7cc6ac7e6b0e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1501436513145-30f24e19fcc4?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
];

const SenderoImageUploader: React.FC<SenderoImageUploaderProps> = ({
  senderoId,
  images = [],
  onImagesChange,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maximum 10 images per sendero
  const maxImages = 10;
  const canUploadMore = images.length < maxImages;

  // Mock file upload simulation
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !senderoId) return;

    // Validate file count
    if (images.length + files.length > maxImages) {
      setError(`Máximo ${maxImages} imágenes por sendero. Actualmente tienes ${images.length}.`);
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError(`Archivo ${file.name} no es una imagen válida.`);
        return;
      }
      
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError(`Archivo ${file.name} es demasiado grande. Máximo 5MB.`);
        return;
      }
      
      validFiles.push(file);
    }

    // Simulate upload process
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 20) {
        setUploadProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Create mock uploaded images
      const newImages: SenderoImage[] = validFiles.map((file, index) => ({
        id: `mock-${Date.now()}-${index}`,
        url: MOCK_IMAGES[Math.floor(Math.random() * MOCK_IMAGES.length)],
        descripcion: file.name,
        orden: images.length + index,
        esPrincipal: images.length === 0 && index === 0 // First image is main if no existing images
      }));
      
      // Update images list
      onImagesChange([...images, ...newImages]);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Error uploading images');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [senderoId, images, onImagesChange]);

  const handleDeleteImage = useCallback(async (imageId: string) => {
    if (!senderoId) return;
    
    try {
      // Simulate delete operation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove image from list and reorder
      const updatedImages = images
        .filter(img => img.id !== imageId)
        .map((img, index) => ({ ...img, orden: index }));
      
      // If deleted image was main, make first image main
      if (updatedImages.length > 0 && !updatedImages.some(img => img.esPrincipal)) {
        updatedImages[0].esPrincipal = true;
      }
      
      onImagesChange(updatedImages);

    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Error eliminando imagen');
    }
  }, [images, senderoId, onImagesChange]);

  const handleSetMainImage = useCallback(async (imageId: string) => {
    if (!senderoId) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update images - set new main and remove previous main
      const updatedImages = images.map(img => ({
        ...img,
        esPrincipal: img.id === imageId
      }));
      
      onImagesChange(updatedImages);

    } catch (err) {
      console.error('Set main error:', err);
      setError(err instanceof Error ? err.message : 'Error estableciendo imagen principal');
    }
  }, [images, senderoId, onImagesChange]);

  const handleImageClick = (imageUrl: string) => {
    setPreviewImage(imageUrl);
    setShowPreview(true);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="sendero-image-uploader">
      {error && (
        <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upload Section */}
      {!disabled && canUploadMore && (
        <Card className="mb-3">
          <Card.Body>
            <div className="text-center">
              <h6>Subir Imágenes</h6>
              <p className="text-muted small mb-3">
                Máximo {maxImages} imágenes. Archivos JPG, PNG hasta 5MB.
                <br />
                <Badge bg="info">MODO DESARROLLO</Badge> - Se usarán imágenes de prueba
              </p>
              
              <Button
                variant="outline-primary"
                onClick={triggerFileInput}
                disabled={uploading}
              >
                <i className="bi bi-cloud-upload me-2"></i>
                {uploading ? 'Subiendo...' : 'Seleccionar Imágenes'}
              </Button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
              />
              
              {uploading && (
                <div className="mt-3">
                  <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Images Grid */}
      {images.length > 0 ? (
        <Row className="g-3">
          {images
            .sort((a, b) => a.orden - b.orden)
            .map((image) => (
              <Col key={image.id} md={4} sm={6}>
                <Card className="h-100">
                  <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                    <Image
                      src={image.url}
                      alt={image.descripcion || 'Imagen del sendero'}
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleImageClick(image.url)}
                    />
                    
                    {image.esPrincipal && (
                      <Badge 
                        bg="success" 
                        style={{ 
                          position: 'absolute', 
                          top: '8px', 
                          left: '8px' 
                        }}
                      >
                        Principal
                      </Badge>
                    )}
                  </div>
                  
                  {!disabled && (
                    <Card.Footer className="p-2">
                      <div className="d-flex gap-1">
                        {!image.esPrincipal && (
                          <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => handleSetMainImage(image.id)}
                            title="Establecer como imagen principal"
                          >
                            <i className="bi bi-star"></i>
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDeleteImage(image.id)}
                          title="Eliminar imagen"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </Card.Footer>
                  )}
                </Card>
              </Col>
            ))}
        </Row>
      ) : (
        <div className="text-center py-5">
          <div className="text-muted">
            <i className="bi bi-images display-1"></i>
            <p className="mt-2">No hay imágenes cargadas</p>
            {!disabled && canUploadMore && (
              <p className="small">Sube imágenes para mostrar tu sendero</p>
            )}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Vista Previa</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-0">
          <Image
            src={previewImage}
            alt="Vista previa"
            style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SenderoImageUploader;
