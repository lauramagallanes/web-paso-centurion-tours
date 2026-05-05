package com.tinambu.tours.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPResponse;
import com.tinambu.tours.TinambuToursApplication;
import com.tinambu.tours.security.JwtAuthenticationFilter;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.HandlerAdapter;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter;

import java.util.HashMap;
import java.util.Map;

/**
 * AWS Lambda Handler with full Spring Boot integration
 */
public class SpringBootLambdaHandler implements RequestHandler<APIGatewayV2HTTPEvent, APIGatewayV2HTTPResponse> {

    private static ConfigurableApplicationContext applicationContext;
    private static RequestMappingHandlerMapping handlerMapping;
    private static RequestMappingHandlerAdapter handlerAdapter;
    private static JwtAuthenticationFilter jwtAuthenticationFilter;
    private static boolean initialized = false;
    private static final Object initLock = new Object();

    // Lazy initialization - don't initialize in static block to avoid INIT timeout
    // Initialize on first request instead

    private static String determineProfile() {
        // Verificar si hay variables de base de datos disponibles
        String dbHost = System.getenv("DB_HOST");
        String dbUser = System.getenv("DB_USER"); // Usar DB_USER (no DB_USERNAME)
        String dbName = System.getenv("DB_NAME");
        String jwtSecretParam = System.getenv("SSM_JWT_SECRET"); // Usar SSM_JWT_SECRET (no JWT_SECRET_PARAM)

        // Si hay variables de base de datos, siempre usar lambda-with-db (incluso si SPRING_PROFILES_ACTIVE está configurado como "lambda")
        if (dbHost != null && !dbHost.isEmpty() &&
            dbUser != null && !dbUser.isEmpty() &&
            dbName != null && !dbName.isEmpty() &&
            jwtSecretParam != null && !jwtSecretParam.isEmpty()) {
            System.out.println("Database environment variables found, using lambda-with-db profile");
            System.out.println("DB_HOST: " + dbHost);
            System.out.println("DB_USER: " + dbUser);
            System.out.println("DB_NAME: " + dbName);
            System.out.println("SSM_JWT_SECRET: " + jwtSecretParam);
            return "lambda-with-db";
        }
        
        // Si no hay variables de base de datos, verificar SPRING_PROFILES_ACTIVE
        String activeProfile = System.getenv("SPRING_PROFILES_ACTIVE");
        if (activeProfile != null && !activeProfile.isEmpty() && !activeProfile.equals("lambda")) {
            System.out.println("Using explicit profile from SPRING_PROFILES_ACTIVE: " + activeProfile);
            return activeProfile;
        }
        
        // Por defecto, usar lambda-no-db
        System.out.println("Database connection not available, using lambda-no-db profile");
        System.out.println("DB_HOST: " + (dbHost != null ? "present" : "missing"));
        System.out.println("DB_USER: " + (dbUser != null ? "present" : "missing"));
        System.out.println("DB_NAME: " + (dbName != null ? "present" : "missing"));
        System.out.println("SSM_JWT_SECRET: " + (jwtSecretParam != null ? "present" : "missing"));
        return "lambda-no-db";
    }

