package com.tinambu.tours.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class GoogleReviewsResponse {
    
    private Double rating;
    
    @JsonProperty("user_ratings_total")
    private Integer totalReviews;
    
    private String name;
    
    private List<GoogleReview> reviews;
    
    // Constructors
    public GoogleReviewsResponse() {}
    
    public GoogleReviewsResponse(Double rating, Integer totalReviews, String name) {
        this.rating = rating;
        this.totalReviews = totalReviews;
        this.name = name;
    }
    
    // Getters and Setters
    public Double getRating() {
        return rating;
    }
    
    public void setRating(Double rating) {
        this.rating = rating;
    }
    
    public Integer getTotalReviews() {
        return totalReviews;
    }
    
    public void setTotalReviews(Integer totalReviews) {
        this.totalReviews = totalReviews;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public List<GoogleReview> getReviews() {
        return reviews;
    }
    
    public void setReviews(List<GoogleReview> reviews) {
        this.reviews = reviews;
    }
    
    // Inner class for individual review
    public static class GoogleReview {
        private String authorName;
        private Integer rating;
        private String text;
        private Long time;
        
        public GoogleReview() {}
        
        public String getAuthorName() {
            return authorName;
        }
        
        public void setAuthorName(String authorName) {
            this.authorName = authorName;
        }
        
        public Integer getRating() {
            return rating;
        }
        
        public void setRating(Integer rating) {
            this.rating = rating;
        }
        
        public String getText() {
            return text;
        }
        
        public void setText(String text) {
            this.text = text;
        }
        
        public Long getTime() {
            return time;
        }
        
        public void setTime(Long time) {
            this.time = time;
        }
    }
}


