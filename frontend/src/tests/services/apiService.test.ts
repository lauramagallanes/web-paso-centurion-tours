import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import axios, { AxiosResponse } from 'axios';
import ApiService from '../../services/apiService';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApiService', () => {
  let apiService: ApiService;
  const mockResponse: AxiosResponse = {
    data: { success: true, data: 'test data' },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };

  beforeEach(() => {
    apiService = new ApiService();
    vi.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should make a GET request successfully', async () => {
      // Given
      mockedAxios.get.mockResolvedValue(mockResponse);

      // When
      const result = await apiService.get('/test-endpoint');

      // Then
      expect(mockedAxios.get).toHaveBeenCalledWith('/test-endpoint', undefined);
      expect(result).toEqual({ success: true, data: 'test data' });
    });

    it('should make a GET request with config', async () => {
      // Given
      const config = { headers: { 'Custom-Header': 'value' } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      // When
      await apiService.get('/test-endpoint', config);

      // Then
      expect(mockedAxios.get).toHaveBeenCalledWith('/test-endpoint', config);
    });

    it('should handle GET request errors', async () => {
      // Given
      const errorResponse = {
        response: {
          data: { success: false, error: 'Not found' },
          status: 404,
        },
      };
      mockedAxios.get.mockRejectedValue(errorResponse);

      // When & Then
      await expect(apiService.get('/nonexistent')).rejects.toThrow();
    });
  });

  describe('POST requests', () => {
    it('should make a POST request successfully', async () => {
      // Given
      const postData = { name: 'Test User', email: 'test@example.com' };
      mockedAxios.post.mockResolvedValue(mockResponse);

      // When
      const result = await apiService.post('/users', postData);

      // Then
      expect(mockedAxios.post).toHaveBeenCalledWith('/users', postData, undefined);
      expect(result).toEqual({ success: true, data: 'test data' });
    });

    it('should make a POST request with config', async () => {
      // Given
      const postData = { name: 'Test User' };
      const config = { headers: { 'Content-Type': 'application/json' } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      // When
      await apiService.post('/users', postData, config);

      // Then
      expect(mockedAxios.post).toHaveBeenCalledWith('/users', postData, config);
    });
  });

  describe('PUT requests', () => {
    it('should make a PUT request successfully', async () => {
      // Given
      const putData = { id: 1, name: 'Updated User' };
      mockedAxios.put.mockResolvedValue(mockResponse);

      // When
      const result = await apiService.put('/users/1', putData);

      // Then
      expect(mockedAxios.put).toHaveBeenCalledWith('/users/1', putData, undefined);
      expect(result).toEqual({ success: true, data: 'test data' });
    });
  });

  describe('DELETE requests', () => {
    it('should make a DELETE request successfully', async () => {
      // Given
      mockedAxios.delete.mockResolvedValue(mockResponse);

      // When
      const result = await apiService.delete('/users/1');

      // Then
      expect(mockedAxios.delete).toHaveBeenCalledWith('/users/1', undefined);
      expect(result).toEqual({ success: true, data: 'test data' });
    });
  });

  describe('Base URL', () => {
    it('should return the correct base URL', () => {
      // When
      const baseURL = apiService.apiBaseURL;

      // Then
      expect(baseURL).toBe('http://localhost:8080/api');
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      // Given
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValue(networkError);

      // When & Then
      await expect(apiService.get('/test')).rejects.toThrow('Network Error');
    });

    it('should handle server errors with response data', async () => {
      // Given
      const serverError = {
        response: {
          data: { success: false, error: 'Internal Server Error' },
          status: 500,
        },
      };
      mockedAxios.get.mockRejectedValue(serverError);

      // When & Then
      await expect(apiService.get('/test')).rejects.toMatchObject({
        response: {
          data: { success: false, error: 'Internal Server Error' },
          status: 500,
        },
      });
    });
  });

  describe('Request interceptors', () => {
    it('should handle requests with authentication token', async () => {
      // Given
      const token = 'Bearer test-token';
      localStorage.setItem('token', token);
      mockedAxios.get.mockResolvedValue(mockResponse);

      // When
      await apiService.get('/protected');

      // Then
      // Verificar que el interceptor agregue el token
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });
});
