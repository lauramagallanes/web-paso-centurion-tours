import React from 'react';
import './ReviewCard.css';

export interface Review {
  author_name: string;
  author_photo: string;
  rating: number;
  text: string;
  relative_time: string;
}

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const { author_name, author_photo, rating, text, relative_time } = review;
  
  // Truncate text if too long
  const truncatedText = text.length > 200 ? text.substring(0, 200) + '...' : text;
  
  // Render stars
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`review-star ${i <= rating ? 'filled' : 'empty'}`}>
          ★
        </span>
      );
    }
    return stars;
  };
  
  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-avatar">
          {author_photo ? (
            <img 
              src={author_photo} 
              alt={author_name}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="review-avatar-placeholder">
              {author_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="review-author-info">
          <h4 className="review-author-name">{author_name}</h4>
          <div className="review-stars">
            {renderStars()}
          </div>
        </div>
      </div>
      
      <p className="review-text">{truncatedText}</p>
      
      {relative_time && (
        <span className="review-time">{relative_time}</span>
      )}
    </div>
  );
};

export default ReviewCard;


