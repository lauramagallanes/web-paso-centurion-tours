package com.tinambu.tours.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPResponse;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.servlet.DispatcherServlet;
import com.tinambu.tours.TinambuToursApplication;

import java.util.HashMap;
import java.util.Map;

/**
 * AWS Lambda Handler with full Spring Boot integration
 */
public class SpringBootLambdaHandler implements RequestHandler<APIGatewayV2HTTPEvent, APIGatewayV2HTTPResponse> {

    private static ConfigurableApplicationContext applicationContext;
    private static DispatcherServlet dispatcherServlet;
    private static boolean initialized = false;

    static {
        initializeSpringBoot();
    }

    private static void initializeSpringBoot() {
        System.out.println("=== SPRING BOOT LAMBDA HANDLER INITIALIZING ===");
        try {
            // Configure Spring Application for Lambda
            SpringApplication app = new SpringApplication(TinambuToursApplication.class);
            app.setWebApplicationType(WebApplicationType.NONE);
            
            // Disable database auto-configuration initially
            app.setAdditionalProfiles("lambda-no-db");
            
            System.out.println("Starting Spring Boot application context...");
            applicationContext = app.run();
            
            System.out.println("Creating DispatcherServlet...");
            dispatcherServlet = new DispatcherServlet();
            dispatcherServlet.setApplicationContext(applicationContext);
            dispatcherServlet.init();
            
            initialized = true;
            System.out.println("=== Spring Boot Application Context Initialized Successfully ===");
            
        } catch (Exception e) {
            System.err.println("!!! Failed to initialize Spring Boot application !!!");
            e.printStackTrace();
            initialized = false;
        }
    }

    @Override
    public APIGatewayV2HTTPResponse handleRequest(APIGatewayV2HTTPEvent event, Context context) {
        System.out.println("=== SPRING BOOT LAMBDA HANDLER INVOKED ===");
        System.out.println("Request ID: " + context.getAwsRequestId());
        System.out.println("HTTP Method: " + event.getRequestContext().getHttp().getMethod());
        System.out.println("Path: " + event.getRawPath());
        System.out.println("Initialized: " + initialized);

        // Fallback if Spring Boot failed to initialize
        if (!initialized) {
            return createErrorResponse("Spring Boot initialization failed", 500);
        }

        try {
            // Create mock servlet request/response
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
            System.out.println("Processing request through DispatcherServlet...");
            dispatcherServlet.service(servletRequest, servletResponse);

            // Build API Gateway response
            Map<String, String> headers = new HashMap<>();
            servletResponse.getHeaderNames().forEach(headerName ->
                headers.put(headerName, servletResponse.getHeader(headerName))
            );

            // Ensure CORS headers
            headers.putIfAbsent("Access-Control-Allow-Origin", "*");
            headers.putIfAbsent("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            headers.putIfAbsent("Access-Control-Allow-Headers", "Content-Type, Authorization");

            String responseBody = servletResponse.getContentAsString();
            int statusCode = servletResponse.getStatus();

            System.out.println("Response Status: " + statusCode);
            System.out.println("Response Body: " + responseBody);

            return APIGatewayV2HTTPResponse.builder()
                .withStatusCode(statusCode)
                .withHeaders(headers)
                .withBody(responseBody)
                .build();

        } catch (Exception e) {
            System.err.println("!!! Error processing request !!!");
            e.printStackTrace();
            return createErrorResponse("Internal Server Error: " + e.getMessage(), 500);
        }
    }

    private APIGatewayV2HTTPResponse createErrorResponse(String message, int statusCode) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("Access-Control-Allow-Origin", "*");

        String errorBody = "{\"error\":\"" + message + "\",\"timestamp\":\"" + 
                          java.time.Instant.now().toString() + "\"}";

        return APIGatewayV2HTTPResponse.builder()
            .withStatusCode(statusCode)
            .withHeaders(headers)
            .withBody(errorBody)
            .build();
    }
}
