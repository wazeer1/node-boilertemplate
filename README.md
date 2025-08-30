# Node.js Boilerplate

A comprehensive, production-ready Node.js boilerplate with Express.js, featuring authentication, authorization, database support (MongoDB & PostgreSQL), and modern development tools.

## 🚀 Features

- **Framework**: Express.js with ES6+ modules
- **Authentication**: JWT-based authentication with refresh tokens
- **Authorization**: Role-based access control (RBAC) and permission-based access
- **Database**: Support for both MongoDB (Mongoose) and PostgreSQL (Sequelize)
- **Validation**: Request validation using Joi
- **Security**: Helmet, CORS, rate limiting, password hashing
- **Logging**: Winston logger with Morgan integration
- **Error Handling**: Centralized error handling with custom API errors
- **Testing**: Jest and Supertest setup
- **Code Quality**: ESLint and Prettier configuration
- **Containerization**: Docker and Docker Compose support
- **Email**: Nodemailer integration for transactional emails
- **API Documentation**: Swagger/OpenAPI support

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB or PostgreSQL
- Docker (optional)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd node-boiler
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   - For MongoDB: Ensure MongoDB is running
   - For PostgreSQL: Ensure PostgreSQL is running

5. **Seed the database**
   ```bash
   npm run seed
   ```

6. **Start the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🐳 Docker Setup

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Build custom image**
   ```bash
   docker build -t node-boiler .
   docker run -p 3000:3000 node-boiler
   ```

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DATABASE_TYPE=mongodb
MONGODB_URL=mongodb://localhost:27017/node_boiler
POSTGRESQL_HOST=localhost
POSTGRESQL_PORT=5432
POSTGRESQL_DATABASE=node_boiler
POSTGRESQL_USERNAME=postgres
POSTGRESQL_PASSWORD=password

# JWT Configuration
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@yourdomain.com

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Logging
LOGGING_LEVEL=debug
LOGGING_FILE_PATH=logs/app.log
```

## 📁 Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── database/         # Database connection and seeds
├── middleware/       # Custom middleware
├── models/           # Database models
├── routes/           # API routes
├── services/         # Business logic
├── utils/            # Utility functions
├── validations/      # Request validation schemas
├── app.js           # Express app configuration
└── server.js        # Server entry point
```

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email
- `GET /api/auth/me` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Users (Admin)
- `GET /api/auth/users` - Get all users
- `GET /api/auth/users/:id` - Get user by ID
- `PUT /api/auth/users/:id/status` - Update user status

### Health Check
- `GET /api/health` - Application health status
- `GET /api/docs` - API documentation

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=auth.test.js
```

## 📝 Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check code quality
npm run quality
```

## 🚀 Scripts

```bash
# Development
npm run dev          # Start development server
npm run dev:debug    # Start with debug logging

# Production
npm start            # Start production server
npm run build        # Build for production

# Database
npm run seed         # Seed database
npm run seed:clear   # Clear database
npm run db:migrate   # Run database migrations

# Docker
npm run docker:build # Build Docker image
npm run docker:run   # Run Docker container
npm run docker:stop  # Stop Docker containers

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
npm run format       # Format code
npm run quality      # Check code quality
```

## 🔐 Default Users

After seeding the database, you'll have these default users:

- **Admin User**
  - Email: `admin@example.com`
  - Password: `Admin@123`
  - Role: Administrator with full access

- **Sample Users**
  - Email: `john.doe@example.com`
  - Password: `User@123`
  - Role: Regular user

## 🛡️ Security Features

- **Authentication**: JWT-based with refresh token rotation
- **Authorization**: Role-based and permission-based access control
- **Password Security**: bcrypt hashing with configurable salt rounds
- **Rate Limiting**: Configurable rate limiting per IP/API key
- **CORS**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js for security headers
- **Input Validation**: Joi schema validation for all inputs
- **SQL Injection Protection**: Parameterized queries and ORM usage
- **XSS Protection**: Input sanitization and output encoding

## 📊 Monitoring & Logging

- **Structured Logging**: Winston logger with multiple transports
- **Request Logging**: Morgan integration for HTTP request logging
- **Error Tracking**: Centralized error handling and logging
- **Health Checks**: Database and application health monitoring
- **Performance Metrics**: Request duration and response time logging

## 🔄 Database Support

### MongoDB (Default)
- Mongoose ODM
- Schema validation
- Middleware support
- Indexing and optimization

### PostgreSQL
- Sequelize ORM
- Migration support
- Connection pooling
- Transaction support

## 📧 Email Features

- **Verification Emails**: Email verification for new accounts
- **Password Reset**: Secure password reset via email
- **Welcome Emails**: Welcome messages for new users
- **Security Alerts**: Account activity notifications
- **Template Support**: HTML email templates with fallback text

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in production.

### Process Management
Use PM2 or similar process manager for production:
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

### Reverse Proxy
Configure Nginx or Apache as a reverse proxy.

### SSL/TLS
Enable HTTPS in production with proper SSL certificates.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check the `/docs` folder
- **Examples**: See the `/examples` folder

## 🔗 Links

- [Express.js](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [Sequelize](https://sequelize.org/)
- [JWT](https://jwt.io/)
- [Joi](https://joi.dev/)
- [Winston](https://github.com/winstonjs/winston)
- [Jest](https://jestjs.io/)

---

**Happy Coding! 🎉**
