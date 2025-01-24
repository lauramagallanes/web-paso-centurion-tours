import React, { useRef } from "react";
import "../css/PhotoGallery.css";

const PhotoGallery = ({ photos }) => {
    const galleryRef = useRef(null);

    const scrollLeft = () => {
        if (galleryRef.current) {
      galleryRef.current.scrollBy({ left: -300, behavior: "smooth" });
        }
     };
     const scrollRight = () => {
        if (galleryRef.current) {
          galleryRef.current.scrollBy({ left: 300, behavior: "smooth" });
        }
      };
  return (
    <div className="gallery-container">
        <button className="gallery-button left" onClick={scrollLeft}>&lt;</button>
        <div className="gallery" ref={galleryRef}>
            
            {photos.map((photo, index) => (
                <div className={`gallery-item ${photo.size || ''}`} key={index}>
                <img src={photo.src} alt={photo.alt || `Photo ${index + 1}`} />
                </div>
            ))}
        </div>
        <button className="gallery-button right" onClick={scrollRight}>&gt;</button>
    </div>
  );
};

export default PhotoGallery;