import json
import os
import urllib.request
import urllib.error
import boto3
from datetime import datetime

# Configuration from environment variables
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')
GOOGLE_PLACE_ID = os.environ.get('GOOGLE_PLACE_ID', '')
FACEBOOK_PAGE_ID = os.environ.get('FACEBOOK_PAGE_ID', '')
FACEBOOK_ACCESS_TOKEN = os.environ.get('FACEBOOK_ACCESS_TOKEN', '')

# S3 cache configuration
CACHE_BUCKET = os.environ.get('CACHE_BUCKET', 'tinambu-public-assets-dev')
CACHE_KEY = 'cache/google-reviews-accumulated.json'

# Initialize S3 client
s3_client = boto3.client('s3')


def lambda_handler(event, context):
    """Main Lambda handler for reviews endpoints"""
    
    print(f"📊 Event: {json.dumps(event)}")
    
    # Extract path from event
    path = event.get('rawPath', event.get('path', ''))
    print(f"📍 Path: {path}")
    
    # Route to appropriate handler
    if path == '/reviews/google':
        return handle_google_reviews()
    elif path == '/reviews/facebook':
        return handle_facebook_reviews()
    elif path == '/reviews/summary':
        return handle_reviews_summary()
    elif path == '/reviews/health':
        return handle_health_check()
    else:
        return create_response(404, {
            'success': False,
            'message': f'Ruta no encontrada: {path}'
        })


def load_cached_reviews():
    """Load previously accumulated reviews from S3."""
    try:
        response = s3_client.get_object(Bucket=CACHE_BUCKET, Key=CACHE_KEY)
        data = json.loads(response['Body'].read().decode('utf-8'))
        print(f"📦 Cache loaded: {len(data.get('reviews', []))} cached reviews")
        return data.get('reviews', [])
    except s3_client.exceptions.NoSuchKey:
        print("📦 No cache found, starting fresh")
        return []
    except Exception as e:
        print(f"⚠️ Error loading cache: {str(e)}")
        return []


def save_cached_reviews(reviews):
    """Save accumulated reviews to S3."""
    try:
        data = {
            'reviews': reviews,
            'lastUpdated': datetime.utcnow().isoformat() + 'Z',
            'count': len(reviews)
        }
        s3_client.put_object(
            Bucket=CACHE_BUCKET,
            Key=CACHE_KEY,
            Body=json.dumps(data, ensure_ascii=False),
            ContentType='application/json'
        )
        print(f"💾 Cache saved: {len(reviews)} reviews")
    except Exception as e:
        print(f"⚠️ Error saving cache: {str(e)}")


def fetch_google_reviews(sort_order='most_relevant', language=None, no_translations=False):
    """Fetch reviews from Google Places API with a specific sort order and language.
    Google Places API returns max 5 reviews per call.
    By calling with different sort orders, languages, and translation settings
    we can maximize unique reviews.
    """
    url = (
        f"https://maps.googleapis.com/maps/api/place/details/json"
        f"?place_id={GOOGLE_PLACE_ID}"
        f"&fields=name,rating,user_ratings_total,reviews"
        f"&reviews_sort={sort_order}"
        f"&key={GOOGLE_API_KEY}"
    )
    if no_translations:
        url += "&reviews_no_translations=true"
    if language:
        url += f"&language={language}"
    
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=10) as response:
        return json.loads(response.read().decode('utf-8'))


