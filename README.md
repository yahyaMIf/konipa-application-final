# Konipa B2B Platform

A comprehensive B2B e-commerce platform with Sage 100c integration, built with React and Node.js.

## 🏗️ Project Structure

```
konipa_application_finale_complete/
├── konipa-app-new/                    # Main application
│   ├── frontend/                      # React application
│   │   ├── src/
│   │   │   ├── components/           # Reusable UI components
│   │   │   ├── pages/                # Application pages
│   │   │   ├── services/             # API services
│   │   │   ├── contexts/             # React contexts
│   │   │   └── hooks/                # Custom React hooks
│   │   ├── public/                   # Static assets
│   │   └── package.json
│   ├── backend/                      # Node.js API server
│   │   ├── controllers/              # Route controllers
│   │   ├── models/                   # Database models
│   │   ├── routes/                   # API routes
│   │   ├── services/                 # Business logic
│   │   ├── middleware/               # Express middleware
│   │   ├── migrations/               # Database migrations
│   │   ├── seeders/                  # Database seeders
│   │   └── tests/                    # Backend tests
│   ├── docs/                         # Documentation
│   ├── deployment/                   # Docker configurations
│   │   ├── development/              # Development environment
│   │   ├── sage/                     # Sage integration
│   │   └── sage-maroc/               # Sage Maroc specific
│   └── config/                       # Configuration files
│       ├── database/                 # Database configs
│       ├── nginx/                    # Nginx configs
│       └── redis/                    # Redis configs
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker (optional)

### Development Setup

1. **Clone and navigate to the project:**
   ```bash
   cd konipa-app-new
   ```

2. **Install dependencies:**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   npm install
   ```

3. **Environment setup:**
   ```bash
   # Copy environment files
   cp .env.example .env
   cd backend
   cp .env.example .env
   ```

4. **Start development servers:**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev
   
   # Frontend (Terminal 2)
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Docker Setup

1. **Development environment:**
   ```bash
   docker-compose -f deployment/development/docker-compose.yml up
   ```

2. **Sage integration:**
   ```bash
   docker-compose -f deployment/sage/docker-compose.sage.yml up
   ```

3. **Sage Maroc:**
   ```bash
   docker-compose -f deployment/sage-maroc/docker-compose.sage-maroc.yml up
   ```

## 📚 Documentation

- [Architecture Overview](konipa-app-new/docs/arch.md)
- [Admin Guide](konipa-app-new/docs/admin.md)
- [Deployment Guide](konipa-app-new/docs/DEPLOYMENT_GUIDE.md)
- [Sage Integration](konipa-app-new/docs/schemas-sage-portail.json)

## 🛠️ Features

### Frontend
- **Dashboard System**: Role-based dashboards (Admin, Client, Representative, Accounting, Counter)
- **Product Catalog**: Advanced product management with search and filters
- **Order Management**: Complete order lifecycle management
- **User Management**: Comprehensive user administration
- **Document Management**: Invoice and delivery note management
- **Real-time Notifications**: WebSocket-based notifications

### Backend
- **RESTful API**: Complete API for all frontend operations
- **Authentication**: JWT-based authentication with refresh tokens
- **Database**: PostgreSQL with Sequelize ORM
- **Sage Integration**: Mock and real Sage 100c integration
- **File Upload**: Image and document upload handling
- **WebSocket**: Real-time communication

## 🔧 Configuration

### Environment Variables

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001/api
VITE_USE_MOCK=false
```

**Backend (.env):**
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=konipa
DB_USER=konipa
DB_PASSWORD=konipa
JWT_SECRET=your-secret-key
USE_SAGE_MOCK=true
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
npm test
```

## 📦 Deployment

### Production Build
```bash
# Frontend
npm run build

# Backend
cd backend
npm start
```

### Docker Production
```bash
docker-compose -f deployment/sage/docker-compose.sage.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions, please contact the development team.
