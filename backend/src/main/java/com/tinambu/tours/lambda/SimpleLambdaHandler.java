package com.tinambu.tours.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPResponse;

import java.util.HashMap;
import java.util.Map;

/**
 * Simple AWS Lambda Handler for testing
 */
public class SimpleLambdaHandler implements RequestHandler<APIGatewayV2HTTPEvent, APIGatewayV2HTTPResponse> {

    @Override
    public APIGatewayV2HTTPResponse handleRequest(APIGatewayV2HTTPEvent event, Context context) {
        System.out.println("=== SIMPLE LAMBDA HANDLER INVOKED ===");
        System.out.println("Request ID: " + context.getAwsRequestId());
        System.out.println("HTTP Method: " + event.getRequestContext().getHttp().getMethod());
        System.out.println("Path: " + event.getRawPath());

        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        headers.put("Access-Control-Allow-Headers", "Content-Type, Authorization");

        String responseBody;
        int statusCode = 200;

        // Simple routing
        String path = event.getRawPath();
        String method = event.getRequestContext().getHttp().getMethod();

        if ("/health".equals(path) && "GET".equals(method)) {
            responseBody = "{\"status\":\"ok\",\"message\":\"Simple Lambda handler is working!\",\"timestamp\":\"" + 
                          java.time.Instant.now().toString() + "\",\"service\":\"tinambu-tours-backend\"}";
        } else {
            responseBody = "{\"error\":\"Not Found\",\"message\":\"Path " + path + " not found\",\"method\":\"" + method + "\"}";
            statusCode = 404;
        }

        System.out.println("Response Status: " + statusCode);
        System.out.println("Response Body: " + responseBody);

        return APIGatewayV2HTTPResponse.builder()
            .withStatusCode(statusCode)
            .withHeaders(headers)
            .withBody(responseBody)
            .build();
    }
}
