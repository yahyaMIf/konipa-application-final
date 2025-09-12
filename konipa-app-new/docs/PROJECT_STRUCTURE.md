# Project Structure Documentation

## 📁 Directory Overview

### Root Level
```
konipa_application_finale_complete/
├── konipa-app-new/           # Main application directory
├── README.md                 # Project documentation
└── .gitignore               # Git ignore rules
```

### Main Application (`konipa-app-new/`)

#### Frontend (`frontend/` or root of konipa-app-new)
- **React 19** application with Vite
- **TypeScript** support
- **Tailwind CSS** for styling
- **Material-UI** components
- **React Router** for navigation
- **Axios** for API calls

#### Backend (`backend/`)
- **Node.js** with Express
- **Sequelize** ORM with PostgreSQL
- **JWT** authentication
- **Socket.IO** for real-time features
- **Multer** for file uploads
- **Winston** for logging

#### Documentation (`docs/`)
- Architecture documentation
- Admin guides
- Deployment guides
- API documentation
- Sage integration schemas

#### Deployment (`deployment/`)
- **Development**: Local development setup
- **Sage**: Production with Sage integration
- **Sage-Maroc**: Specific Maroc configuration

#### Configuration (`config/`)
- **Database**: MySQL/PostgreSQL configurations
- **Nginx**: Reverse proxy configurations
- **Redis**: Cache configurations

## 🗂️ Detailed Structure

### Frontend Structure
```
src/
├── components/              # Reusable UI components
│   ├── ui/                 # Basic UI components
│   ├── forms/              # Form components
│   ├── tables/             # Table components
│   └── modals/             # Modal components
├── pages/                  # Application pages
│   ├── auth/               # Authentication pages
│   ├── admin/              # Admin pages
│   ├── dashboard/          # Dashboard pages
│   └── catalog/            # Product catalog pages
├── services/               # API services
│   ├── apiService.js       # Main API service
│   ├── authService.js      # Authentication service
│   └── *Service.js         # Feature-specific services
├── contexts/               # React contexts
│   ├── AuthContext.jsx     # Authentication context
│   └── ThemeContext.jsx    # Theme context
├── hooks/                  # Custom React hooks
├── utils/                  # Utility functions
└── assets/                 # Static assets
```

### Backend Structure
```
backend/
├── controllers/            # Route controllers
│   ├── authController.js   # Authentication
│   ├── userController.js   # User management
│   ├── productController.js # Product management
│   └── orderController.js  # Order management
├── models/                 # Database models
│   ├── User.js            # User model
│   ├── Product.js         # Product model
│   ├── Order.js           # Order model
│   └── index.js           # Model associations
├── routes/                 # API routes
│   ├── auth.js            # Authentication routes
│   ├── users.js           # User routes
│   ├── products.js        # Product routes
│   └── orders.js          # Order routes
├── services/               # Business logic
│   ├── authService.js     # Authentication logic
│   ├── userService.js     # User logic
│   └── sage/              # Sage integration
├── middleware/             # Express middleware
│   ├── auth.js            # Authentication middleware
│   ├── validation.js      # Input validation
│   └── errorHandler.js    # Error handling
├── migrations/             # Database migrations
├── seeders/               # Database seeders
├── tests/                 # Backend tests
└── utils/                 # Utility functions
```

## 🔧 Configuration Files

### Frontend Configuration
- `package.json` - Dependencies and scripts
- `vite.config.js` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `.env.example` - Environment variables template

### Backend Configuration
- `package.json` - Dependencies and scripts
- `server.js` - Main server file
- `config/database.js` - Database configuration
- `.env.example` - Environment variables template

### Docker Configuration
- `deployment/development/docker-compose.yml` - Development setup
- `deployment/sage/docker-compose.sage.yml` - Sage integration
- `deployment/sage-maroc/docker-compose.sage-maroc.yml` - Sage Maroc

## 📊 Database Schema

### Core Tables
- `users` - User accounts and authentication
- `clients` - Client companies
- `products` - Product catalog
- `orders` - Order management
- `order_items` - Order line items

### Supporting Tables
- `brands` - Product brands
- `categories` - Product categories
- `documents` - Invoices and delivery notes
- `notifications` - System notifications
- `audit_logs` - Activity logging

## 🚀 Deployment Environments

### Development
- Local development with hot reload
- SQLite database for simplicity
- Mock Sage integration
- Debug logging enabled

### Staging
- Docker-based deployment
- PostgreSQL database
- Mock Sage integration
- Production-like configuration

### Production
- Docker-based deployment
- PostgreSQL database
- Real Sage integration
- Full monitoring and logging

## 🔐 Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- CORS protection
- Rate limiting
- SQL injection prevention
- XSS protection

## 📈 Monitoring and Logging

- Winston logging system
- Error tracking and alerting
- Performance monitoring
- Database query logging
- API request/response logging

## 🧪 Testing Strategy

### Frontend Testing
- Unit tests for components
- Integration tests for pages
- E2E tests for critical workflows

### Backend Testing
- Unit tests for services
- Integration tests for API endpoints
- Database migration tests

## 📚 Documentation Standards

- README files for each major component
- API documentation with examples
- Code comments for complex logic
- Architecture decision records
- Deployment guides
