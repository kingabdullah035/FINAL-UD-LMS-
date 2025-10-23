import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //  All routes start with /api
  app.setGlobalPrefix('api');

  //  Enable DTO validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  //  Parse cookies (for Supabase session token)
  app.use(cookieParser());

  // Explicit CORS setup
  const origins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins.length > 0 ? origins : true, // Allow env list or fallback to all
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  //  Use Render-provided port or default for local dev
  const port = Number(process.env.PORT || 4000);
  await app.listen(port, '0.0.0.0');

  //  Helpful console logs for local and production
  console.log(`🚀 API running on: http://localhost:${port}/api`);
  if (process.env.CORS_ORIGIN) {
    console.log(`🌐 Allowed origins: ${process.env.CORS_ORIGIN}`);
  }
}
bootstrap();
