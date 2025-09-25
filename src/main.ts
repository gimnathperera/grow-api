import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Enable CORS for all origins
  app.enableCors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("GROW Fitness API")
    .setDescription(
      `
      ## Backend API for GROW Fitness Platform
      
      This API provides comprehensive fitness management capabilities including:
      - **User Management**: Registration, authentication, and profile management
      - **Kids Management**: Child profile creation and management for fitness programs
      - **Client Management**: Client profiles, coach assignments, and tracking
      - **Session Management**: Fitness sessions and calendar integration
      - **Payment Processing**: Subscription and payment handling
      
      ### Authentication
      Most endpoints require Bearer token authentication. Include the token in the Authorization header:
      \`Authorization: Bearer <your-token>\`
      
      ### Response Format
      All API responses follow a consistent format:
      \`\`\`json
      {
        "ok": true,
        "data": { ... },
        "meta": {
          "traceId": "operation-id",
          "timestamp": "2024-01-01T00:00:00.000Z"
        }
      }
      \`\`\`
    `
    )
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth"
    )
    .addTag("Authentication", "User authentication and authorization")
    .addTag("Kids", "Kids profile management for fitness programs")
    .addTag("Clients", "Client management and coach assignments")
    .addTag("Coaches", "Coach profile and management")
    .addTag("Sessions", "Fitness session scheduling and management")
    .addTag("Payments", "Payment processing and subscriptions")
    .addTag("Reports", "Analytics and reporting")
    .addServer("http://localhost:3001", "Development server")
    .addServer("https://api.growfitness.com", "Production server")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 Swagger docs available at: http://localhost:${port}/api/docs`
  );
}

bootstrap();
