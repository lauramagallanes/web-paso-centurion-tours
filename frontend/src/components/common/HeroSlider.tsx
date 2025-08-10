import React, { useState, useEffect } from 'react';
import Button from './Button';
import './HeroSlider.css';

export interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaAction: () => void;
  overlay?: 'light' | 'dark' | 'gradient';
}

export interface HeroSliderProps {
  slides: HeroSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
}

const HeroSlider: React.FC<HeroSliderProps> = ({
  slides,
  autoPlay = true,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  className = ''
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPlaying, slides.length, autoPlayInterval]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (!slides.length) return null;

  const currentSlideData = slides[currentSlide];

  return (
    <section className={`hero-slider ${className}`} aria-label="Hero slider">
      <div className="hero-slider-container">
        {/* Slides */}
        <div className="hero-slides">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              style={{
                backgroundImage: `url(${slide.image})`,
              }}
            >
              <div className={`hero-overlay ${slide.overlay || 'gradient'}`} />
              
              {index === currentSlide && (
                <div className="hero-content">
                  <div className="container">
                    <div className="hero-content-inner">
                      <div className="hero-text">
                        {slide.subtitle && (
                          <p className="hero-subtitle fade-in-up">
                            {slide.subtitle}
                          </p>
                        )}
                        <h1 className="hero-title fade-in-up delay-1">
                          {slide.title}
                        </h1>
                        <p className="hero-description fade-in-up delay-2">
                          {slide.description}
                        </p>
                        <div className="hero-cta fade-in-up delay-3">
                          <Button 
                            variant="primary" 
                            size="lg"
                            onClick={slide.ctaAction}
                            className="hero-cta-button"
                          >
                            {slide.ctaText}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {showArrows && slides.length > 1 && (
          <>
            <button
              className="hero-arrow hero-arrow-prev"
              onClick={goToPrevious}
              aria-label="Slide anterior"
            >
              <span className="arrow-icon">‹</span>
            </button>
            <button
              className="hero-arrow hero-arrow-next"
              onClick={goToNext}
              aria-label="Siguiente slide"
            >
              <span className="arrow-icon">›</span>
            </button>
          </>
        )}

        {/* Dots Navigation */}
        {showDots && slides.length > 1 && (
          <div className="hero-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`hero-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Ir al slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Play/Pause Control */}
        {autoPlay && slides.length > 1 && (
          <button
            className="hero-play-pause"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pausar slideshow' : 'Reproducir slideshow'}
          >
            <span className="play-pause-icon">
              {isPlaying ? '⏸️' : '▶️'}
            </span>
          </button>
        )}

        {/* Progress Bar */}
        {isPlaying && slides.length > 1 && (
          <div className="hero-progress">
            <div 
              className="hero-progress-bar"
              style={{
                animationDuration: `${autoPlayInterval}ms`,
                animationName: 'progressBar'
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSlider;
