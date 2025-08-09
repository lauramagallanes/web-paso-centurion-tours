#!/bin/bash

# Deployment script for Paso Centurión Tours
# This script handles deployment to AWS EC2

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="paso-centurion-tours"
DEPLOY_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
SERVICE_NAME="$APP_NAME"
FRONTEND_PORT="80"
BACKEND_PORT="8080"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
        exit 1
    fi
}

# Create necessary directories
setup_directories() {
    log "Setting up directories..."
    
    mkdir -p $DEPLOY_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p /var/log/$APP_NAME
    
    success "Directories created successfully"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    if [ -d "$DEPLOY_DIR" ]; then
        BACKUP_NAME="$APP_NAME-$(date +%Y%m%d_%H%M%S)"
        cp -r $DEPLOY_DIR "$BACKUP_DIR/$BACKUP_NAME"
        success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
        
        # Keep only last 5 backups
        cd $BACKUP_DIR
        ls -t | tail -n +6 | xargs -d '\n' rm -rf --
    else
        warning "No existing deployment found to backup"
    fi
}

# Stop services
stop_services() {
    log "Stopping services..."
    
    systemctl stop nginx || warning "Nginx not running or not installed"
    systemctl stop $SERVICE_NAME || warning "Backend service not running"
    
    success "Services stopped"
}

# Deploy frontend
deploy_frontend() {
    log "Deploying frontend..."
    
    if [ -d "/tmp/frontend-dist" ]; then
        cp -r /tmp/frontend-dist/* $DEPLOY_DIR/
        success "Frontend deployed successfully"
    else
        error "Frontend build not found in /tmp/frontend-dist"
        exit 1
    fi
}

# Deploy backend
deploy_backend() {
    log "Deploying backend..."
    
    if [ -f "/tmp/backend-jar/*.jar" ]; then
        cp /tmp/backend-jar/*.jar $DEPLOY_DIR/app.jar
        success "Backend JAR deployed successfully"
    else
        warning "Backend JAR not found, skipping backend deployment"
    fi
}

# Set permissions
set_permissions() {
    log "Setting permissions..."
    
    chown -R www-data:www-data $DEPLOY_DIR
    chmod -R 755 $DEPLOY_DIR
    
    if [ -f "$DEPLOY_DIR/app.jar" ]; then
        chmod +x $DEPLOY_DIR/app.jar
    fi
    
    success "Permissions set successfully"
}

# Configure Nginx
configure_nginx() {
    log "Configuring Nginx..."
    
    cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name _;
    root $DEPLOY_DIR;
    index index.html;

    # Frontend static files
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

    # Enable site
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    nginx -t
    
    success "Nginx configured successfully"
}

# Configure systemd service for backend
configure_backend_service() {
    if [ ! -f "$DEPLOY_DIR/app.jar" ]; then
        warning "Backend JAR not found, skipping service configuration"
        return
    fi
    
    log "Configuring backend service..."
    
    cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=Paso Centurión Tours Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$DEPLOY_DIR
ExecStart=/usr/bin/java -jar $DEPLOY_DIR/app.jar
Restart=always
RestartSec=10
Environment=SPRING_PROFILES_ACTIVE=production
Environment=SERVER_PORT=$BACKEND_PORT

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$DEPLOY_DIR /tmp

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    
    success "Backend service configured successfully"
}

# Start services
start_services() {
    log "Starting services..."
    
    systemctl start nginx
    systemctl enable nginx
    
    if [ -f "$DEPLOY_DIR/app.jar" ]; then
        systemctl start $SERVICE_NAME
        sleep 5
        
        # Check if backend is running
        if systemctl is-active --quiet $SERVICE_NAME; then
            success "Backend service started successfully"
        else
            error "Backend service failed to start"
            journalctl -u $SERVICE_NAME --no-pager -n 20
        fi
    fi
    
    success "Services started successfully"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check Nginx
    if curl -f http://localhost/health > /dev/null 2>&1; then
        success "Frontend health check passed"
    else
        error "Frontend health check failed"
    fi
    
    # Check backend if deployed
    if [ -f "$DEPLOY_DIR/app.jar" ]; then
        if curl -f http://localhost:$BACKEND_PORT/actuator/health > /dev/null 2>&1; then
            success "Backend health check passed"
        else
            warning "Backend health check failed or endpoint not available"
        fi
    fi
}

# Main deployment process
main() {
    log "Starting deployment of $APP_NAME..."
    
    check_permissions
    setup_directories
    backup_current
    stop_services
    deploy_frontend
    deploy_backend
    set_permissions
    configure_nginx
    configure_backend_service
    start_services
    health_check
    
    success "Deployment completed successfully!"
    log "Application is available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
}

# Rollback function
rollback() {
    log "Rolling back to previous deployment..."
    
    LATEST_BACKUP=$(ls -t $BACKUP_DIR | head -n 1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        error "No backup found for rollback"
        exit 1
    fi
    
    stop_services
    rm -rf $DEPLOY_DIR
    cp -r "$BACKUP_DIR/$LATEST_BACKUP" $DEPLOY_DIR
    set_permissions
    start_services
    
    success "Rollback completed successfully"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    *)
        echo "Usage: $0 [deploy|rollback]"
        exit 1
        ;;
esac