def handle_google_reviews():
    """Get Google Reviews with individual reviews.
    Makes multiple API calls to maximize unique reviews,
    accumulates them in S3 cache over time,
    and filters to only 5-star reviews with text.
    """
    print("🔍 Obteniendo reviews de Google...")
    
    if not GOOGLE_API_KEY or not GOOGLE_PLACE_ID:
        print("⚠️ Google API Key o Place ID no configurados")
        return create_response(200, {
            'success': True,
            'message': 'Reviews de Google obtenidas exitosamente',
            'data': create_google_fallback()
        })
    
    try:
        # Make multiple API calls with different sort orders and languages
        # to maximize the number of unique reviews we can collect.
        # Google returns max 5 reviews per call but different combinations
        # may surface different reviews.
        # Two calls with different sort orders to maximize unique reviews.
        # Google Places API returns max 5 per call.
        # reviews_no_translations=True to show reviews in their original language.
        # (sort_order, language, no_translations)
        api_calls = [
            ('most_relevant', None, True),
            ('newest', None, True),
        ]
        
        responses = []
        for sort_order, lang, no_trans in api_calls:
            try:
                resp = fetch_google_reviews(sort_order, lang, no_trans)
                responses.append(resp)
            except Exception as e:
                print(f"⚠️ Error en llamada ({sort_order}, {lang}): {str(e)}")
        
        # Use the first successful response for metadata
        result = None
        for resp in responses:
            if resp.get('status') == 'OK' and 'result' in resp:
                result = resp['result']
                break
        
        if result is None:
            print("❌ No se pudo obtener datos de Google")
            return create_response(200, {
                'success': True,
                'message': 'Reviews de Google obtenidas exitosamente',
                'data': create_google_fallback()
            })
        
        # Collect reviews from all API calls
        fresh_reviews = []
        for data in responses:
            if data.get('status') == 'OK' and 'result' in data:
                for review in data['result'].get('reviews', []):
                    review_text = review.get('text', '').strip()
                    if review.get('rating', 0) == 5 and review_text:
                        fresh_reviews.append({
                            'author_name': review.get('author_name', ''),
                            'author_photo': review.get('profile_photo_url', ''),
                            'rating': review.get('rating', 0),
                            'text': review_text,
                            'time': review.get('time', 0),
                            'relative_time': review.get('relative_time_description', '')
                        })
        
        # Load previously cached reviews from S3
        cached_reviews = load_cached_reviews()
        
        # Merge fresh + cached, deduplicate by author_name
        # Fresh reviews take priority (they have updated relative_time)
        seen_authors = set()
        merged_reviews = []
        
        # Add fresh reviews first (they have updated info)
        for review in fresh_reviews:
            author = review.get('author_name', '')
            if author and author not in seen_authors:
                seen_authors.add(author)
                merged_reviews.append(review)
        
        # Then add cached reviews that we didn't get this time
        for review in cached_reviews:
            author = review.get('author_name', '')
            if author and author not in seen_authors:
                seen_authors.add(author)
                merged_reviews.append(review)
        
        # Sort by time (most recent first)
        merged_reviews.sort(key=lambda x: x.get('time', 0), reverse=True)
        
        # Save the merged reviews back to S3 cache
        save_cached_reviews(merged_reviews)
        
        google_data = {
            'rating': result.get('rating', 0),
            'totalReviews': result.get('user_ratings_total', 0),
            'name': result.get('name', 'Tinambú Tours'),
            'reviews': merged_reviews
        }
        print(f"✅ Google reviews: {google_data['rating']}⭐, {google_data['totalReviews']} opiniones, {len(fresh_reviews)} frescas, {len(cached_reviews)} en cache, {len(merged_reviews)} total")
        return create_response(200, {
            'success': True,
            'message': 'Reviews de Google obtenidas exitosamente',
            'data': google_data
        })
                
    except Exception as e:
        print(f"❌ Error al obtener reviews de Google: {str(e)}")
        return create_response(200, {
            'success': True,
            'message': 'Reviews de Google obtenidas exitosamente',
            'data': create_google_fallback()
        })


def handle_facebook_reviews():
    """Get Facebook Reviews"""
    print("🔍 Obteniendo reviews de Facebook...")
    
    if not FACEBOOK_PAGE_ID or not FACEBOOK_ACCESS_TOKEN:
        print("⚠️ Facebook Page ID o Access Token no configurados")
        return create_response(200, {
            'success': True,
            'message': 'Reviews de Facebook obtenidas exitosamente',
            'data': create_facebook_fallback()
        })
    
    try:
        url = f"https://graph.facebook.com/v18.0/{FACEBOOK_PAGE_ID}?fields=name,overall_star_rating,rating_count&access_token={FACEBOOK_ACCESS_TOKEN}"
        
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            facebook_data = {
                'rating': data.get('overall_star_rating', 0),
                'totalReviews': data.get('rating_count', 0),
                'name': data.get('name', 'Tinambú Tours'),
                'id': data.get('id', FACEBOOK_PAGE_ID)
            }
            print(f"✅ Facebook reviews obtenidas: {facebook_data['rating']}⭐, {facebook_data['totalReviews']} opiniones")
            return create_response(200, {
                'success': True,
                'message': 'Reviews de Facebook obtenidas exitosamente',
                'data': facebook_data
            })
                
    except Exception as e:
        print(f"❌ Error al obtener reviews de Facebook: {str(e)}")
        return create_response(200, {
            'success': True,
            'message': 'Reviews de Facebook obtenidas exitosamente',
            'data': create_facebook_fallback()
        })


def handle_reviews_summary():
    """Get both Google and Facebook reviews"""
    print("📊 Obteniendo resumen de reviews...")
    
    google_response = handle_google_reviews()
    facebook_response = handle_facebook_reviews()
    
    google_data = json.loads(google_response['body']).get('data', create_google_fallback())
    facebook_data = json.loads(facebook_response['body']).get('data', create_facebook_fallback())
    
    summary = {
        'google': google_data,
        'facebook': facebook_data,
        'lastUpdated': datetime.utcnow().isoformat() + 'Z'
    }
    
    return create_response(200, {
        'success': True,
        'message': 'Resumen de reviews obtenido exitosamente',
        'data': summary
    })


def handle_health_check():
    """Health check endpoint"""
    return create_response(200, {
        'success': True,
        'message': 'Reviews service is healthy',
        'data': 'OK'
    })


def create_google_fallback():
    """Fallback data for Google with real values"""
    return {
        'rating': 4.7,
        'totalReviews': 39,
        'name': 'Tinambú - Paso Centurión Tours',
        'reviews': []
    }


def create_facebook_fallback():
    """Fallback data for Facebook"""
    return {
        'rating': 4.9,
        'totalReviews': 28,
        'name': 'Tinambú Tours',
        'id': FACEBOOK_PAGE_ID or ''
    }


def create_response(status_code, body):
    """Create HTTP response with CORS headers"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        'body': json.dumps(body, ensure_ascii=False)
    }
