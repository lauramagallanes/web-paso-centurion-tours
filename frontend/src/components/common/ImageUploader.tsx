import React, { useState, useRef, useCallback } from 'react';
import './ImageUploader.css';

interface ImageUploaderProps {
  senderoId: string;
  onImagesUploaded: (uploadedImages: any[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  allowedFormats?: string[];
  disabled?: boolean;
}

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  senderoId,
  onImagesUploaded,
  maxImages = 10,
  maxSizeMB = 5,
  allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  disabled = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!allowedFormats.includes(file.type)) {
      return `Formato no permitido. Solo ${allowedFormats.join(', ')}`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Archivo muy grande. Máximo ${maxSizeMB}MB`;
    }
    return null;
  };

  // Handle file selection
  const handleFiles = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles || disabled) return;

    const newFiles: FileWithPreview[] = [];
    const currentCount = files.length;

    for (let i = 0; i < selectedFiles.length && (currentCount + newFiles.length) < maxImages; i++) {
      const file = selectedFiles[i];
      const error = validateFile(file);
      
      const fileWithPreview: FileWithPreview = Object.assign(file, {
        id: `${Date.now()}-${i}`,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: error ? 'error' : 'pending',
        error
      });

      newFiles.push(fileWithPreview);
    }

    if (currentCount + newFiles.length >= maxImages) {
      console.warn(`Solo se pueden subir máximo ${maxImages} imágenes`);
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxImages, maxSizeMB, allowedFormats, disabled]);

  // Drag handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // Remove file
  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileId);
      const removedFile = prev.find(f => f.id === fileId);
      if (removedFile?.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return newFiles;
    });
  };

  // Upload files
  const uploadFiles = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    const validFiles = files.filter(f => f.status === 'pending');

    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        validFiles.includes(f) ? { ...f, status: 'uploading' as const } : f
      ));

      const fileList = new DataTransfer();
      validFiles.forEach(file => fileList.items.add(file));

      // Simulate upload progress (you can implement real progress with XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (validFiles.includes(f) && f.progress < 90) {
            return { ...f, progress: f.progress + 10 };
          }
          return f;
        }));
      }, 200);

      // Upload to backend
      const response = await import('../../services/apiService').then(
        module => module.apiService.uploadSenderoImages(senderoId, fileList.files)
      );

      clearInterval(progressInterval);

      if (response.success) {
        // Update status to success
        setFiles(prev => prev.map(f => 
          validFiles.includes(f) ? { ...f, status: 'success' as const, progress: 100 } : f
        ));

        // Notify parent component
        onImagesUploaded(response.data);

        // Clear files after success
        setTimeout(() => {
          setFiles([]);
        }, 2000);
      } else {
        throw new Error(response.error || 'Error al subir imágenes');
      }

    } catch (error) {
      console.error('Error uploading images:', error);
      
      // Update status to error
      setFiles(prev => prev.map(f => 
        validFiles.includes(f) ? { 
          ...f, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'Error al subir imagen'
        } : f
      ));
    } finally {
      setIsUploading(false);
    }
  };

  // Clear all files
  const clearFiles = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  };

  return (
    <div className={`image-uploader ${disabled ? 'disabled' : ''}`}>
      {/* Drop Zone */}
      <div
        className={`drop-zone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="drop-zone-content">
          <div className="drop-zone-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
          <h3>Arrastra imágenes aquí</h3>
          <p>o haz clic para seleccionar</p>
          <div className="drop-zone-info">
            <small>
              Máximo {maxImages} imágenes • {maxSizeMB}MB por imagen<br/>
              Formatos: JPG, PNG, WebP
            </small>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedFormats.join(',')}
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* File Previews */}
      {files.length > 0 && (
        <div className="file-previews">
          <div className="previews-header">
            <h4>Imágenes seleccionadas ({files.length}/{maxImages})</h4>
            <div className="preview-actions">
              <button 
                type="button" 
                onClick={clearFiles}
                className="btn-clear"
                disabled={isUploading}
              >
                Limpiar Todo
              </button>
              {files.some(f => f.status === 'pending') && (
                <button 
                  type="button" 
                  onClick={uploadFiles}
                  className="btn-upload"
                  disabled={isUploading}
                >
                  {isUploading ? 'Subiendo...' : 'Subir Imágenes'}
                </button>
              )}
            </div>
          </div>

          <div className="preview-grid">
            {files.map((file) => (
              <div key={file.id} className={`preview-item ${file.status}`}>
                <div className="preview-image">
                  <img 
                    src={file.preview} 
                    alt={file.name}
                    loading="lazy"
                  />
                  {file.status === 'uploading' && (
                    <div className="upload-progress">
                      <div 
                        className="progress-bar"
                        style={{ width: `${file.progress}%` }}
                      ></div>
                    </div>
                  )}
                  <div className="status-overlay">
                    {file.status === 'uploading' && (
                      <div className="spinner"></div>
                    )}
                    {file.status === 'success' && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                      </svg>
                    )}
                    {file.status === 'error' && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="preview-info">
                  <div className="file-name" title={file.name}>
                    {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                  </div>
                  <div className="file-size">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                  {file.error && (
                    <div className="file-error" title={file.error}>
                      {file.error}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeFile(file.id)}
                  disabled={isUploading}
                  title="Remover imagen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
