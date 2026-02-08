import React, { useState } from 'react';
import ReviewCard, { Review } from './ReviewCard';
import './ReviewsSlider.css';

interface ReviewsSliderProps {
  reviews: Review[];
}

const ReviewsSlider: React.FC<ReviewsSliderProps> = ({ reviews }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Number of reviews to show at once
  const reviewsPerPage = 3;
  
  // Calculate total pages
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  
  // Get current reviews to display
  const getCurrentReviews = () => {
    const start = currentIndex * reviewsPerPage;
    const end = start + reviewsPerPage;
    return reviews.slice(start, end);
  };
  
  const goToNext = () => {
    if (currentIndex < totalPages - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const goToPage = (pageIndex: number) => {
    setCurrentIndex(pageIndex);
  };
  
  if (reviews.length === 0) {
    return null;
  }
  
  const currentReviews = getCurrentReviews();
  
  return (
    <div className="reviews-slider">
      <div className="reviews-slider-container">
        {/* Previous Button */}
        {currentIndex > 0 && (
          <button 
            className="reviews-slider-arrow prev" 
            onClick={goToPrevious}
            aria-label="Previous reviews"
          >
            ‹
          </button>
        )}
        
        {/* Reviews Grid */}
        <div className="reviews-slider-grid">
          {currentReviews.map((review, index) => (
            <ReviewCard key={`${currentIndex}-${index}`} review={review} />
          ))}
        </div>
        
        {/* Next Button */}
        {currentIndex < totalPages - 1 && (
          <button 
            className="reviews-slider-arrow next" 
            onClick={goToNext}
            aria-label="Next reviews"
          >
            ›
          </button>
        )}
      </div>
      
      {/* Dots Navigation */}
      {totalPages > 1 && (
        <div className="reviews-slider-dots">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              className={`reviews-slider-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToPage(index)}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Page Counter */}
      <div className="reviews-slider-counter">
        Mostrando {currentIndex * reviewsPerPage + 1}-{Math.min((currentIndex + 1) * reviewsPerPage, reviews.length)} de {reviews.length} opiniones
      </div>
    </div>
  );
};

export default ReviewsSlider;


