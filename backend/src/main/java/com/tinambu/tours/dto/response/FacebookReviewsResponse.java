package com.tinambu.tours.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public class FacebookReviewsResponse {
    
    @JsonProperty("overall_star_rating")
    private Double rating;
    
    @JsonProperty("rating_count")
    private Integer totalReviews;
    
    private String name;
    
    private String id;
    
    // Constructors
    public FacebookReviewsResponse() {}
    
    public FacebookReviewsResponse(Double rating, Integer totalReviews, String name, String id) {
        this.rating = rating;
        this.totalReviews = totalReviews;
        this.name = name;
        this.id = id;
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
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
}


