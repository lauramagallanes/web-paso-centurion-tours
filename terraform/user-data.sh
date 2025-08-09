#!/bin/bash

# User Data Script for Paso Centurión Tours EC2 Instance
# This script runs automatically when the EC2 instance starts

set -e

# Variables from Terraform template
S3_BUCKET="${s3_bucket}"
REGION="${region}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a /var/log/user-data.log
}

log "Starting EC2 instance setup for Paso Centurión Tours"

# Update system
log "Updating system packages..."
yum update -y

# Install basic packages
log "Installing basic packages..."
yum install -y wget curl unzip git htop iotop tree jq

# Install Java 17
log "Installing Java 17..."
yum install -y java-17-amazon-corretto-headless

# Install Node.js 18
log "Installing Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install Nginx
log "Installing and configuring Nginx..."
yum install -y nginx

# Install AWS CLI v2
log "Installing AWS CLI..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Configure AWS CLI region
aws configure set default.region $REGION

# Install CloudWatch agent
log "Installing CloudWatch agent..."
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
rm -f amazon-cloudwatch-agent.rpm

# Create application directories
log "Setting up application directories..."
mkdir -p /var/www/paso-centurion-tours
mkdir -p /var/backups/paso-centurion-tours
mkdir -p /var/log/paso-centurion-tours
mkdir -p /opt/paso-centurion-tours

# Set ownership
chown -R nginx:nginx /var/www/paso-centurion-tours
chown -R nginx:nginx /var/log/paso-centurion-tours

# Configure Nginx
log "Configuring Nginx..."
cat > /etc/nginx/conf.d/paso-centurion-tours.conf << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root /var/www/paso-centurion-tours;
    index index.html index.htm;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # Static assets with longer cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Custom error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# Remove default Nginx config
rm -f /etc/nginx/conf.d/default.conf

# Configure firewall
log "Configuring firewall..."
yum install -y firewalld
systemctl start firewalld
systemctl enable firewalld

# Allow HTTP, HTTPS, and SSH
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --reload

# Setup log rotation
log "Setting up log rotation..."
cat > /etc/logrotate.d/paso-centurion-tours << 'EOF'
/var/log/paso-centurion-tours/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
        systemctl reload paso-centurion-tours > /dev/null 2>&1 || true
    endscript
}

/var/log/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
EOF

