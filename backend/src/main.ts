import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3900', 'http://localhost:3000'],
    credentials: true,
  });

  // Log de todas as requisições
  app.use((req, res, next) => {
    console.log(`🔍 [REQUEST] ${req.method} ${req.url} - Body:`, req.body ? JSON.stringify(req.body) : 'Empty');
    next();
  });

  // Validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Temporariamente desabilitado para debug
      transform: true,
    }),
  );

  // Configuração Swagger
  const config = new DocumentBuilder()
    .setTitle('Conect CRM API')
    .setDescription('API completa do sistema Conect CRM')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Conect CRM Backend rodando na porta ${port}`);
  console.log(`📖 Documentação disponível em: http://localhost:${port}/api-docs`);
}

bootstrap();
