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
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.HandlerAdapter;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter;
import com.tinambu.tours.TinambuToursApplication;

import java.util.HashMap;
import java.util.Map;

/**
 * AWS Lambda Handler with full Spring Boot integration
 */
public class SpringBootLambdaHandler implements RequestHandler<APIGatewayV2HTTPEvent, APIGatewayV2HTTPResponse> {

    private static ConfigurableApplicationContext applicationContext;
    private static RequestMappingHandlerMapping handlerMapping;
    private static RequestMappingHandlerAdapter handlerAdapter;
    private static boolean initialized = false;

    static {
        initializeSpringBoot();
    }

    private static String determineProfile() {
        // Check if database environment variables are available
        String dbHost = System.getenv("DB_HOST");
        String dbUser = System.getenv("DB_USER");
        String dbName = System.getenv("DB_NAME");
        
        String ssmDbPassword = System.getenv("SSM_DB_PASSWORD");

        if (dbHost != null && !dbHost.isEmpty() &&
            dbUser != null && !dbUser.isEmpty() &&
            dbName != null && !dbName.isEmpty() &&
            ssmDbPassword != null && !ssmDbPassword.isEmpty()) {
            System.out.println("Database environment variables found, attempting database connection");
            System.out.println("DB_HOST: " + dbHost);
            System.out.println("DB_USER: " + dbUser);
            System.out.println("DB_NAME: " + dbName);
            System.out.println("SSM_DB_PASSWORD: " + ssmDbPassword);
            return "lambda-with-db";
        } else {
            System.out.println("Database connection not available, using no-db profile");
            System.out.println("DB_HOST: " + (dbHost != null ? "present" : "missing"));
            System.out.println("DB_USER: " + (dbUser != null ? "present" : "missing"));
            System.out.println("DB_NAME: " + (dbName != null ? "present" : "missing"));
            System.out.println("SSM_DB_PASSWORD: " + (ssmDbPassword != null ? "present" : "missing"));
            return "lambda-no-db";
        }
    }