# Create initial index.html
log "Creating initial application page..."
cat > /var/www/paso-centurion-tours/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🦅 Paso Centurión Tours - Deployment Ready</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 600px;
            margin: 20px;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
        }
        
        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .status {
            color: #4ade80;
            font-weight: bold;
            font-size: 1.2em;
            margin-bottom: 20px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .info-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .info-card h3 {
            margin-bottom: 10px;
            color: #fbbf24;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .loading {
            color: #fbbf24;
        }
        
        @media (max-width: 768px) {
            .container {
                margin: 10px;
                padding: 20px;
            }
            
            h1 {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🦅 Paso Centurión Tours</h1>
        <p class="status">✅ Infrastructure Ready for Deployment</p>
        <p>Your AWS infrastructure is configured and ready to receive deployments from GitHub Actions.</p>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>🏗️ Infrastructure</h3>
                <p>Terraform deployed</p>
                <p>EC2 + RDS + S3</p>
            </div>
            
            <div class="info-card">
                <h3>🚀 Services</h3>
                <p>Nginx: <span class="status">Running</span></p>
                <p>Java 17: <span class="status">Ready</span></p>
            </div>
            
            <div class="info-card">
                <h3>📊 Instance Info</h3>
                <p><strong>Instance ID:</strong> <span id="instance-id" class="loading">Loading...</span></p>
                <p><strong>Region:</strong> <span id="region" class="loading">Loading...</span></p>
            </div>
            
            <div class="info-card">
                <h3>⏰ Deployment</h3>
                <p><strong>Ready:</strong> <span id="timestamp"></span></p>
                <p><strong>Status:</strong> <span class="status">Awaiting Code</span></p>
            </div>
        </div>
        
        <div class="footer">
            <p>🔧 Managed by Terraform | 🚀 Deployed via GitHub Actions</p>
            <p>Ready for React frontend + Spring Boot backend</p>
        </div>
    </div>
    
    <script>
        // Set timestamp
        document.getElementById('timestamp').textContent = new Date().toLocaleString();
        
        // Try to get instance metadata
        const fetchMetadata = async (path, elementId) => {
            try {
                const response = await fetch(`http://169.254.169.254/latest/meta-data/${path}`, {
                    timeout: 2000
                });
                if (response.ok) {
                    const data = await response.text();
                    document.getElementById(elementId).textContent = data;
                } else {
                    document.getElementById(elementId).textContent = 'Not available';
                }
            } catch (error) {
                document.getElementById(elementId).textContent = 'Not available';
            }
        };
        
        fetchMetadata('instance-id', 'instance-id');
        fetchMetadata('placement/region', 'region');
    </script>
</body>
</html>
EOF

chown nginx:nginx /var/www/paso-centurion-tours/index.html

# Start and enable services
log "Starting services..."
systemctl start nginx
systemctl enable nginx

# Create systemd service template for the backend (will be used during deployment)
log "Creating backend service template..."
cat > /etc/systemd/system/paso-centurion-tours.service << 'EOF'
[Unit]
Description=Paso Centurión Tours Backend Application
After=network.target

[Service]
Type=simple
User=nginx
Group=nginx
WorkingDirectory=/var/www/paso-centurion-tours
ExecStart=/usr/bin/java -jar /var/www/paso-centurion-tours/app.jar
Restart=always
RestartSec=10

# Environment variables
Environment=SPRING_PROFILES_ACTIVE=production
Environment=SERVER_PORT=8080

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=paso-centurion-tours

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/www/paso-centurion-tours /var/log/paso-centurion-tours /tmp

[Install]
WantedBy=multi-user.target
EOF

# Create deployment script
log "Creating deployment script..."
cat > /opt/paso-centurion-tours/deploy.sh << 'EOF'
#!/bin/bash
# This script will be called by GitHub Actions for deployments
set -e

DEPLOY_DIR="/var/www/paso-centurion-tours"
BACKUP_DIR="/var/backups/paso-centurion-tours"
SERVICE_NAME="paso-centurion-tours"

# Create backup
if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR)" ]; then
    BACKUP_NAME="backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r "$DEPLOY_DIR" "$BACKUP_DIR/$BACKUP_NAME"
    echo "Backup created: $BACKUP_DIR/$BACKUP_NAME"
fi

# Stop backend service if running
systemctl stop $SERVICE_NAME 2>/dev/null || true

# Deploy new version (files should be in /tmp/deployment/)
if [ -d "/tmp/deployment" ]; then
    cp -r /tmp/deployment/* $DEPLOY_DIR/
    chown -R nginx:nginx $DEPLOY_DIR
    chmod -R 755 $DEPLOY_DIR
    
    # If backend JAR exists, start the service
    if [ -f "$DEPLOY_DIR/app.jar" ]; then
        chmod +x "$DEPLOY_DIR/app.jar"
        systemctl daemon-reload
        systemctl enable $SERVICE_NAME
        systemctl start $SERVICE_NAME
    fi
fi

# Restart Nginx
systemctl restart nginx

echo "Deployment completed successfully"
EOF

chmod +x /opt/paso-centurion-tours/deploy.sh

# Setup CloudWatch agent configuration
log "Configuring CloudWatch agent..."
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "agent": {
        "metrics_collection_interval": 60,
        "run_as_user": "cwagent"
    },
    "metrics": {
        "namespace": "PasoCenturionTours/EC2",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "paso-centurion-tours/nginx/access",
                        "log_stream_name": "{instance_id}"
                    },
                    {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "paso-centurion-tours/nginx/error",
                        "log_stream_name": "{instance_id}"
                    },
                    {
                        "file_path": "/var/log/paso-centurion-tours/*.log",
                        "log_group_name": "paso-centurion-tours/application",
                        "log_stream_name": "{instance_id}"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent

# Final status check
log "Performing final status check..."
systemctl status nginx
systemctl status firewalld

# Create success marker
echo "$(date): EC2 setup completed successfully" > /var/log/setup-complete.log

log "EC2 instance setup completed successfully!"
log "Instance is ready for deployments from GitHub Actions"
log "Access the application at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
