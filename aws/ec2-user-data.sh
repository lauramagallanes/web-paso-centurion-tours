#!/bin/bash

# EC2 User Data Script for Paso Centurión Tours
# This script runs automatically when the EC2 instance starts

yum update -y

# Install basic packages
yum install -y wget curl unzip git htop

# Install Java 17
yum install -y java-17-amazon-corretto-headless

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install Nginx
yum install -y nginx
systemctl start nginx
systemctl enable nginx

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Create application directories
mkdir -p /var/www/paso-centurion-tours
mkdir -p /var/backups/paso-centurion-tours
mkdir -p /var/log/paso-centurion-tours

# Set ownership
chown -R nginx:nginx /var/www/paso-centurion-tours
chown -R nginx:nginx /var/log/paso-centurion-tours

# Configure basic Nginx
cat > /etc/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 2048;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    server {
        listen       80 default_server;
        listen       [::]:80 default_server;
        server_name  _;
        root         /var/www/paso-centurion-tours;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api/ {
            proxy_pass http://localhost:8080/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        error_page   404              /404.html;
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   /usr/share/nginx/html;
        }
    }
}
EOF

# Restart nginx with new config
systemctl restart nginx

# Configure firewall
yum install -y firewalld
systemctl start firewalld
systemctl enable firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --reload

# Create a simple index.html for initial testing
cat > /var/www/paso-centurion-tours/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Paso Centurión Tours - Deployment Ready</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        .status { color: #28a745; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Paso Centurión Tours</h1>
        <p class="status">EC2 Instance Ready for Deployment</p>
        <p>Your server is configured and ready to receive deployments from GitHub Actions.</p>
        <hr>
        <p><strong>Instance ID:</strong> <span id="instance-id">Loading...</span></p>
        <p><strong>Region:</strong> <span id="region">Loading...</span></p>
        <p><strong>Timestamp:</strong> <span id="timestamp"></span></p>
    </div>
    
    <script>
        // Set timestamp
        document.getElementById('timestamp').textContent = new Date().toISOString();
        
        // Try to get instance metadata (may not work in all environments)
        fetch('http://169.254.169.254/latest/meta-data/instance-id')
            .then(response => response.text())
            .then(data => document.getElementById('instance-id').textContent = data)
            .catch(() => document.getElementById('instance-id').textContent = 'Not available');
            
        fetch('http://169.254.169.254/latest/meta-data/placement/region')
            .then(response => response.text())
            .then(data => document.getElementById('region').textContent = data)
            .catch(() => document.getElementById('region').textContent = 'Not available');
    </script>
</body>
</html>
EOF

chown nginx:nginx /var/www/paso-centurion-tours/index.html

# Log completion
echo "EC2 setup completed at $(date)" >> /var/log/setup.log
