import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/apiService';
import './ParticipantsSelector.css';

interface ParticipantsSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (adults: number, children: number, priceData?: any) => void;
  senderoId: string;
  initialAdults?: number;
  initialChildren?: number;
  maxParticipants?: number;
  showPriceCalculation?: boolean;
  disabled?: boolean;
}

interface PriceData {
  precioBase: number;
  precioAdultos: number;
  precioNinos: number;
  descuentoNinos: number;
  descuentoGrupo: number;
  precioTotal: number;
  montoSeña: number;
  saldoRestante: number;
  detalleDescuentos?: string[];
}

const ParticipantsSelector: React.FC<ParticipantsSelectorProps> = ({
  isOpen,
  onClose,
  onSave,
  senderoId,
  initialAdults = 2,
  initialChildren = 0,
  maxParticipants = 10,
  showPriceCalculation = true,
  disabled = false
}) => {
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Debounced price calculation
  const calculatePrice = useCallback(
    async (adultCount: number, childrenCount: number) => {
      if (!showPriceCalculation || adultCount === 0) {
        setPriceData(null);
        return;
      }

      setIsLoadingPrice(true);
      setPriceError(null);

      try {
        const response = await apiService.calculateSenderoPriceLive(senderoId, adultCount, childrenCount);
        
        if (response.success) {
          setPriceData(response.data);
        } else {
          setPriceError(response.error || 'Error al calcular precio');
        }
      } catch (error) {
        console.error('Error calculating price:', error);
        setPriceError('Error de conexión al calcular precio');
      } finally {
        setIsLoadingPrice(false);
      }
    },
    [senderoId, showPriceCalculation]
  );

  // Effect for debounced price calculation
  useEffect(() => {
    if (!showPriceCalculation) return;

    const timer = setTimeout(() => {
      calculatePrice(adults, children);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [adults, children, calculatePrice, showPriceCalculation]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAdults(initialAdults);
      setChildren(initialChildren);
      setPriceData(null);
      setPriceError(null);
    }
  }, [isOpen, initialAdults, initialChildren]);

  const incrementAdults = () => {
    const total = adults + children;
    if (total < maxParticipants) {
      setAdults(prev => prev + 1);
    }
  };

  const decrementAdults = () => {
    if (adults > 1) { // At least 1 adult required
      setAdults(prev => prev - 1);
    }
  };

  const incrementChildren = () => {
    const total = adults + children;
    if (total < maxParticipants) {
      setChildren(prev => prev + 1);
    }
  };

  const decrementChildren = () => {
    if (children > 0) {
      setChildren(prev => prev - 1);
    }
  };

  const handleSave = () => {
    onSave(adults, children, priceData);
    onClose();
  };

  const totalParticipants = adults + children;
  const canAddMore = totalParticipants < maxParticipants;

  if (!isOpen) return null;

  return (
    <div className="participants-overlay" onClick={onClose}>
      <div className="participants-modal" onClick={e => e.stopPropagation()}>
        <div className="participants-header">
          <h3>Seleccionar Participantes</h3>
          <button className="close-btn" onClick={onClose} disabled={disabled}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </button>
        </div>

        <div className="participants-body">
          {/* Adults Counter */}
          <div className="counter-section">
            <div className="counter-info">
              <div className="counter-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                </svg>
                <span>Adultos</span>
              </div>
              <div className="counter-subtitle">13+ años</div>
            </div>
            <div className="counter-controls">
              <button
                className="counter-btn"
                onClick={decrementAdults}
                disabled={adults <= 1 || disabled}
                title="Al menos 1 adulto requerido"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,13H5V11H19V13Z" />
                </svg>
              </button>
              <span className="counter-value">{adults}</span>
              <button
                className="counter-btn"
                onClick={incrementAdults}
                disabled={!canAddMore || disabled}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Children Counter */}
          <div className="counter-section">
            <div className="counter-info">
              <div className="counter-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22V16H21C21,18.89 18.89,21 16,21H8C5.11,21 3,18.89 3,16H2V14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M16,9H8A5,5 0 0,0 3,14H21A5,5 0 0,0 16,9Z" />
                </svg>
                <span>Niños</span>
              </div>
              <div className="counter-subtitle">0-12 años • 30% descuento</div>
            </div>
            <div className="counter-controls">
              <button
                className="counter-btn"
                onClick={decrementChildren}
                disabled={children <= 0 || disabled}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,13H5V11H19V13Z" />
                </svg>
              </button>
              <span className="counter-value">{children}</span>
              <button
                className="counter-btn"
                onClick={incrementChildren}
                disabled={!canAddMore || disabled}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Total Summary */}
          <div className="total-summary">
            <div className="total-participants">
              <strong>Total: {totalParticipants} persona{totalParticipants !== 1 ? 's' : ''}</strong>
            </div>
            {totalParticipants >= maxParticipants && (
              <div className="max-warning">
                Máximo {maxParticipants} participantes por reserva
              </div>
            )}
            {totalParticipants > 10 && (
              <div className="group-discount">
                🎉 ¡Descuento de grupo aplicado! (10% adicional)
              </div>
            )}
          </div>

          {/* Price Calculation */}
          {showPriceCalculation && (
            <div className="price-section">
              {isLoadingPrice && (
                <div className="price-loading">
                  <div className="spinner"></div>
                  <span>Calculando precio...</span>
                </div>
              )}

              {priceError && (
                <div className="price-error">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />
                  </svg>
                  <span>{priceError}</span>
                </div>
              )}

              {priceData && !isLoadingPrice && !priceError && (
                <div className="price-breakdown">
                  <div className="price-header">
                    <h4>Detalle de Precios</h4>
                  </div>
                  
                  <div className="price-items">
                    {adults > 0 && (
                      <div className="price-item">
                        <span>{adults} Adulto{adults > 1 ? 's' : ''}</span>
                        <span>${priceData.precioAdultos.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {children > 0 && (
                      <div className="price-item">
                        <span>{children} Niño{children > 1 ? 's' : ''} <small>(30% desc.)</small></span>
                        <span>${priceData.precioNinos.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {priceData.descuentoGrupo > 0 && (
                      <div className="price-item discount">
                        <span>Descuento de grupo</span>
                        <span>-${(priceData.precioTotal * priceData.descuentoGrupo / 100).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="price-total">
                    <div className="total-line">
                      <span>Total</span>
                      <span className="total-amount">${priceData.precioTotal.toLocaleString()}</span>
                    </div>
                    
                    {priceData.montoSeña > 0 && (
                      <>
                        <div className="deposit-info">
                          <div className="deposit-line">
                            <span>Seña (30%)</span>
                            <span>${priceData.montoSeña.toLocaleString()}</span>
                          </div>
                          <div className="remaining-line">
                            <span>Saldo restante</span>
                            <span>${priceData.saldoRestante.toLocaleString()}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {priceData.detalleDescuentos && priceData.detalleDescuentos.length > 0 && (
                    <div className="discounts-applied">
                      <h5>Descuentos aplicados:</h5>
                      <ul>
                        {priceData.detalleDescuentos.map((descuento, index) => (
                          <li key={index}>{descuento}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="participants-footer">
          <button className="btn-secondary" onClick={onClose} disabled={disabled}>
            Cancelar
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSave}
            disabled={adults === 0 || disabled}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsSelector;