    private static void initializeSpringBoot() {
        System.out.println("=== SPRING BOOT LAMBDA HANDLER INITIALIZING ===");
        try {
            // Configure Spring Application for Lambda
            SpringApplication app = new SpringApplication(TinambuToursApplication.class);
            app.setWebApplicationType(WebApplicationType.NONE);
            
            // Try to use database profile, fallback to no-db if fails
            String profile = determineProfile();
            app.setAdditionalProfiles(profile);
            System.out.println("Using Spring profile: " + profile);
            
            System.out.println("Starting Spring Boot application context...");
            applicationContext = app.run();
            
                    System.out.println("Setting up Spring MVC components...");
        
        // Get the RequestMappingHandlerMapping from the ApplicationContext
        handlerMapping = applicationContext.getBean(RequestMappingHandlerMapping.class);
        handlerAdapter = applicationContext.getBean(RequestMappingHandlerAdapter.class);
        
        System.out.println("Spring MVC components configured:");
        System.out.println("- HandlerMapping: " + handlerMapping.getClass().getSimpleName());
        System.out.println("- HandlerAdapter: " + handlerAdapter.getClass().getSimpleName());
        
        // Print available mappings for debugging
        System.out.println("=== AVAILABLE HANDLER MAPPINGS ===");
        handlerMapping.getHandlerMethods().forEach((key, method) -> {
            System.out.println("Mapping: " + key + " -> " + method.getMethod().getDeclaringClass().getSimpleName() + "." + method.getMethod().getName());
        });
        System.out.println("=== END HANDLER MAPPINGS ===");
            
            initialized = true;
            System.out.println("=== Spring Boot Application Context Initialized Successfully ===");
            
            // Debug: List all registered beans
            System.out.println("=== REGISTERED BEANS DEBUG ===");
            String[] beanNames = applicationContext.getBeanDefinitionNames();
            System.out.println("Total beans registered: " + beanNames.length);
            
            // Look for our controllers specifically
            System.out.println("=== LOOKING FOR CONTROLLERS ===");
            for (String beanName : beanNames) {
                if (beanName.toLowerCase().contains("controller") || beanName.toLowerCase().contains("health") || beanName.toLowerCase().contains("test")) {
                    System.out.println("Found controller-related bean: " + beanName + " -> " + applicationContext.getBean(beanName).getClass().getName());
                }
            }
            
            // Check if our specific controllers are registered
            try {
                Object healthController = applicationContext.getBean("healthController");
                System.out.println("HealthController found: " + healthController.getClass().getName());
            } catch (Exception e) {
                System.out.println("HealthController NOT found: " + e.getMessage());
            }
            
            try {
                Object simpleTestController = applicationContext.getBean("simpleTestController");
                System.out.println("SimpleTestController found: " + simpleTestController.getClass().getName());
            } catch (Exception e) {
                System.out.println("SimpleTestController NOT found: " + e.getMessage());
            }
            System.out.println("=== END BEANS DEBUG ===");
            
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
        System.out.println("Event toString: " + event.toString());
        System.out.println("=== EVENT DETAILS ===");
        System.out.println("Route Key: " + event.getRouteKey());
        System.out.println("Raw Path: " + event.getRawPath());
        System.out.println("Raw Query String: " + event.getRawQueryString());
        System.out.println("Headers: " + event.getHeaders());
        if (event.getRequestContext() != null) {
            System.out.println("Request Context Route Key: " + event.getRequestContext().getRouteKey());
            System.out.println("Request Context Stage: " + event.getRequestContext().getStage());
            System.out.println("Request Context API ID: " + event.getRequestContext().getApiId());
            System.out.println("Request Context Domain Name: " + event.getRequestContext().getDomainName());
            if (event.getRequestContext().getHttp() != null) {
                System.out.println("Request Context HTTP Method: " + event.getRequestContext().getHttp().getMethod());
                System.out.println("Request Context HTTP Path: " + event.getRequestContext().getHttp().getPath());
                System.out.println("Request Context HTTP Protocol: " + event.getRequestContext().getHttp().getProtocol());
                System.out.println("Request Context HTTP Source IP: " + event.getRequestContext().getHttp().getSourceIp());
                System.out.println("Request Context HTTP User Agent: " + event.getRequestContext().getHttp().getUserAgent());
            }
        }
        System.out.println("=== END EVENT DETAILS ===");
        
        // Safe handling of potentially null values
        String httpMethod = "UNKNOWN";
        String path = "UNKNOWN";
        
        try {
            // Extract HTTP method
            if (event.getRequestContext() != null && event.getRequestContext().getHttp() != null) {
                httpMethod = event.getRequestContext().getHttp().getMethod();
            }
            
            // Try multiple path sources in order of preference
            if (event.getRawPath() != null && !event.getRawPath().isEmpty()) {
                path = event.getRawPath();
                System.out.println("Using rawPath: " + path);
            } else if (event.getRequestContext() != null && event.getRequestContext().getHttp() != null 
                      && event.getRequestContext().getHttp().getPath() != null) {
                path = event.getRequestContext().getHttp().getPath();
                System.out.println("Using requestContext.http.path: " + path);
            } else if (event.getRouteKey() != null && !event.getRouteKey().isEmpty()) {
                // Extract path from route key (e.g., "GET /test" -> "/test")
                String routeKey = event.getRouteKey();
                if (routeKey.contains(" ")) {
                    String[] parts = routeKey.split(" ", 2);
                    if (parts.length == 2) {
                        path = parts[1];
                        System.out.println("Using path from routeKey: " + path);
                    }
                }
            } else if (event.getRequestContext() != null && event.getRequestContext().getRouteKey() != null) {
                // Try route key from request context
                String routeKey = event.getRequestContext().getRouteKey();
                if (routeKey != null && routeKey.contains(" ")) {
                    String[] parts = routeKey.split(" ", 2);
                    if (parts.length == 2) {
                        path = parts[1];
                        System.out.println("Using path from requestContext.routeKey: " + path);
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("Error extracting request info: " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println("HTTP Method: " + httpMethod);
        System.out.println("Path: " + path);
        System.out.println("Raw Path from event: " + event.getRawPath());
        System.out.println("Path from event: N/A (getPath() not available)");
        System.out.println("Request Context: " + (event.getRequestContext() != null ? "present" : "null"));
        if (event.getRequestContext() != null && event.getRequestContext().getHttp() != null) {
            System.out.println("HTTP Path from context: " + event.getRequestContext().getHttp().getPath());
        }
        System.out.println("Initialized: " + initialized);

        // Fallback if Spring Boot failed to initialize
        if (!initialized) {
            return createErrorResponse("Spring Boot initialization failed", 500);
        }

        try {
            // Create mock servlet request/response
            MockHttpServletRequest servletRequest = new MockHttpServletRequest();
            servletRequest.setMethod(httpMethod.equals("UNKNOWN") ? "GET" : httpMethod);
            servletRequest.setRequestURI(path.equals("UNKNOWN") ? "/ping" : path);
            servletRequest.setQueryString(event.getRawQueryString());

            // Set headers
            if (event.getHeaders() != null) {
                event.getHeaders().forEach(servletRequest::addHeader);
            }

            // Set body and Content-Type
            if (event.getBody() != null && !event.getBody().isEmpty()) {
                servletRequest.setContent(event.getBody().getBytes());
                
                // Ensure Content-Type is set for JSON requests
                if (servletRequest.getContentType() == null && 
                    event.getBody().trim().startsWith("{")) {
                    servletRequest.addHeader("Content-Type", "application/json");
                }
            }

            MockHttpServletResponse servletResponse = new MockHttpServletResponse();

            System.out.println("Processing request through Spring MVC components...");
            System.out.println("Request details:");
            System.out.println("- Method: " + servletRequest.getMethod());
            System.out.println("- URI: " + servletRequest.getRequestURI());
            System.out.println("- Content-Type: " + servletRequest.getContentType());
            System.out.println("- Content Length: " + servletRequest.getContentLength());
            System.out.println("- Body: " + (event.getBody() != null ? event.getBody().substring(0, Math.min(100, event.getBody().length())) + "..." : "null"));
            
            // Find the handler for this request
            HandlerExecutionChain handlerChain = handlerMapping.getHandler(servletRequest);
            
            if (handlerChain == null) {
                System.out.println("No handler found for: " + httpMethod + " " + path);
                return createErrorResponse("No endpoint " + httpMethod + " " + path + ".", 404);
            }
            
            Object handler = handlerChain.getHandler();
            System.out.println("Found handler: " + handler.getClass().getSimpleName());
            
            // Execute the handler
            Object result = handlerAdapter.handle(servletRequest, servletResponse, handler);
            System.out.println("Handler executed successfully, result: " + result);

            // Build API Gateway response
            Map<String, String> headers = new HashMap<>();
            servletResponse.getHeaderNames().forEach(headerName ->
                headers.put(headerName, servletResponse.getHeader(headerName))
            );

            // Ensure CORS headers
            headers.putIfAbsent("Access-Control-Allow-Origin", "*");
            headers.putIfAbsent("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            headers.putIfAbsent("Access-Control-Allow-Headers", "Content-Type, Authorization");
            headers.putIfAbsent("Content-Type", "application/json");

            String responseBody = servletResponse.getContentAsString();
            int statusCode = servletResponse.getStatus();
            
            // If no content was written to response, use the result from handler
            if (responseBody == null || responseBody.isEmpty()) {
                if (result != null) {
                    responseBody = result.toString();
                }
            }
            
            // If status code is 0, set it to 200
            if (statusCode <= 0) {
                statusCode = 200;
            }

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
