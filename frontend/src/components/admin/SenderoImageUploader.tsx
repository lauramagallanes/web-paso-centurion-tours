import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Alert, ProgressBar, Card, Modal, Image } from 'react-bootstrap';
import { s3Service } from '../../services/s3Service';
import { imageStorageService } from '../../services/imageStorageService';
import apiService from '../../services/apiService';

interface SenderoImage {
  id: string;
  url: string;
  filename?: string; // Agregado para S3
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maximum 10 images per sendero
  const maxImages = 10;
  const canUploadMore = images.length < maxImages;

  // Load images from API when senderoId changes
  useEffect(() => {
    const loadImages = async () => {
      if (senderoId) {
        console.log('📂 Loading images from API for sendero:', senderoId);
        try {
          const response = await apiService.getSenderoImages(senderoId);
          console.log('📂 API Response:', response);
          
          // Convert API response to SenderoImage format
          const apiImages = Array.isArray(response) ? response : [];
          const convertedImages: SenderoImage[] = apiImages.map(img => ({
            id: img.id,
            url: img.urlImagen || img.url,
            filename: img.descripcion || 'imagen',
            descripcion: img.descripcion,
            orden: img.orden || 0,
            esPrincipal: img.esPrincipal || false,
          }));
          
          console.log('📂 Loaded', convertedImages.length, 'images from API');
          onImagesChange(convertedImages);
        } catch (error) {
          console.error('Error loading images:', error);
          // Fallback to empty array if API fails
          onImagesChange([]);
        }
      } else {
        onImagesChange([]);
      }
    };

    loadImages();
  }, [senderoId]); // ✅ REMOVED onImagesChange from dependencies to prevent infinite loop

  // Auto-hide messages after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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

    // Upload files using API Service
    try {
      setUploading(true);
      setError(null);
      setSuccessMessage(null);
      setUploadProgress(10);

      console.log('🚀 Starting upload of', validFiles.length, 'files via API...');
      
      // Prepare descriptions array
      const descriptions = validFiles.map(() => ''); // Empty descriptions for now

      setUploadProgress(30);
      const uploadResults = await apiService.uploadSenderoImages(senderoId, validFiles, descriptions);
      
      setUploadProgress(80);
      console.log('✅ API upload completed:', uploadResults);
      
      // Handle API response - it might be the images array or wrapped in a data property
      const apiImages = uploadResults?.images || uploadResults?.data || uploadResults || [];
      
      // Convert API response to SenderoImage format
      const newImages: SenderoImage[] = apiImages.map((result, index) => ({
        id: result.id,
        url: result.urlImagen || result.url,
        filename: result.descripcion || `imagen-${index + 1}`,
        descripcion: result.descripcion || descriptions[index],
        orden: result.orden || (images.length + index + 1),
        esPrincipal: result.esPrincipal || (images.length === 0 && index === 0),
      }));
      
      console.log('🔄 Converted', newImages.length, 'images from API response');
      
      // Update images list
      const updatedImages = [...images, ...newImages];
      onImagesChange(updatedImages);
      
      setUploadProgress(100);
      setSuccessMessage(`${validFiles.length} imagen${validFiles.length > 1 ? 'es' : ''} subida${validFiles.length > 1 ? 's' : ''} exitosamente`);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Error uploading images');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000); // Keep progress visible for a moment
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [senderoId, images, onImagesChange]);

  const handleDeleteImage = async (imageId: string) => {
    if (!senderoId) return;
    
    try {
      console.log('🗑️ Deleting image via API:', imageId);
      
      // Delete via API
      await apiService.deleteSenderoImage(imageId);
      console.log('✅ Image deleted via API');
      
      // Remove image from list
      const updatedImages = images.filter(img => img.id !== imageId);
      onImagesChange(updatedImages);
      
      setSuccessMessage('Imagen eliminada exitosamente');

    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Error eliminando imagen');
    }
  };

  const handleSetMainImage = async (imageId: string) => {
    if (!senderoId) return;
    
    try {
      console.log('⭐ Setting main image via API:', imageId);
      
      // Update via API (if endpoint exists)
      // Note: This might need to be implemented in the backend
      // For now, we'll update locally
      
      // Update images list - mark this as principal and others as not
      const updatedImages = images.map(img => ({
        ...img,
        esPrincipal: img.id === imageId
      }));
      onImagesChange(updatedImages);
      
      setSuccessMessage('Imagen principal actualizada');
      
    } catch (err) {
      console.error('Set main image error:', err);
      setError(err instanceof Error ? err.message : 'Error estableciendo imagen principal');
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

      {successMessage && (
        <Alert variant="success" className="mb-3">
          <strong>✅ Éxito:</strong> {successMessage}
          <Button 
            variant="outline-success" 
            size="sm" 
            className="float-end"
            onClick={() => setSuccessMessage(null)}
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
