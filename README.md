# 🛍️ MintraTrade - Global E-Commerce Platform

MintraTrade is a comprehensive, AI-powered e-commerce platform that enables users to buy and sell products globally. Built with modern web technologies, it features advanced AI assistance, multi-language support, multiple payment gateways, and a user-friendly interface.

## ✨ Features

### 🔥 Core Features
- **Global Marketplace** - Buy and sell products worldwide
- **AI-Powered Chatbot** - 24/7 customer support with OpenAI integration
- **Multi-Language Support** - Available in 12+ languages
- **Multiple Payment Options** - Stripe, PayPal, Razorpay, and Cash on Delivery
- **Real-time Notifications** - Socket.IO powered live updates
- **Advanced Search & Filters** - AI-enhanced product discovery
- **Responsive Design** - Works perfectly on all devices

### 👥 User Types
- **Buyers** - Browse, purchase, track orders, manage wishlist
- **Sellers** - Create stores, manage inventory, track sales analytics
- **Admins** - Platform management, user verification, analytics

### 🤖 AI Features
- **Smart Product Recommendations** - Personalized suggestions
- **Automated Customer Support** - Handle common queries instantly
- **Product Tag Generation** - AI-powered SEO optimization
- **Voice Search** - Speech-to-text product search
- **Real-time Translation** - Communicate in any language

### 💳 Payment Integration
- **Stripe** - Global credit/debit card processing
- **PayPal** - Worldwide digital payments
- **Razorpay** - Optimized for Indian market
- **Cash on Delivery** - Traditional payment option

### 📱 Modern UI/UX
- **Material-UI Design** - Beautiful, consistent interface
- **Dark/Light Themes** - User preference support
- **Progressive Web App** - App-like experience
- **Accessibility** - WCAG compliant design
- **Animation** - Smooth, engaging interactions

## 🏗️ Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time communication
- **OpenAI** - AI-powered features
- **JWT** - Authentication
- **Cloudinary** - Image storage
- **Redis** - Caching and sessions

### Frontend
- **React.js** - User interface library
- **Redux Toolkit** - State management
- **Material-UI** - Component library
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Framer Motion** - Animations
- **i18next** - Internationalization
- **Axios** - HTTP client

### Infrastructure
- **Docker** - Containerization
- **Nginx** - Reverse proxy
- **PM2** - Process management
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/mintratrade.git
cd mintratrade
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install-all
```

3. **Environment Setup**
```bash
# Copy environment template
cp server/.env.example server/.env

# Edit the environment variables
nano server/.env
```

4. **Configure Environment Variables**
Required variables (see `.env.example` for full list):
```env
# Database
MONGODB_URI=mongodb://localhost:27017/mintratrade

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key

# OpenAI (for chatbot)
OPENAI_API_KEY=your_openai_api_key

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

5. **Start the Application**
```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or start individually
npm run server  # Backend only
npm run client  # Frontend only
```

6. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api/docs

## 📁 Project Structure

```
mintratrade/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   └── i18n/          # Internationalization
│   └── package.json
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── services/          # Business logic
│   ├── config/            # Configuration files
│   └── package.json
├── docs/                  # Documentation
├── docker-compose.yml     # Docker configuration
└── README.md
```

## 🔧 API Endpoints

### Authentication
```
POST /api/auth/register     # Register new user
POST /api/auth/login        # User login
GET  /api/auth/profile      # Get user profile
PUT  /api/auth/profile      # Update profile
POST /api/auth/logout       # Logout user
```

### Products
```
GET    /api/products        # Get all products
GET    /api/products/:id    # Get product by ID
POST   /api/products        # Create product (sellers only)
PUT    /api/products/:id    # Update product
DELETE /api/products/:id    # Delete product
```

### Orders
```
GET  /api/orders           # Get user orders
POST /api/orders           # Create new order
GET  /api/orders/:id       # Get order details
PUT  /api/orders/:id       # Update order status
```

### Chatbot
```
POST /api/chatbot/chat     # Send message to AI
GET  /api/chatbot/features # Get chatbot capabilities
POST /api/chatbot/translate # Translate text
```

### Payments
```
POST /api/payments/stripe  # Process Stripe payment
POST /api/payments/paypal  # Process PayPal payment
POST /api/payments/razorpay # Process Razorpay payment
```

## 🌐 Multi-Language Support

MintraTrade supports the following languages:
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)
- Arabic (ar)
- Hindi (hi)
- Russian (ru)

### Adding New Languages
1. Add translation files in `client/src/i18n/locales/`
2. Update language list in `client/src/i18n/config.js`
3. Add language option in the UI

## 🤖 AI Chatbot Features

The AI-powered chatbot can help with:
- Product search and recommendations
- Order tracking and status updates
- Customer support queries
- Seller assistance and guidance
- Multi-language communication
- Voice input/output support

### Chatbot Commands
- "Show me laptops under $1000"
- "Track my order MT24010001"
- "What's your return policy?"
- "Help me set up my store"
- "Recommend products for me"

## 💰 Payment Integration

### Stripe Integration
```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
```

### PayPal Integration
```javascript
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
```

### Razorpay Integration
```javascript
const options = {
  key: process.env.REACT_APP_RAZORPAY_KEY_ID,
  amount: amount * 100, // Amount in paise
  currency: "INR",
};
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt encryption
- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Sanitize user inputs
- **CORS Protection** - Cross-origin security
- **Helmet.js** - Security headers
- **MongoDB Injection Prevention** - Query sanitization

## 📊 Analytics & Monitoring

### Seller Analytics
- Sales performance tracking
- Revenue analytics
- Product performance metrics
- Customer insights
- Inventory management

### Admin Analytics
- Platform-wide statistics
- User engagement metrics
- Revenue tracking
- Performance monitoring

## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Configuration
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
      - "5000:5000"
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb
      - redis

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (Nginx)
5. Set up monitoring (PM2, New Relic)

### Build Commands
```bash
# Build frontend
cd client && npm run build

# Start production server
cd server && npm start
```

## 🧪 Testing

### Running Tests
```bash
# Frontend tests
cd client && npm test

# Backend tests
cd server && npm test

# E2E tests
npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write comprehensive tests
- Update documentation
- Follow semantic commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/api.md)
- [Frontend Guide](docs/frontend.md)
- [Backend Guide](docs/backend.md)
- [Deployment Guide](docs/deployment.md)

### Community
- [Discord Server](https://discord.gg/mintratrade)
- [GitHub Discussions](https://github.com/yourusername/mintratrade/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/mintratrade)

### Contact
- Email: support@mintratrade.com
- Website: https://mintratrade.com
- Twitter: [@MintraTrade](https://twitter.com/mintratrade)

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Frontend framework
- [Node.js](https://nodejs.org/) - Backend runtime
- [MongoDB](https://www.mongodb.com/) - Database
- [OpenAI](https://openai.com/) - AI services
- [Material-UI](https://mui.com/) - UI components
- [Stripe](https://stripe.com/) - Payment processing

---

⭐ **Star this repository if you find it helpful!**

Built with ❤️ by the MintraTrade Team