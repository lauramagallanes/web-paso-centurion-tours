package com.tinambu.tours.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ssm.SsmClient;
import software.amazon.awssdk.services.ssm.model.GetParameterRequest;
import software.amazon.awssdk.services.ssm.model.GetParameterResponse;

/**
 * Configuración para AWS Parameter Store
 * Maneja la obtención de parámetros sensibles como contraseñas y secrets
 */
@Configuration
@Profile("lambda")
public class AwsParameterStoreConfig {

    @Value("${SSM_DB_PASSWORD}")
    private String dbPasswordParameterName;
    
    @Value("${SSM_JWT_SECRET}")
    private String jwtSecretParameterName;
    
    @Value("${SSM_P2P_LOGIN}")
    private String p2pLoginParameterName;
    
    @Value("${SSM_P2P_SECRET_KEY}")
    private String p2pSecretKeyParameterName;
    
    @Value("${APP_REGION:us-east-1}")
    private String region;

    private SsmClient ssmClient;

    /**
     * Inicializa el cliente SSM
     */
    private SsmClient getSsmClient() {
        if (ssmClient == null) {
            ssmClient = SsmClient.builder()
                    .region(Region.of(region))
                    .build();
        }
        return ssmClient;
    }

    /**
     * Obtiene un parámetro desde SSM Parameter Store
     */
    private String getParameterValue(String parameterName) {
        try {
            GetParameterRequest request = GetParameterRequest.builder()
                    .name(parameterName)
                    .withDecryption(true)
                    .build();

            GetParameterResponse response = getSsmClient().getParameter(request);
            return response.parameter().value();
        } catch (Exception e) {
            throw new RuntimeException("Error obteniendo parámetro SSM: " + parameterName, e);
        }
    }

    /**
     * Bean para la contraseña de la base de datos
     */
    @Bean("databasePassword")
    public String databasePassword() {
        return getParameterValue(dbPasswordParameterName);
    }

    /**
     * Bean para el JWT secret
     */
    @Bean("jwtSecret")
    public String jwtSecret() {
        return getParameterValue(jwtSecretParameterName);
    }

    /**
     * Bean para P2P login
     */
    @Bean("p2pLogin")
    public String p2pLogin() {
        return getParameterValue(p2pLoginParameterName);
    }

    /**
     * Bean para P2P secret key
     */
    @Bean("p2pSecretKey")
    public String p2pSecretKey() {
        return getParameterValue(p2pSecretKeyParameterName);
    }
}
