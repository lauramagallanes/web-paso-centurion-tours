/**
 * Reviews Service
 * Servicio para obtener reviews reales de Google y Facebook
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://53dmek6dqk.execute-api.us-east-1.amazonaws.com';

export interface IndividualReview {
  author_name: string;
  author_photo: string;
  rating: number;
  text: string;
  time: number;
  relative_time: string;
}

export interface GoogleReviews {
  rating: number;
  totalReviews: number;
  name: string;
  reviews?: IndividualReview[];
}

export interface FacebookReviews {
  rating: number;
  totalReviews: number;
  name: string;
  id: string;
}

export interface ReviewsSummary {
  google: GoogleReviews;
  facebook: FacebookReviews;
  lastUpdated: string;
}

/**
 * Obtiene reviews de Google
 */
export const getGoogleReviews = async (): Promise<GoogleReviews> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/google`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    } else {
      throw new Error(data.message || 'Error al obtener reviews de Google');
    }
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    // Fallback a datos estáticos
    return {
      rating: 4.5,
      totalReviews: 52,
      name: 'Tinambú Tours'
    };
  }
};

/**
 * Obtiene reviews de Facebook
 */
export const getFacebookReviews = async (): Promise<FacebookReviews> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/facebook`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    } else {
      throw new Error(data.message || 'Error al obtener reviews de Facebook');
    }
  } catch (error) {
    console.error('Error fetching Facebook reviews:', error);
    // Fallback a datos estáticos
    return {
      rating: 4.9,
      totalReviews: 28,
      name: 'Tinambú Tours',
      id: ''
    };
  }
};

/**
 * Obtiene resumen de todas las reviews (Google + Facebook)
 */
export const getReviewsSummary = async (): Promise<ReviewsSummary> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/summary`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    } else {
      throw new Error(data.message || 'Error al obtener resumen de reviews');
    }
  } catch (error) {
    console.error('Error fetching reviews summary:', error);
    // Fallback a datos estáticos
    return {
      google: {
        rating: 4.5,
        totalReviews: 52,
        name: 'Tinambú Tours'
      },
      facebook: {
        rating: 4.9,
        totalReviews: 28,
        name: 'Tinambú Tours',
        id: ''
      },
      lastUpdated: new Date().toISOString()
    };
  }
};

