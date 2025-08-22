package com.tinambu.tours.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPResponse;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import com.tinambu.tours.TinambuToursApplication;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.servlet.DispatcherServlet;

import java.util.HashMap;
import java.util.Map;

/**
 * AWS Lambda Handler with Spring Boot integration
 * This handler initializes Spring Boot and processes HTTP requests through DispatcherServlet
 */
public class SpringLambdaHandler implements RequestHandler<APIGatewayV2HTTPEvent, APIGatewayV2HTTPResponse> {

    private static ConfigurableApplicationContext applicationContext;
    private static DispatcherServlet dispatcherServlet;

    static {
        System.out.println("=== SPRING LAMBDA HANDLER INITIALIZING ===");
        try {
            // Set the lambda profile
            System.setProperty("spring.profiles.active", "lambda");
            
            // Create SpringApplication without starting web server
            SpringApplication app = new SpringApplication(TinambuToursApplication.class);
            app.setWebApplicationType(org.springframework.boot.WebApplicationType.NONE);
            
            applicationContext = app.run();
            
            // Create DispatcherServlet manually for request processing
            dispatcherServlet = new DispatcherServlet();
            dispatcherServlet.setApplicationContext(applicationContext);
            dispatcherServlet.init();
            
            System.out.println("=== Spring Boot Application Context Initialized Successfully ===");
        } catch (Exception e) {
            System.err.println("!!! Failed to initialize Spring Boot application !!!");
            e.printStackTrace();
            throw new RuntimeException("Failed to initialize Spring Boot application", e);
        }
    }

    @Override
    public APIGatewayV2HTTPResponse handleRequest(APIGatewayV2HTTPEvent event, Context context) {
        System.out.println("=== SPRING LAMBDA HANDLER INVOKED ===");
        System.out.println("Request ID: " + context.getAwsRequestId());
        System.out.println("HTTP Method: " + event.getRequestContext().getHttp().getMethod());
        System.out.println("Path: " + event.getRawPath());

        try {
            MockHttpServletRequest servletRequest = new MockHttpServletRequest();
            servletRequest.setMethod(event.getRequestContext().getHttp().getMethod());
            servletRequest.setRequestURI(event.getRawPath());
            servletRequest.setQueryString(event.getRawQueryString());

            // Set headers
            if (event.getHeaders() != null) {
                event.getHeaders().forEach(servletRequest::addHeader);
            }

            // Set body
            if (event.getBody() != null && !event.getBody().isEmpty()) {
                servletRequest.setContent(event.getBody().getBytes());
            }

            MockHttpServletResponse servletResponse = new MockHttpServletResponse();

            // Process request through Spring's DispatcherServlet
            dispatcherServlet.service(servletRequest, servletResponse);

            // Build API Gateway response
            Map<String, String> headers = new HashMap<>();
            servletResponse.getHeaderNames().forEach(headerName ->
                headers.put(headerName, servletResponse.getHeader(headerName))
            );

            // Ensure CORS headers are present
            headers.putIfAbsent("Access-Control-Allow-Origin", "*");
            headers.putIfAbsent("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            headers.putIfAbsent("Access-Control-Allow-Headers", "Content-Type, Authorization");

            String responseBody = servletResponse.getContentAsString();
            System.out.println("Response Status: " + servletResponse.getStatus());
            System.out.println("Response Body: " + responseBody);

            return APIGatewayV2HTTPResponse.builder()
                .withStatusCode(servletResponse.getStatus())
                .withHeaders(headers)
                .withBody(responseBody)
                .build();

        } catch (Exception e) {
            System.err.println("!!! Error processing request in Spring Boot handler !!!");
            e.printStackTrace();

            Map<String, String> errorHeaders = new HashMap<>();
            errorHeaders.put("Content-Type", "application/json");
            errorHeaders.put("Access-Control-Allow-Origin", "*");

            String errorBody = "{\"error\":\"Internal Server Error\",\"message\":\"" +
                             e.getMessage().replace("\"", "'") + "\"}";

            return APIGatewayV2HTTPResponse.builder()
                .withStatusCode(500)
                .withHeaders(errorHeaders)
                .withBody(errorBody)
                .build();
        }
    }
}
