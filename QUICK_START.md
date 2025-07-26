# 🚀 MintraTrade Quick Start Guide

Get MintraTrade running on your local machine in just a few minutes!

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Install guide](https://docs.mongodb.com/manual/installation/)
- **Git** - [Download here](https://git-scm.com/)

Optional but recommended:
- **Redis** (for caching) - [Install guide](https://redis.io/download)
- **Docker** (for containerized deployment) - [Download here](https://www.docker.com/)

## 🏃‍♂️ Quick Setup (3 steps)

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd mintratrade

# Make deployment script executable
chmod +x deploy.sh

# Run full setup (installs dependencies and sets up environment)
./deploy.sh full
```

### 2. Configure Environment

The script will create `server/.env` for you. Edit it with your settings:

```bash
# Edit environment variables
nano server/.env
```

**Minimum required configuration:**
```env
MONGODB_URI=mongodb://localhost:27017/mintratrade
JWT_SECRET=your_super_secret_jwt_key_here
OPENAI_API_KEY=your_openai_api_key_here  # For AI chatbot
```

### 3. Start Development

```bash
# Start both frontend and backend
npm run dev
```

**That's it!** 🎉

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🐳 Docker Setup (Alternative)

If you prefer Docker:

```bash
# Start with Docker Compose
./deploy.sh docker

# Or manually
docker-compose up -d
```

## 🔧 Manual Setup (Step by Step)

If you want to set up manually:

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Backend dependencies
cd server && npm install && cd ..

# Frontend dependencies
cd client && npm install && cd ..
```

### 2. Environment Setup

```bash
# Copy environment template
cp server/.env.example server/.env

# Edit the environment file
nano server/.env
```

### 3. Start Services

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start backend
cd server && npm run dev

# Terminal 3: Start frontend
cd client && npm start
```

## 🔑 Essential Environment Variables

### Required for Basic Functionality
```env
MONGODB_URI=mongodb://localhost:27017/mintratrade
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:3000
```

### Required for AI Features
```env
OPENAI_API_KEY=your_openai_api_key
```

### Required for Payments
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# Razorpay (for Indian market)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### Required for Email
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 🎯 Quick Test

Once everything is running:

1. **Open** http://localhost:3000
2. **Register** a new account
3. **Click** the AI chatbot button (bottom right)
4. **Type** "Hello" to test the AI assistant
5. **Browse** products or create a seller account

## 🚨 Common Issues & Solutions

### Port Already in Use
```bash
# Kill processes on ports 3000 and 5000
npx kill-port 3000 5000
```

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
sudo systemctl start mongod

# Or start manually
mongod --dbpath /path/to/your/data
```

### NPM Install Errors
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### AI Chatbot Not Working
- Check if `OPENAI_API_KEY` is set in `server/.env`
- Ensure you have OpenAI API credits
- Check backend logs for API errors

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start both frontend and backend
npm run server       # Start backend only
npm run client       # Start frontend only

# Build and deploy
npm run build        # Build for production
./deploy.sh production # Deploy to production

# Using deployment script
./deploy.sh install  # Install dependencies only
./deploy.sh setup    # Setup environment only
./deploy.sh docker   # Deploy with Docker
./deploy.sh help     # Show all options
```

## 🔧 Development Tools

### Database Management
```bash
# MongoDB shell
mongo mintratrade

# View collections
show collections

# View users
db.users.find().pretty()
```

### API Testing
- Backend health check: http://localhost:5000/api/health
- Chatbot features: http://localhost:5000/api/chatbot/features

### Debug Mode
```bash
# Backend with debug logs
cd server && DEBUG=* npm run dev

# Frontend with React dev tools
cd client && REACT_APP_DEBUG=true npm start
```

## 🌐 Production Deployment

### Environment Setup
```bash
# Set production environment
export NODE_ENV=production

# Build frontend
cd client && npm run build

# Start with PM2 (recommended)
npm install -g pm2
cd server && pm2 start ecosystem.config.js
```

### Domain Configuration
1. Point domain to your server
2. Set up SSL certificate (Let's Encrypt recommended)
3. Configure reverse proxy (Nginx)
4. Update `CLIENT_URL` in environment variables

## 📚 Next Steps

- **Customize**: Modify colors, branding, and features
- **Deploy**: Follow production deployment guide
- **Scale**: Add Redis caching and load balancing
- **Integrate**: Connect additional payment gateways
- **Extend**: Add more AI features and integrations

## 🆘 Need Help?

- **Documentation**: See main [README.md](README.md)
- **Issues**: Check GitHub issues
- **Community**: Join our Discord server
- **Support**: Email support@mintratrade.com

---

**Happy coding!** 🎉 Built with ❤️ by the MintraTrade Team