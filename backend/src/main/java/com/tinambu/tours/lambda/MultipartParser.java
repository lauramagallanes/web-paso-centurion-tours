package com.tinambu.tours.lambda;

import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Binary-safe multipart parser for Lambda environment
 * CRITICAL: Does NOT convert binary data to String to prevent corruption
 */
public class MultipartParser {
    
    public static List<MultipartFile> parseMultipartData(byte[] data, String boundary) {
        List<MultipartFile> files = new ArrayList<>();
        
        try {
            byte[] boundaryBytes = ("--" + boundary).getBytes(StandardCharsets.UTF_8);
            
            List<byte[]> parts = splitByBoundary(data, boundaryBytes);
            
            System.out.println("🔍 Found " + parts.size() + " parts in multipart data");
            
            for (byte[] part : parts) {
                if (part.length == 0) {
                    continue;
                }
                
                MultipartFile file = parsePartBinary(part);
                if (file != null) {
                    files.add(file);
                }
            }
        } catch (Exception e) {
            System.out.println("❌ Error parsing multipart data: " + e.getMessage());
            e.printStackTrace();
        }
        
        return files;
    }
    
    /**
     * Split byte array by boundary WITHOUT converting to String
     */
    private static List<byte[]> splitByBoundary(byte[] data, byte[] boundary) {
        List<byte[]> parts = new ArrayList<>();
        int start = 0;
        
        while (start < data.length) {
            int boundaryIndex = indexOf(data, boundary, start);
            if (boundaryIndex == -1) {
                break;
            }
            
            // Skip the boundary itself for the first part
            if (start == 0) {
                start = boundaryIndex + boundary.length;
                // Skip \r\n after boundary
                if (start + 2 <= data.length && data[start] == '\r' && data[start + 1] == '\n') {
                    start += 2;
                }
                continue;
            }
            
            // Extract part between previous position and current boundary
            int end = boundaryIndex;
            // Remove trailing \r\n before boundary
            if (end >= 2 && data[end - 2] == '\r' && data[end - 1] == '\n') {
                end -= 2;
            }
            
            byte[] part = new byte[end - start];
            System.arraycopy(data, start, part, 0, part.length);
            parts.add(part);
            
            // Move start position past boundary
            start = boundaryIndex + boundary.length;
            // Skip \r\n after boundary
            if (start + 2 <= data.length && data[start] == '\r' && data[start + 1] == '\n') {
                start += 2;
            }
        }
        
        return parts;
    }
    
    /**
     * Find index of pattern in data (like indexOf for byte arrays)
     */
    private static int indexOf(byte[] data, byte[] pattern, int start) {
        if (pattern.length == 0 || start + pattern.length > data.length) {
            return -1;
        }
        
        for (int i = start; i <= data.length - pattern.length; i++) {
            boolean found = true;
            for (int j = 0; j < pattern.length; j++) {
                if (data[i + j] != pattern[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return i;
            }
        }
        return -1;
    }
    
    /**
     * Parse a single part maintaining binary safety
     */
    private static MultipartFile parsePartBinary(byte[] part) {
        try {
            // Find the double CRLF that separates headers from content
            byte[] doubleCrLf = "\r\n\r\n".getBytes(StandardCharsets.UTF_8);
            int headerEnd = indexOf(part, doubleCrLf, 0);
            
            if (headerEnd == -1) {
                System.out.println("⚠️ No header separator found in part");
                return null;
            }
            
            // Extract headers as String (they are always ASCII/UTF-8)
            byte[] headerBytes = new byte[headerEnd];
            System.arraycopy(part, 0, headerBytes, 0, headerEnd);
            String headers = new String(headerBytes, StandardCharsets.UTF_8);
            
            // Extract content as BINARY (do NOT convert to String!)
            int contentStart = headerEnd + doubleCrLf.length;
            int contentLength = part.length - contentStart;
            byte[] contentBytes = new byte[contentLength];
            System.arraycopy(part, contentStart, contentBytes, 0, contentLength);
            
            // Parse headers
            String name = null;
            String filename = null;
            String contentType = "application/octet-stream";
            
            String[] headerLines = headers.split("\r\n");
            for (String headerLine : headerLines) {
                if (headerLine.startsWith("Content-Disposition:")) {
                    // Extract name
                    if (headerLine.contains("name=\"")) {
                        int nameStart = headerLine.indexOf("name=\"") + 6;
                        int nameEnd = headerLine.indexOf("\"", nameStart);
                        if (nameEnd > nameStart) {
                            name = headerLine.substring(nameStart, nameEnd);
                        }
                    }
                    // Extract filename
                    if (headerLine.contains("filename=\"")) {
                        int filenameStart = headerLine.indexOf("filename=\"") + 10;
                        int filenameEnd = headerLine.indexOf("\"", filenameStart);
                        if (filenameEnd > filenameStart) {
                            filename = headerLine.substring(filenameStart, filenameEnd);
                        }
                    }
                } else if (headerLine.startsWith("Content-Type:")) {
                    contentType = headerLine.substring(13).trim();
                }
            }
            
            // Only process file uploads
            if ("files".equals(name) && filename != null && !filename.isEmpty()) {
                System.out.println("📁 Parsed file (BINARY): " + filename + 
                    " (size: " + contentBytes.length + " bytes, type: " + contentType + ")");
                
                // Log first few bytes to verify binary integrity
                if (contentBytes.length >= 4) {
                    System.out.printf("🔍 First 4 bytes: %02x %02x %02x %02x%n",
                        contentBytes[0], contentBytes[1], contentBytes[2], contentBytes[3]);
                }
                
                return new LambdaMultipartFile(name, filename, contentType, contentBytes);
            }
            
        } catch (Exception e) {
            System.out.println("❌ Error parsing multipart part: " + e.getMessage());
            e.printStackTrace();
        }
        
        return null;
    }
}
