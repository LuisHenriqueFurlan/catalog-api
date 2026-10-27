import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);
  const secureHeaders = helmet();
  const docsHeaders = helmet({ contentSecurityPolicy: false });
  app.use((req: Request, res: Response, next: NextFunction) =>
    (req.path.startsWith('/docs') ? docsHeaders : secureHeaders)(req, res, next),
  );
  const origins = config.get<string>('CORS_ORIGINS');
  app.enableCors(
    origins ? { origin: origins.split(',').map((o) => o.trim()), credentials: true } : undefined,
  );
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Catálogo de Cursos')
    .setDescription('API REST de cursos, estudantes e matrículas')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
}
