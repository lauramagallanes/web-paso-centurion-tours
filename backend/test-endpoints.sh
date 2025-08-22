#!/bin/bash

# Script para probar endpoints localmente
# Uso: ./test-endpoints.sh

API_BASE="https://53dmek6dqk.execute-api.us-east-1.amazonaws.com"

echo "=== 🧪 TESTING ENDPOINTS ==="
echo "API Base: $API_BASE"
echo ""

# Test basic endpoints
echo "📋 Testing Basic Endpoints:"
echo "1. Testing /basic..."
curl -s -X GET "$API_BASE/basic" | jq -r '.' 2>/dev/null || curl -s -X GET "$API_BASE/basic"
echo -e "\n"

echo "2. Testing /simple..."
curl -s -X GET "$API_BASE/simple" | jq -r '.' 2>/dev/null || curl -s -X GET "$API_BASE/simple"
echo -e "\n"

echo "3. Testing /ping..."
curl -s -X GET "$API_BASE/ping" | jq -r '.' 2>/dev/null || curl -s -X GET "$API_BASE/ping"
echo -e "\n"

# Test auth endpoints (should fail until JAR is uploaded)
echo "🔐 Testing Auth Endpoints (may fail until JAR is uploaded):"
echo "4. Testing /auth/info..."
curl -s -X GET "$API_BASE/auth/info" | jq -r '.' 2>/dev/null || curl -s -X GET "$API_BASE/auth/info"
echo -e "\n"

echo "5. Testing /auth/login (POST with JSON)..."
curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' | jq -r '.' 2>/dev/null || \
curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
echo -e "\n"

echo "6. Testing /auth/signup (POST with JSON)..."
curl -s -X POST "$API_BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"newpass123","name":"New User"}' | jq -r '.' 2>/dev/null || \
curl -s -X POST "$API_BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"newpass123","name":"New User"}'
echo -e "\n"

echo "7. Testing /auth/validate (with mock token)..."
curl -s -X GET "$API_BASE/auth/validate" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.mock-signature" | jq -r '.' 2>/dev/null || \
curl -s -X GET "$API_BASE/auth/validate" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.mock-signature"
echo -e "\n"

# Test database endpoints (should fail in lambda-no-db profile)
echo "🗄️ Testing Database Endpoints (should fail in lambda-no-db profile):"
echo "8. Testing /database/info..."
curl -s -X GET "$API_BASE/database/info" | jq -r '.' 2>/dev/null || curl -s -X GET "$API_BASE/database/info"
echo -e "\n"

echo "9. Testing /database/test..."
curl -s -X GET "$API_BASE/database/test" | jq -r '.' 2>/dev/null || curl -s -X GET "$API_BASE/database/test"
echo -e "\n"

echo "=== ✅ ENDPOINT TESTING COMPLETED ==="

