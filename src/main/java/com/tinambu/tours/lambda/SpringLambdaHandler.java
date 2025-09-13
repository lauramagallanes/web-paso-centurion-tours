package com.tinambu.tours.lambda;

import org.springframework.cloud.function.adapter.aws.SpringBootRequestHandler;

/**
 * AWS Lambda Handler using Spring Cloud Function
 * This handler integrates Spring Boot with AWS Lambda automatically
 */
public class SpringLambdaHandler extends SpringBootRequestHandler<Object, Object> {
    // Spring Cloud Function handles all the integration automatically
    // No need to implement any methods - the parent class handles everything
}