package com.tinambu.tours.dto.response;

/**
 * DTO de respuesta para autenticación JWT
 * Contiene los tokens y información del usuario autenticado
 */
public class JwtResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private UsuarioResponse usuario;

    // Constructors
    public JwtResponse() {}

    public JwtResponse(String accessToken, String refreshToken, String tokenType, UsuarioResponse usuario) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType;
        this.usuario = usuario;
    }

    // Getters and Setters
    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public UsuarioResponse getUsuario() { return usuario; }
    public void setUsuario(UsuarioResponse usuario) { this.usuario = usuario; }
}
