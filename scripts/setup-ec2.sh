#!/bin/bash

# EC2 Initial Setup Script for Paso Centurión Tours
# Run this script on your EC2 instance to prepare it for deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Update system
update_system() {
    log "Updating system packages..."
    
    yum update -y
    yum install -y wget curl unzip git
    
    success "System updated successfully"
}

# Install Java 17
install_java() {
    log "Installing Java 17..."
    
    yum install -y java-17-amazon-corretto-headless
    
    # Verify installation
    java -version
    
    success "Java 17 installed successfully"
}

# Install Nginx
install_nginx() {
    log "Installing Nginx..."
    
    yum install -y nginx
    
    # Start and enable nginx
    systemctl start nginx
    systemctl enable nginx
    
    success "Nginx installed and started successfully"
}

# Install Node.js (for potential frontend builds on server)
install_nodejs() {
    log "Installing Node.js..."
    
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
    
    # Verify installation
    node --version
    npm --version
    
    success "Node.js installed successfully"
}

# Configure firewall
configure_firewall() {
    log "Configuring firewall..."
    
    # Allow HTTP and HTTPS traffic
    yum install -y firewalld
    systemctl start firewalld
    systemctl enable firewalld
    
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --permanent --add-port=8080/tcp
    firewall-cmd --reload
    
    success "Firewall configured successfully"
}

# Setup application user and directories
setup_app_structure() {
    log "Setting up application structure..."
    
    # Create application directories
    mkdir -p /var/www/paso-centurion-tours
    mkdir -p /var/backups/paso-centurion-tours
    mkdir -p /var/log/paso-centurion-tours
    
    # Set ownership
    chown -R www-data:www-data /var/www/paso-centurion-tours
    chown -R www-data:www-data /var/log/paso-centurion-tours
    
    success "Application structure created successfully"
}

# Install AWS CLI
install_aws_cli() {
    log "Installing AWS CLI..."
    
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install
    rm -rf aws awscliv2.zip
    
    # Verify installation
    aws --version
    
    success "AWS CLI installed successfully"
}

# Setup log rotation
setup_log_rotation() {
    log "Setting up log rotation..."
    
    cat > /etc/logrotate.d/paso-centurion-tours << EOF
/var/log/paso-centurion-tours/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
        systemctl reload paso-centurion-tours > /dev/null 2>&1 || true
    endscript
}
EOF
    
    success "Log rotation configured successfully"
}

# Install monitoring tools
install_monitoring() {
    log "Installing monitoring tools..."
    
    yum install -y htop iotop netstat-nat
    
    success "Monitoring tools installed successfully"
}

# Setup SSH security
secure_ssh() {
    log "Securing SSH configuration..."
    
    # Backup original config
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Basic SSH hardening
    sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    
    # Restart SSH service
    systemctl restart sshd
    
    success "SSH secured successfully"
}

# Create deployment user
create_deployment_user() {
    log "Creating deployment user..."
    
    # Create user if not exists
    if ! id "deploy" &>/dev/null; then
        useradd -m -s /bin/bash deploy
        usermod -aG wheel deploy
        
        # Setup SSH directory
        mkdir -p /home/deploy/.ssh
        chmod 700 /home/deploy/.ssh
        chown deploy:deploy /home/deploy/.ssh
        
        success "Deployment user created successfully"
    else
        warning "Deployment user already exists"
    fi
}

# Setup environment variables
setup_environment() {
    log "Setting up environment variables..."
    
    cat > /etc/environment << EOF
# Paso Centurión Tours Environment Variables
JAVA_HOME=/usr/lib/jvm/java-17-amazon-corretto
PATH=$PATH:/usr/lib/jvm/java-17-amazon-corretto/bin
NODE_ENV=production
SPRING_PROFILES_ACTIVE=production
EOF
    
    success "Environment variables configured successfully"
}

# Main setup process
main() {
    log "Starting EC2 setup for Paso Centurión Tours..."
    
    update_system
    install_java
    install_nginx
    install_nodejs
    configure_firewall
    setup_app_structure
    install_aws_cli
    setup_log_rotation
    install_monitoring
    secure_ssh
    create_deployment_user
    setup_environment
    
    success "EC2 setup completed successfully!"
    log "Your EC2 instance is now ready for deployments"
    log "Public IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
    log "Next steps:"
    log "1. Add your SSH public key to ~/.ssh/authorized_keys"
    log "2. Configure GitHub Actions secrets"
    log "3. Deploy your application"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root"
    exit 1
fi

main
