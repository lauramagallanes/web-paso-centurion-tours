package com.tinambu.tours.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class PlacetoPayConfig {

    @Value("${placetopay.login:}")
    private String login;

    @Value("${placetopay.secret:}")
    private String secretKey;

    @Value("${placetopay.base-url:https://checkout-test.placetopay.com}")
    private String baseUrl;

    @Value("${placetopay.return-url:http://localhost:5173/pago/resultado}")
    private String returnUrl;

    @Value("${placetopay.cancel-url:http://localhost:5173/pago/cancelado}")
    private String cancelUrl;

    @Value("${placetopay.notification-url:}")
    private String notificationUrl;

    @Value("${placetopay.currency:UYU}")
    private String currency;

    @Bean(name = "placetoPayRestTemplate")
    public RestTemplate placetoPayRestTemplate() {
        return new RestTemplate();
    }

    public String getLogin() { return login; }
    public String getSecretKey() { return secretKey; }
    public String getBaseUrl() { return baseUrl; }
    public String getReturnUrl() { return returnUrl; }
    public String getCancelUrl() { return cancelUrl; }
    public String getNotificationUrl() { return notificationUrl; }
    public String getCurrency() { return currency; }

    public boolean isConfigured() {
        return login != null && !login.isEmpty() 
            && secretKey != null && !secretKey.isEmpty();
    }
}
