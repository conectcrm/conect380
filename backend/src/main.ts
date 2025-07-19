import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuração Swagger
  const config = new DocumentBuilder()
    .setTitle('Fênix CRM API')
    .setDescription('API completa do sistema Fênix CRM')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.APP_PORT || 3001;
  await app.listen(port);
  
  console.log(`🔥 Fênix CRM Backend rodando na porta ${port}`);
  console.log(`📖 Documentação disponível em: http://localhost:${port}/api-docs`);
}

bootstrap();
