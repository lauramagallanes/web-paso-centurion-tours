import React, { useState, useEffect } from 'react';
import Button from './Button';
import './HeroSliderV2.css';

export interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  description: string;
  ctaText: string;
  ctaAction: () => void;
  overlay?: 'light' | 'dark' | 'gradient';
  type?: 'default' | 'tinambu' | 'birds' | 'hiking' | 'accommodation';
  gallery?: string[];
  certifications?: { icon: string; name: string }[];
  features?: string[];
}

export interface HeroSliderProps {
  slides: HeroSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
}

const HeroSliderV2: React.FC<HeroSliderProps> = ({
  slides,
  autoPlay = true,
  autoPlayInterval = 6000,
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

  if (!slides.length) return null;

  const currentSlideData = slides[currentSlide];

  return (
    <section className={`hero-slider-v2 ${className}`} aria-label="Hero slider">
      <div className="hero-slider-wrapper">
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide-v2 ${index === currentSlide ? 'active' : ''}`}
            style={{
              backgroundImage: `url(${slide.image})`,
            }}
          >
            <div className="hero-overlay-v2" />
            
            {index === currentSlide && (
              <div className="hero-content-v2">
                <div className="container">
                  <div className="hero-layout">
                    {/* Main Content */}
                    <div className="hero-main">
                      {slide.subtitle && (
                        <p className="hero-subtitle fade-in-up">{slide.subtitle}</p>
                      )}
                      <h1 className="hero-title fade-in-up delay-1">{slide.title}</h1>
                      <p className="hero-description fade-in-up delay-2">{slide.description}</p>
                      
                      {slide.certifications && (
                        <div className="hero-certifications fade-in-up delay-3">
                          {slide.certifications.map((cert, i) => (
                            <div key={i} className="cert-badge">
                              <span className="cert-icon">{cert.icon}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="hero-cta fade-in-up delay-4">
                        <Button 
                          variant="outline" 
                          size="lg"
                          onClick={slide.ctaAction}
                          className="hero-cta-button"
                        >
                          {slide.ctaText} →
                        </Button>
                      </div>
                    </div>
                    
                    {/* Gallery */}
                    {slide.gallery && slide.gallery.length > 0 && (
                      <div className="hero-gallery fade-in-up delay-2">
                        {slide.gallery.map((img, i) => (
                          <div key={i} className="gallery-card">
                            <img src={img} alt={`${slide.title} ${i + 1}`} loading="lazy" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Navigation Arrows */}
        {showArrows && slides.length > 1 && (
          <>
            <button
              className="hero-arrow hero-arrow-prev"
              onClick={goToPrevious}
              aria-label="Previous slide"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="hero-arrow hero-arrow-next"
              onClick={goToNext}
              aria-label="Next slide"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSliderV2;


