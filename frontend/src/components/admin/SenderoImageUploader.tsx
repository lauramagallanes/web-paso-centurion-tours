import React, { useState, useRef, useCallback } from 'react';
import { Button, Alert, ProgressBar, Card, Modal, Image } from 'react-bootstrap';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maximum 10 images per sendero
  const maxImages = 10;
  const canUploadMore = images.length < maxImages;

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

    // Upload files
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('files', file);
      });

      // Add descriptions if needed
      validFiles.forEach((_, index) => {
        formData.append('descriptions', ''); // Empty description for now
      });

      const response = await fetch(`/api/images/senderos/${senderoId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error uploading images');
      }

      const result = await response.json();
      
      // Update images list
      const newImages = result.images || [];
      onImagesChange([...images, ...newImages]);
      
      setUploadProgress(100);
      
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

  const handleDeleteImage = async (imageId: string) => {
    if (!senderoId) return;
    
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting image');
      }

      // Remove image from list
      const updatedImages = images.filter(img => img.id !== imageId);
      onImagesChange(updatedImages);

    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Error deleting image');
    }
  };

  const handleSetMainImage = async (imageId: string) => {
    if (!senderoId) return;
    
    try {
      const response = await fetch(`/api/images/${imageId}/principal`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error setting main image');
      }

      // Update images list - mark this as principal and others as not
      const updatedImages = images.map(img => ({
        ...img,
        esPrincipal: img.id === imageId
      }));
      onImagesChange(updatedImages);

    } catch (err) {
      console.error('Set main image error:', err);
      setError(err instanceof Error ? err.message : 'Error setting main image');
    }
  };

  return (
    <div className="sendero-image-uploader">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">
          Imágenes del Sendero ({images.length}/{maxImages})
        </h6>
        
        {canUploadMore && senderoId && (
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
          >
            {uploading ? 'Subiendo...' : 'Subir Imágenes'}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        disabled={disabled}
      />

      {error && (
        <Alert variant="danger" className="mb-3">
          <strong>Error:</strong> {error}
          <Button 
            variant="outline-danger" 
            size="sm" 
            className="float-end"
            onClick={() => setError(null)}
          >
            ×
          </Button>
        </Alert>
      )}

      {uploading && (
        <div className="mb-3">
          <ProgressBar 
            now={uploadProgress} 
            label={`${uploadProgress}%`}
            animated 
            striped 
            variant="success"
          />
        </div>
      )}

      {/* Images Grid */}
      <div className="images-grid">
        {images.length === 0 ? (
          <Card className="text-center p-4">
            <Card.Body>
              <p className="text-muted mb-0">
                {senderoId ? 'No hay imágenes cargadas' : 'Guarda el sendero primero para subir imágenes'}
              </p>
            </Card.Body>
          </Card>
        ) : (
          <div className="row">
            {images.map((image, index) => (
              <div key={image.id} className="col-6 col-md-4 col-lg-3 mb-3">
                <Card>
                  <div className="position-relative">
                    <Card.Img 
                      variant="top" 
                      src={image.url} 
                      style={{ height: '120px', objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => setShowPreview(true)}
                    />
                    
                    {image.esPrincipal && (
                      <div 
                        className="position-absolute top-0 start-0 m-1 badge bg-primary"
                        style={{ fontSize: '0.7rem' }}
                      >
                        Principal
                      </div>
                    )}
                    
                    <div className="position-absolute top-0 end-0 m-1">
                      <Button
                        variant="danger"
                        size="sm"
                        className="btn-sm rounded-circle p-1"
                        style={{ width: '24px', height: '24px' }}
                        onClick={() => handleDeleteImage(image.id)}
                        disabled={disabled}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                  
                  <Card.Body className="p-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">#{image.orden}</small>
                      
                      {!image.esPrincipal && (
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={() => handleSetMainImage(image.id)}
                          disabled={disabled}
                        >
                          Hacer Principal
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Vista Previa de Imágenes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            {images.map(image => (
              <div key={image.id} className="col-6 col-md-4 mb-3">
                <Image src={image.url} fluid />
              </div>
            ))}
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SenderoImageUploader;
