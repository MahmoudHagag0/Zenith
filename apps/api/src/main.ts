import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api/v1');

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Zenith API')
      .setDescription(
        'Zenith platform API — foundation layer (Sprint S1-001), user management (Sprint S1-002), trading catalog & watchlists (Sprint S1-003), portfolio & position management (Sprint S1-004), market data foundation (Sprint S1-005, simulated provider — see ADR-003), trading analytics foundation (Sprint S1-006)',
      )
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
}

bootstrap();
