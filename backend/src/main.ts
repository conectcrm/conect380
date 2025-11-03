import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { CustomLogger } from './common/logger/custom-logger';
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const customLogger = new CustomLogger();

  console.log('🚀 [NestJS] Iniciando aplicação...');

  try {
    // Configuração HTTPS (se habilitado)
    const sslEnabled = process.env.SSL_ENABLED === 'true';
    let httpsOptions;

    if (sslEnabled) {
      const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, '../../certs/cert.pem');
      const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, '../../certs/key.pem');

      if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        httpsOptions = {
          cert: fs.readFileSync(certPath),
          key: fs.readFileSync(keyPath),
        };
        console.log('🔐 [SSL] HTTPS habilitado');
        console.log(`   Certificado: ${certPath}`);
        console.log(`   Chave: ${keyPath}`);
      } else {
        console.warn('⚠️  [SSL] Certificados não encontrados. Usando HTTP.');
        console.warn(`   Esperado: ${certPath} e ${keyPath}`);
      }
    }

    const app = await NestFactory.create(AppModule, {
      logger: customLogger,
      httpsOptions,
    });
    console.log('✅ [NestJS] AppModule criado com sucesso');

    // Listar todas as rotas registradas
    const server = app.getHttpServer();
    const router = server._events.request._router;
    if (router && router.stack) {
      console.log('📋 [NestJS] Rotas registradas:');
      const routes = router.stack
        .filter(layer => layer.route)
        .map(layer => ({
          path: layer.route.path,
          method: Object.keys(layer.route.methods)[0].toUpperCase()
        }));
      routes.forEach(r => console.log(`  ${r.method} ${r.path}`));
    }

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

    // Porta padrão ajustada para 3001 para alinhar com frontend e documentação
    const port = process.env.APP_PORT || 3001;
    await app.listen(port);

    const protocol = sslEnabled && httpsOptions ? 'https' : 'http';
    console.log(`🚀 Conect CRM Backend rodando na porta ${port} (${protocol.toUpperCase()})`);
    console.log(`📖 Documentação disponível em: ${protocol}://localhost:${port}/api-docs`);
    
    if (sslEnabled && httpsOptions) {
      console.log(`🔐 Conexão segura HTTPS ativada`);
    } else if (sslEnabled) {
      console.log(`⚠️  SSL_ENABLED=true mas certificados não encontrados`);
    }
  } catch (error) {
    console.error('❌ [NestJS] Erro ao inicializar aplicação:', error);
    throw error;
  }
}

bootstrap().catch(err => {
  console.error('💥 [NestJS] Erro fatal no bootstrap:', err);
  process.exit(1);
});
