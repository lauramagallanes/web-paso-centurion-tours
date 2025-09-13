package com.tinambu.tours.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPResponse;

import java.util.HashMap;
import java.util.Map;

/**
 * AWS Lambda Handler - Debugging version to verify deployment
 */
public class LambdaHandler implements RequestHandler<APIGatewayV2HTTPEvent, APIGatewayV2HTTPResponse> {

    static {
        System.out.println("=== STATIC BLOCK EXECUTING ===");
        System.out.println("Java Version: " + System.getProperty("java.version"));
        System.out.println("=== STATIC BLOCK COMPLETE ===");
    }

    @Override
    public APIGatewayV2HTTPResponse handleRequest(APIGatewayV2HTTPEvent event, Context context) {
        System.out.println("=== NEW LAMBDA HANDLER INVOKED ===");
        
        try {
            String method = event.getRequestContext().getHttp().getMethod();
            String path = event.getRawPath();
            String body = event.getBody();
            
            System.out.println("Method: " + method);
            System.out.println("Path: " + path);
            System.out.println("Body: " + body);
            System.out.println("Headers: " + event.getHeaders());
            
            // Handle CORS preflight
            if ("OPTIONS".equals(method)) {
                System.out.println("Handling CORS preflight");
                return createCorsResponse(200, "");
            }
            
            // Create response body with detailed info
            String responseBody = String.format(
                "{\"status\":\"ok\",\"message\":\"NEW Lambda Handler Working!\",\"method\":\"%s\",\"path\":\"%s\",\"timestamp\":\"%s\"}",
                method, path, java.time.Instant.now().toString()
            );
            
            System.out.println("Response: " + responseBody);
            
            return createCorsResponse(200, responseBody);
                
        } catch (Exception e) {
            System.err.println("ERROR in new handler: " + e.getMessage());
            e.printStackTrace();
            
            String errorBody = String.format(
                "{\"error\":\"Internal Server Error\",\"message\":\"%s\",\"handler\":\"NEW_VERSION\"}", 
                e.getMessage()
            );
            
            return createCorsResponse(500, errorBody);
        }
    }
    
    private APIGatewayV2HTTPResponse createCorsResponse(int statusCode, String body) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        headers.put("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        headers.put("Access-Control-Max-Age", "86400");
        
        return APIGatewayV2HTTPResponse.builder()
            .withStatusCode(statusCode)
            .withHeaders(headers)
            .withBody(body)
            .build();
    }
}