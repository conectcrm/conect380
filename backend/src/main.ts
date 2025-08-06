import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3900', 'http://localhost:3000'],
    credentials: true,
  });

  // Configurar body parser explicitamente ANTES do nosso middleware de debug
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Middleware de debug APÓS configuração do body parser
  app.use((req, res, next) => {
    console.log(`🔍 [REQUEST] ${req.method} ${req.url} - Body:`, req.body ? JSON.stringify(req.body) : 'Empty');

    // Log especial para PUT requests em planos
    if (req.method === 'PUT' && req.url.includes('/planos/')) {
      console.log('🔴 [PUT DEBUG] Content-Type:', req.headers['content-type']);
      console.log('🔴 [PUT DEBUG] Content-Length:', req.headers['content-length']);
      console.log('🔴 [PUT DEBUG] Body Type:', typeof req.body);
      console.log('🔴 [PUT DEBUG] Body Keys:', Object.keys(req.body || {}));
      console.log('🔴 [PUT DEBUG] Full Body:', JSON.stringify(req.body, null, 2));
    }

    // Interceptar resposta para log de sucesso
    const originalSend = res.send;
    res.send = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (req.method === 'PUT' && req.url.includes('/planos/')) {
          console.log(`✅ [RESPONSE SUCCESS] ${req.method} ${req.url} - Status: ${res.statusCode}`);
        }
      }
      return originalSend.call(this, data);
    };

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
