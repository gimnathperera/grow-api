# GROW Fitness - Backend Server

This is the backend server for the GROW Fitness platform, built with NestJS and MongoDB. It provides a comprehensive API for managing fitness coaching, client management, scheduling, payments, and more.

## Project Overview

GROW Fitness is a platform designed for fitness coaches and their clients. The backend provides APIs for:

- User authentication and authorization (Admin, Team, Coach, Client roles)
- Client and coach management
- Session scheduling and tracking
- Passes and subscription management
- Milestone tracking
- CRM functionality
- Invoicing and payments
- Reporting and analytics
- Content management
- Quiz functionality
- E-commerce store
- Feedback collection
- Calendar integration
- Notifications
- File management

## Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator and class-transformer
- **Security**: Helmet, CORS, Rate limiting

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local instance or connection string to MongoDB Atlas)
- Git

## Setup and Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd grow-fitness/server
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Copy the example environment file and update it with your configuration:

```bash
cp env.example .env
```

Update the `.env` file with your specific configuration values:

- Database connection string
- JWT secret and expiration times
- External service API keys (if applicable)
- Port settings
- CORS settings

### 4. Running the Application

#### Development mode

```bash
npm run start:dev
# or
yarn start:dev
```

This will start the application in development mode with hot-reload enabled.

#### Production mode

```bash
npm run build
npm run start:prod
# or
yarn build
yarn start:prod
```

### 5. API Documentation

Once the application is running, you can access the Swagger API documentation at:

```
http://localhost:3000/api/docs
```

## Testing

### Running unit tests

```bash
npm run test
# or
yarn test
```

### Running end-to-end tests

```bash
npm run test:e2e
# or
yarn test:e2e
```

### Test coverage

```bash
npm run test:cov
# or
yarn test:cov
```

## Project Structure

```
src/
├── admin/           # Admin portal functionality
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── audits/          # Audit logging functionality
├── auth/            # Authentication and authorization
├── calendar/        # Calendar integration
├── clients/         # Client management
├── coaches/         # Coach management
├── common/          # Shared utilities, filters, guards, etc.
├── content/         # Content management
├── crm/             # Customer relationship management
├── estore/          # E-commerce store
├── feedback/        # Feedback collection
├── files/           # File management
├── invoices/        # Invoice management
├── main.ts          # Application entry point
├── milestones/      # Client milestone tracking
├── notifications/   # Notification system
├── passes/          # Subscription passes
├── payments/        # Payment processing
├── quiz/            # Quiz functionality
├── reports/         # Reporting and analytics
├── sessions/        # Training session management
├── shared/          # Shared code across modules
├── team/            # Team management
└── users/           # User management
```

## Environment Variables

The following environment variables can be configured in your `.env` file:

```
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/grow-fitness

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google Calendar Integration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Payment Gateway (Stripe example)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email Configuration (SendGrid example)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@growfitness.com

# SMS Configuration (Twilio example)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# File Storage (AWS S3 example)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=grow-fitness-uploads

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# CORS
CORS_ORIGIN=http://localhost:3001
```

## License

[ISC](LICENSE)