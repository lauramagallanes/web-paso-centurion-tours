package com.tinambu.tours.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPResponse;

import java.util.HashMap;
import java.util.Map;

public class LambdaHandler implements RequestHandler<APIGatewayV2HTTPEvent, APIGatewayV2HTTPResponse> {

    @Override
    public APIGatewayV2HTTPResponse handleRequest(APIGatewayV2HTTPEvent event, Context context) {
        System.out.println("Lambda handler invoked!");
        
        try {
            System.out.println("Received request: " + event.getRouteKey() + " " + event.getRawPath());
            
            Map<String, String> headers = new HashMap<>();
            headers.put("Content-Type", "application/json");
            headers.put("Access-Control-Allow-Origin", "*");
            
            String responseBody = "{\"status\":\"ok\",\"message\":\"Tinambu Tours API is running\",\"timestamp\":\"" + 
                                java.time.Instant.now().toString() + "\"}";
            
            System.out.println("Sending response: " + responseBody);
            
            return APIGatewayV2HTTPResponse.builder()
                .withStatusCode(200)
                .withHeaders(headers)
                .withBody(responseBody)
                .build();
                
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            
            return APIGatewayV2HTTPResponse.builder()
                .withStatusCode(500)
                .withHeaders(new HashMap<>())
                .withBody("{\"error\":\"Internal Server Error\"}")
                .build();
        }
    }
}