    private static void initializeSpringBoot() {
        System.out.println("=== SPRING BOOT LAMBDA HANDLER INITIALIZING ===");
        try {
            // Configure Spring Application for Lambda
            SpringApplication app = new SpringApplication(TinambuToursApplication.class);
            app.setWebApplicationType(WebApplicationType.SERVLET);
            
            // Determine and configure profile
            String profile = determineProfile();
            
            // Siempre usar el perfil determinado automáticamente (prioriza lambda-with-db si hay DB)
            app.setAdditionalProfiles(profile);
            System.setProperty("spring.profiles.active", profile);
            System.out.println("Setting Spring profile to: " + profile);
            
            System.out.println("Starting Spring Boot application context...");
            applicationContext = app.run();
            
                    System.out.println("Setting up Spring MVC components...");
        
        // Get the RequestMappingHandlerMapping from the ApplicationContext by name
        handlerMapping = (RequestMappingHandlerMapping) applicationContext.getBean("requestMappingHandlerMapping");
        handlerAdapter = (RequestMappingHandlerAdapter) applicationContext.getBean("requestMappingHandlerAdapter");

        // The Lambda handler bypasses Spring Security's filter chain (it calls handlerAdapter
        // directly), so the JWT filter must be invoked manually before each request to populate
        // SecurityContextHolder. Otherwise @PreAuthorize sees an empty context and throws
        // AuthenticationCredentialsNotFoundException.
        try {
            jwtAuthenticationFilter = applicationContext.getBean(JwtAuthenticationFilter.class);
            System.out.println("- JwtAuthenticationFilter loaded for manual invocation");
        } catch (Exception e) {
            System.err.println("WARN: JwtAuthenticationFilter bean not available, secured endpoints will fail: " + e.getMessage());
        }

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
        // Lazy initialization - initialize on first request to avoid INIT timeout
        if (!initialized) {
            synchronized (initLock) {
                if (!initialized) {
                    System.out.println("Initializing Spring Boot on first request...");
                    initializeSpringBoot();
                }
            }
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
            
            // Parse and add query parameters individually (required for @RequestParam to work)
            if (event.getQueryStringParameters() != null && !event.getQueryStringParameters().isEmpty()) {
                event.getQueryStringParameters().forEach((key, value) -> {
                    servletRequest.addParameter(key, value);
                    System.out.println("🔧 Added query param: " + key + " = " + value);
                });
            }

            // Set headers
            if (event.getHeaders() != null) {
                event.getHeaders().forEach(servletRequest::addHeader);
            }
            
            // Ensure Content-Type header is set correctly for multipart
            String contentType = event.getHeaders() != null ? event.getHeaders().get("content-type") : null;
            if (contentType != null && contentType.startsWith("multipart/form-data")) {
                servletRequest.setContentType(contentType);
                System.out.println("🔧 Set multipart Content-Type: " + contentType);
            }

            // Set body and Content-Type
            byte[] bodyBytes = null;
            if (event.getBody() != null && !event.getBody().isEmpty()) {
                
                // Handle base64 encoded body (for multipart/form-data)
                if (Boolean.TRUE.equals(event.getIsBase64Encoded())) {
                    System.out.println("🔄 Decoding base64 body for multipart data...");
                    bodyBytes = java.util.Base64.getDecoder().decode(event.getBody());
                    System.out.println("📊 Decoded body size: " + bodyBytes.length + " bytes");
                    
                    // Log first few bytes to verify multipart format
                    String preview = new String(bodyBytes, 0, Math.min(200, bodyBytes.length));
                    System.out.println("📝 Body preview: " + preview);
                } else {
                    bodyBytes = event.getBody().getBytes();
                }
                
                servletRequest.setContent(bodyBytes);
                
                // Ensure Content-Type is set for JSON requests
                if (servletRequest.getContentType() == null && 
                    event.getBody().trim().startsWith("{")) {
                    servletRequest.addHeader("Content-Type", "application/json");
                }
            }

            MockHttpServletResponse servletResponse = new MockHttpServletResponse();
            
            // Process multipart request manually for Lambda
            if (contentType != null && contentType.startsWith("multipart/form-data")) {
                try {
                    System.out.println("🔧 Processing multipart request manually for Lambda");
                    
                    // Parse the multipart boundary
                    String boundary = null;
                    if (contentType.contains("boundary=")) {
                        boundary = contentType.substring(contentType.indexOf("boundary=") + 9);
                        System.out.println("📝 Extracted boundary: " + boundary);
                    }
                    
                    if (boundary != null && bodyBytes != null) {
                        System.out.println("🔍 Parsing multipart body with custom parser");
                        
                        // Use custom multipart parser
                        java.util.List<org.springframework.web.multipart.MultipartFile> files = 
                            MultipartParser.parseMultipartData(bodyBytes, boundary);
                        
                        if (!files.isEmpty()) {
                            System.out.println("✅ Successfully parsed " + files.size() + " file(s)");
                            
                            // Store the files in request attributes for the controller to access
                            servletRequest.setAttribute("lambda.multipart.files", files);
                            servletRequest.setAttribute("lambda.multipart.processed", true);
                            
                            // Also add as parameters for Spring's parameter resolution
                            for (org.springframework.web.multipart.MultipartFile file : files) {
                                System.out.println("📁 File available: " + file.getOriginalFilename() + " (size: " + file.getSize() + ")");
                            }
                        } else {
                            System.out.println("⚠️ No files found in multipart data");
                        }
                    }
                } catch (Exception e) {
                    System.out.println("❌ Error processing multipart request manually: " + e.getMessage());
                    e.printStackTrace();
                }
            }

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

            // The handler bypasses Spring Security's filter chain, so we must invoke the JWT
            // filter manually here to populate SecurityContextHolder before @PreAuthorize runs.
            if (jwtAuthenticationFilter != null) {
                try {
                    jwtAuthenticationFilter.doFilter(servletRequest, servletResponse, (req, res) -> { /* no-op */ });
                } catch (Exception e) {
                    System.err.println("Error invoking JWT filter manually: " + e.getMessage());
                }
            }

            Object result;
            try {
                // Execute the handler
                result = handlerAdapter.handle(servletRequest, servletResponse, handler);
                System.out.println("Handler executed successfully, result: " + result);
            } finally {
                // Clear SecurityContext to avoid leaking auth between Lambda invocations on the same warm container
                SecurityContextHolder.clearContext();
            }

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
