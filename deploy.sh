#!/bin/bash

# MintraTrade Deployment Script
# This script helps deploy MintraTrade e-commerce platform

set -e  # Exit on any error

echo "🛍️  MintraTrade Deployment Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "${BLUE}📍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v16 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    print_success "Node.js $(node -v) is installed"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    print_success "npm $(npm -v) is installed"
    
    # Check MongoDB (optional)
    if command -v mongod &> /dev/null; then
        print_success "MongoDB is installed"
    else
        print_warning "MongoDB is not installed locally. Make sure you have a MongoDB connection string."
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        print_success "Docker is installed"
    else
        print_warning "Docker is not installed. Docker deployment will not be available."
    fi
}

# Install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    
    # Install root dependencies
    print_step "Installing root dependencies..."
    npm install
    
    # Install server dependencies
    print_step "Installing server dependencies..."
    cd server && npm install && cd ..
    
    # Install client dependencies
    print_step "Installing client dependencies..."
    cd client && npm install && cd ..
    
    print_success "All dependencies installed successfully!"
}

# Setup environment
setup_environment() {
    print_step "Setting up environment..."
    
    if [ ! -f "server/.env" ]; then
        print_step "Creating environment file..."
        cp server/.env.example server/.env
        print_warning "Please edit server/.env and configure your environment variables"
        print_warning "Required variables: MONGODB_URI, JWT_SECRET, OPENAI_API_KEY"
    else
        print_success "Environment file already exists"
    fi
}

# Build application
build_application() {
    print_step "Building application..."
    
    print_step "Building client..."
    cd client && npm run build && cd ..
    
    print_success "Application built successfully!"
}

# Start development server
start_development() {
    print_step "Starting development servers..."
    print_warning "Make sure MongoDB is running and environment variables are configured"
    
    echo ""
    echo "🚀 Starting MintraTrade in development mode..."
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:5000"
    echo ""
    echo "Press Ctrl+C to stop the servers"
    echo ""
    
    npm run dev
}

# Docker deployment
docker_deploy() {
    print_step "Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_step "Building and starting containers..."
    docker-compose up -d
    
    print_success "Application deployed with Docker!"
    echo ""
    echo "🌐 Access your application at:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:5000"
    echo "   MongoDB:  localhost:27017"
    echo "   Redis:    localhost:6379"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop:      docker-compose down"
}

# Production deployment
production_deploy() {
    print_step "Deploying for production..."
    
    # Build application
    build_application
    
    # Start with PM2 if available
    if command -v pm2 &> /dev/null; then
        print_step "Starting with PM2..."
        cd server && pm2 start ecosystem.config.js && cd ..
        print_success "Application started with PM2!"
    else
        print_step "Starting production server..."
        cd server && npm start &
        print_success "Production server started!"
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  install     Install all dependencies"
    echo "  setup       Setup environment files"
    echo "  dev         Start development servers"
    echo "  build       Build application for production"
    echo "  docker      Deploy with Docker"
    echo "  production  Deploy for production"
    echo "  full        Full setup (install + setup + dev)"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 full         # Complete setup and start development"
    echo "  $0 docker       # Deploy with Docker"
    echo "  $0 production   # Deploy for production"
}

# Main script logic
case "$1" in
    "install")
        check_prerequisites
        install_dependencies
        ;;
    "setup")
        setup_environment
        ;;
    "dev")
        check_prerequisites
        start_development
        ;;
    "build")
        check_prerequisites
        build_application
        ;;
    "docker")
        docker_deploy
        ;;
    "production")
        check_prerequisites
        production_deploy
        ;;
    "full")
        check_prerequisites
        install_dependencies
        setup_environment
        start_development
        ;;
    "help"|"")
        show_usage
        ;;
    *)
        print_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac