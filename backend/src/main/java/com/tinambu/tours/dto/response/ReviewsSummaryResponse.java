package com.tinambu.tours.dto.response;

public class ReviewsSummaryResponse {
    
    private GoogleReviewsResponse google;
    private FacebookReviewsResponse facebook;
    private String lastUpdated;
    
    // Constructors
    public ReviewsSummaryResponse() {}
    
    public ReviewsSummaryResponse(GoogleReviewsResponse google, FacebookReviewsResponse facebook) {
        this.google = google;
        this.facebook = facebook;
        this.lastUpdated = java.time.Instant.now().toString();
    }
    
    // Getters and Setters
    public GoogleReviewsResponse getGoogle() {
        return google;
    }
    
    public void setGoogle(GoogleReviewsResponse google) {
        this.google = google;
    }
    
    public FacebookReviewsResponse getFacebook() {
        return facebook;
    }
    
    public void setFacebook(FacebookReviewsResponse facebook) {
        this.facebook = facebook;
    }
    
    public String getLastUpdated() {
        return lastUpdated;
    }
    
    public void setLastUpdated(String lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}


