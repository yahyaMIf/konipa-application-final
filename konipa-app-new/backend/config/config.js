require('dotenv').config();

const config = {
    server: {
        port: process.env.PORT || 3001,
        host: process.env.HOST || 'localhost'
    },

    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        username: process.env.DB_USER || 'konipa_user',
        password: process.env.DB_PASS || 'konipa_password',
        database: process.env.DB_NAME || 'konipa_db',
        dialect: process.env.DB_DIALECT || 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },

    cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:4173'
        ],
        credentials: true
    },

    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || null
    },

    sage: {
        useMock: process.env.USE_SAGE_MOCK === 'true',
        apiBaseUrl: process.env.SAGE_API_BASE_URL || 'http://sage.local:8080/api',
        apiKey: process.env.SAGE_API_KEY || 'your-sage-api-key',
        companyId: process.env.SAGE_COMPANY_ID || 'your-company-id',
        databaseName: process.env.SAGE_DATABASE_NAME || 'your-sage-database',
        username: process.env.SAGE_USERNAME || 'your-sage-username',
        password: process.env.SAGE_PASSWORD || 'your-sage-password'
    },

    email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
    },

    upload: {
        maxFileSize: process.env.MAX_FILE_SIZE || 5242880, // 5MB
        uploadPath: process.env.UPLOAD_PATH || './uploads'
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || './logs/app.log'
    },

    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
    }
};

module.exports = config;
