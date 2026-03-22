// ⚠️ IMPORTANTE: OpenTelemetry DEVE ser importado PRIMEIRO
// Isso garante que a instrumentação automática funcione corretamente
import { initializeTracing } from './config/tracing';
import { initializeMetrics } from './config/metrics';
import {
  initializeMetricsWithDemoData,
  startMetricsSimulation,
} from './scripts/initialize-metrics';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { StructuredLogger } from './utils/structured-logger'; // ✅ Logger com correlação de traces
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { resolveJwtSecret } from './config/jwt.config';

const HTTP_METHOD_KEYS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

// When this process is spawned from a parent that may close stdout/stderr (e.g. CI runners / detached shells),
// Node can crash with EPIPE during console writes. Ignore broken pipe errors to keep the API alive.
const swallowBrokenPipe = (stream: NodeJS.WritableStream | undefined) => {
  if (!stream || typeof (stream as any).on !== 'function') {
    return;
  }

  stream.on('error', (err: any) => {
    if (err && err.code === 'EPIPE') {
      return;
    }
  });
};

swallowBrokenPipe(process.stdout);
swallowBrokenPipe(process.stderr);

const isGuardianOpenApiPath = (path: string): boolean => {
  const normalized = String(path || '').toLowerCase();
  return (
    normalized === '/guardian' ||
    normalized.startsWith('/guardian/') ||
    normalized === 'guardian' ||
    normalized.startsWith('guardian/')
  );
};

const filterOpenApiByGuardianScope = (
  document: Record<string, any>,
  mode: 'exclude_guardian' | 'only_guardian',
): Record<string, any> => {
  const sourcePaths = document?.paths || {};
  const filteredEntries = Object.entries(sourcePaths).filter(([routePath]) => {
    const isGuardianPath = isGuardianOpenApiPath(routePath);
    return mode === 'exclude_guardian' ? !isGuardianPath : isGuardianPath;
  });

  const filteredPaths = Object.fromEntries(filteredEntries);
  const usedTags = new Set<string>();

  Object.values(filteredPaths).forEach((pathItem: any) => {
    if (!pathItem || typeof pathItem !== 'object') {
      return;
    }

    HTTP_METHOD_KEYS.forEach((method) => {
      const operation = pathItem[method];
      if (!operation || typeof operation !== 'object') {
        return;
      }

      const tags = Array.isArray(operation.tags) ? operation.tags : [];
      tags.forEach((tag: unknown) => {
        if (typeof tag === 'string' && tag.trim()) {
          usedTags.add(tag);
        }
      });
    });
  });

  const sourceTags = Array.isArray(document?.tags) ? document.tags : [];
  const filteredTags = sourceTags.filter(
    (tag: any) => tag && typeof tag.name === 'string' && usedTags.has(tag.name),
  );

  return {
    ...document,
    paths: filteredPaths,
    tags: filteredTags,
  };
};

async function bootstrap() {
  // ============================================================================
  // OPENTELEMETRY (Tracing Distribuído) - TEMPORARIAMENTE DESABILITADO PARA TESTE DE CACHE
  // ============================================================================
  // await initializeTracing();

  // ============================================================================
  // PROMETHEUS (Métricas) - TEMPORARIAMENTE DESABILITADO PARA TESTE DE CACHE
  // ============================================================================
  // initializeMetrics();

  // 🎯 Inicializar métricas com dados de demonstração
  // Isso permite testar dashboards antes de ter tráfego real
  // initializeMetricsWithDemoData();

  // 🔄 Simular tráfego contínuo (apenas em DEV)
  // if (process.env.NODE_ENV !== 'production') {
  //   startMetricsSimulation(5000); // Atualizar a cada 5 segundos
  // }

  const customLogger = new StructuredLogger('Bootstrap');

  resolveJwtSecret();

  console.log('🚀 [NestJS] Iniciando aplicação...');

  // ============================================================================
  // SENTRY (Error Tracking)
  // ============================================================================
  const isProduction = process.env.NODE_ENV === 'production';
  const enableSentry = process.env.ENABLE_SENTRY === 'true';

  if (enableSentry && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.npm_package_version || '1.0.0',

      // Performance Monitoring
      tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% em prod, 100% em dev

      // Profiling (análise de performance)
      profilesSampleRate: isProduction ? 0.1 : 1.0,
      integrations: [nodeProfilingIntegration()],

      // Filtros de erro
      ignoreErrors: ['AbortError', 'NetworkError', 'Non-Error promise rejection'],

      // Contexto adicional
      beforeSend(event, hint) {
        // Não enviar erros de validação (400)
        if (event.exception?.values?.[0]?.value?.includes('Validation failed')) {
          return null;
        }

        // Log local para debug
        console.error('📤 [Sentry] Enviando erro:', event.exception?.values?.[0]?.value);

        return event;
      },
    });

    console.log('📊 [Sentry] Error tracking habilitado');
    console.log(`   Ambiente: ${process.env.NODE_ENV}`);
    console.log(`   Tracing: ${isProduction ? '10%' : '100%'} das requisições`);
  } else if (enableSentry && !process.env.SENTRY_DSN) {
    console.warn('⚠️  [Sentry] ENABLE_SENTRY=true mas SENTRY_DSN não definido');
  }

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

    const bodySizeLimit = process.env.REQUEST_BODY_LIMIT || '20mb';

    const app = await NestFactory.create(AppModule, {
      // logger: customLogger,  // ← Desabilitado temporariamente para debug
      httpsOptions,
      bodyParser: false, // Permite configurar limite customizado de payload (logos/base64)
    });
    console.log('✅ [NestJS] AppModule criado com sucesso');

    // Listar todas as rotas registradas
    const server = app.getHttpServer();
    const router = server._events.request._router;
    if (router && router.stack) {
      console.log('📋 [NestJS] Rotas registradas:');
      const routes = router.stack
        .filter((layer) => layer.route)
        .map((layer) => ({
          path: layer.route.path,
          method: Object.keys(layer.route.methods)[0].toUpperCase(),
        }));
      routes.forEach((r) => console.log(`  ${r.method} ${r.path}`));
    }

    // Disponibilizar diretório de uploads estáticos
    // Usar `process.cwd()` para evitar depender do layout exato do build (dist/main.js vs dist/src/main.js).
    const uploadsPath = process.env.UPLOADS_PATH?.trim()
      ? path.resolve(process.env.UPLOADS_PATH.trim())
      : path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
      console.log('📁 [Uploads] Diretório criado:', uploadsPath);
    }
    app.use('/uploads', express.static(uploadsPath));

    // 🛡️ Helmet: Security Headers (HSTS, CSP, X-Frame-Options, etc)
    const isProduction = process.env.NODE_ENV === 'production';

    app.use(
      helmet({
        // HSTS (HTTP Strict Transport Security)
        hsts: isProduction
          ? {
              maxAge: 31536000, // 1 ano em segundos
              includeSubDomains: true,
              preload: true,
            }
          : false, // Desabilitado em desenvolvimento (permite HTTP)

        // CSP (Content Security Policy)
        contentSecurityPolicy: isProduction
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline necessário para alguns frameworks
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
                frameSrc: ["'none'"], // Bloqueia iframes (previne clickjacking)
              },
            }
          : false, // Desabilitado em dev (mais flexível)

        // X-Frame-Options: Previne clickjacking
        frameguard: {
          action: 'deny', // Bloqueia iframes completamente
        },

        // X-Content-Type-Options: Previne MIME sniffing
        noSniff: true,

        // X-XSS-Protection: Proteção contra XSS (legado, mas ainda útil)
        xssFilter: true,

        // Referrer-Policy: Controla informações do referrer
        referrerPolicy: {
          policy: 'strict-origin-when-cross-origin',
        },

        // X-DNS-Prefetch-Control: Controla DNS prefetch
        dnsPrefetchControl: {
          allow: false,
        },

        // X-Download-Options: IE8+ (previne download automático)
        ieNoOpen: true,

        // X-Permitted-Cross-Domain-Policies: Adobe products
        permittedCrossDomainPolicies: {
          permittedPolicies: 'none',
        },
      }),
    );

    console.log(
      `🛡️  [Helmet] Security headers habilitados (${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'})`,
    );
    if (isProduction) {
      console.log('   ✅ HSTS: 1 ano, includeSubDomains, preload');
      console.log('   ✅ CSP: Política restritiva configurada');
      console.log('   ✅ X-Frame-Options: DENY');
      console.log('   ✅ X-Content-Type-Options: nosniff');
    }

    // Configuração CORS (Restritivo em Produção)
    const normalizeOrigin = (value: string): string => value.trim().replace(/\/$/, '');

    const isPrivateNetworkOrigin = (value: string): boolean => {
      try {
        const hostname = new URL(value).hostname;

        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
          return true;
        }

        if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
          return true;
        }

        if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
          return true;
        }

        const private172Range = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
        if (private172Range) {
          const secondOctet = Number(private172Range[1]);
          return secondOctet >= 16 && secondOctet <= 31;
        }

        return false;
      } catch {
        return false;
      }
    };

    const corsOrigins = (
      process.env.CORS_ORIGINS?.split(',').map((origin) => normalizeOrigin(origin)) || [
        'http://localhost:3900',
        'http://localhost:3000',
      ]
    ).filter(Boolean);
    const allowPrivateNetworkOrigins =
      !isProduction || process.env.CORS_ALLOW_PRIVATE_NETWORK === 'true';

    app.enableCors({
      origin: (origin, callback) => {
        // Permitir requisições sem origem (ex: Postman, curl, apps mobile)
        if (!origin) return callback(null, true);

        // Em desenvolvimento (ou com flag): permite localhost e rede local
        const normalizedOrigin = normalizeOrigin(origin);

        if (allowPrivateNetworkOrigins && isPrivateNetworkOrigin(normalizedOrigin)) {
          return callback(null, true);
        }

        // Em produção: apenas whitelist
        if (corsOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        console.warn(`🚫 [CORS] Origin bloqueada: ${origin}`);
        callback(new Error(`CORS policy: Origin ${origin} não permitida`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      maxAge: 86400, // 24 horas cache preflight
    });

    console.log(`🔒 [CORS] Configurado (${isProduction ? 'RESTRITIVO' : 'PERMISSIVO'})`);
    console.log(`   Origens permitidas: ${corsOrigins.join(', ')}`);

    app.use(express.json({ limit: bodySizeLimit }));
    app.use(express.urlencoded({ extended: true, limit: bodySizeLimit }));
    console.log(`📦 [BodyParser] Limite de payload configurado para ${bodySizeLimit}`);

    const enableRequestDebug = process.env.REQUEST_DEBUG === 'true';
    const SENSITIVE_REQUEST_KEYS = new Set([
      'password',
      'senha',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'api_key',
      'authorization',
      'cookie',
      'smtpSenha',
      'smtp_senha',
      'whatsappApiToken',
      'whatsapp_api_token',
      'smsApiKey',
      'sms_api_key',
      'pushApiKey',
      'push_api_key',
    ]);

    const redactRequestDebugValue = (value: unknown, depth = 0): unknown => {
      if (value == null) return value;
      if (typeof value === 'string') {
        return value.length > 180 ? `${value.slice(0, 180)}...` : value;
      }
      if (typeof value !== 'object') return value;
      if (depth >= 2) return '[depth-limited]';
      if (Array.isArray(value)) {
        return {
          type: 'array',
          length: value.length,
          sample: value.slice(0, 3).map((item) => redactRequestDebugValue(item, depth + 1)),
        };
      }

      const entries = Object.entries(value as Record<string, unknown>).slice(0, 25);
      const result: Record<string, unknown> = {};
      for (const [key, entryValue] of entries) {
        if (SENSITIVE_REQUEST_KEYS.has(key)) {
          result[key] = '[redacted]';
          continue;
        }
        result[key] = redactRequestDebugValue(entryValue, depth + 1);
      }
      return result;
    };

    if (enableRequestDebug) {
      // Middleware de debug APÓS configuração do body parser
      app.use((req, res, next) => {
        const requestBodyKeys =
          req.body && typeof req.body === 'object' ? Object.keys(req.body) : [];
        console.log(
          `🔍 [REQUEST] ${req.method} ${req.url} - bodyType=${typeof req.body} keys=${requestBodyKeys.join(',') || 'none'}`,
        );

        // Log especial para PUT requests em planos
        if (req.method === 'PUT' && req.url.includes('/planos/')) {
          console.log('🔴 [PUT DEBUG] Content-Type:', req.headers['content-type']);
          console.log('🔴 [PUT DEBUG] Content-Length:', req.headers['content-length']);
          console.log('🔴 [PUT DEBUG] Body Type:', typeof req.body);
          console.log('🔴 [PUT DEBUG] Body Keys:', Object.keys(req.body || {}));
          console.log(
            '🔴 [PUT DEBUG] Body Summary:',
            JSON.stringify(redactRequestDebugValue(req.body), null, 2),
          );
        }

        // Interceptar resposta para log de sucesso
        const originalSend = res.send;
        res.send = function (data) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (req.method === 'PUT' && req.url.includes('/planos/')) {
              console.log(
                `✅ [RESPONSE SUCCESS] ${req.method} ${req.url} - Status: ${res.statusCode}`,
              );
            }
          }
          return originalSend.call(this, data);
        };

        next();
      });
    }

    // Validação global
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false, // Temporariamente desabilitado para debug
        transform: true,
        exceptionFactory: (errors) => {
          // Envia erros de validação para Sentry (se habilitado)
          if (enableSentry && errors.length > 0) {
            Sentry.captureMessage(
              `Validation errors: ${errors.map((e) => Object.values(e.constraints || {}).join(', ')).join('; ')}`,
              'warning',
            );
          }

          // Retorna erro padrão
          return new ValidationPipe().createExceptionFactory()(errors);
        },
      }),
    );

    // Configuração Swagger
    const config = new DocumentBuilder()
      .setTitle('Conect CRM API')
      .setDescription('API completa do sistema Conect CRM')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const fullDocument = SwaggerModule.createDocument(app, config);
    const publicDocument = filterOpenApiByGuardianScope(fullDocument, 'exclude_guardian');
    SwaggerModule.setup('api-docs', app, publicDocument as any);

    const guardianDocsEnabled = process.env.GUARDIAN_DOCS_ENABLED === 'true';
    const guardianDocsUser = process.env.GUARDIAN_DOCS_USER?.trim() || '';
    const guardianDocsPassword = process.env.GUARDIAN_DOCS_PASSWORD?.trim() || '';
    const guardianDocsPath = (process.env.GUARDIAN_DOCS_PATH || 'guardian-docs').replace(
      /^\/+|\/+$/g,
      '',
    );

    if (guardianDocsEnabled) {
      if (!guardianDocsUser || !guardianDocsPassword) {
        console.warn(
          '⚠️ [Swagger] Guardian docs habilitado sem credenciais (GUARDIAN_DOCS_USER/GUARDIAN_DOCS_PASSWORD). Endpoint nao sera publicado.',
        );
      } else {
        const guardianDocument = filterOpenApiByGuardianScope(fullDocument, 'only_guardian');

        app.use(
          [`/${guardianDocsPath}`, `/${guardianDocsPath}-json`],
          (req: any, res: any, next: any) => {
            const authHeader = String(req.headers?.authorization || '');
            if (!authHeader.startsWith('Basic ')) {
              res.setHeader('WWW-Authenticate', 'Basic realm="Guardian Docs"');
              return res.status(401).send('Unauthorized');
            }

            const encoded = authHeader.slice('Basic '.length).trim();
            let decoded = '';
            try {
              decoded = Buffer.from(encoded, 'base64').toString('utf8');
            } catch {
              res.setHeader('WWW-Authenticate', 'Basic realm="Guardian Docs"');
              return res.status(401).send('Unauthorized');
            }

            const separatorIndex = decoded.indexOf(':');
            const username = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : '';
            const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : '';

            if (username !== guardianDocsUser || password !== guardianDocsPassword) {
              res.setHeader('WWW-Authenticate', 'Basic realm="Guardian Docs"');
              return res.status(401).send('Unauthorized');
            }

            return next();
          },
        );

        SwaggerModule.setup(guardianDocsPath, app, guardianDocument as any, {
          customSiteTitle: 'Conect Guardian API Docs',
          swaggerOptions: {
            persistAuthorization: true,
          },
        });
      }
    }

    // Porta padrão ajustada para 3001 para alinhar com frontend e documentação.
    //
    // Em alguns ambientes Windows (principalmente com Docker Desktop / stacks locais),
    // o bind padrão em IPv6 ("::") pode falhar com EADDRINUSE mesmo quando IPv4 está livre.
    // Usar host explícito (IPv4) evita esse flake e mantém o serviço acessível em rede.
    const port = process.env.APP_PORT || 3001;
    const host = (process.env.APP_HOST || '0.0.0.0').trim();
    await app.listen(port, host);

    const protocol = sslEnabled && httpsOptions ? 'https' : 'http';
    console.log(`🚀 Conect CRM Backend rodando na porta ${port} (${protocol.toUpperCase()})`);
    console.log(`📖 Documentação pública disponível em: ${protocol}://localhost:${port}/api-docs`);
    if (guardianDocsEnabled && guardianDocsUser && guardianDocsPassword) {
      console.log(
        `🔐 Documentação Guardian disponível em: ${protocol}://localhost:${port}/${guardianDocsPath}`,
      );
    }

    if (sslEnabled && httpsOptions) {
      console.log(`🔐 Conexão segura HTTPS ativada`);
    } else if (sslEnabled) {
      console.log(`⚠️  SSL_ENABLED=true mas certificados não encontrados`);
    }

    // ============================================================================
    // UPTIME MONITORING (Heartbeat)
    // ============================================================================
    const enableUptimeMonitoring = process.env.ENABLE_UPTIME_MONITORING === 'true';
    const uptimeCheckUrl = process.env.UPTIME_CHECK_URL;

    if (enableUptimeMonitoring && uptimeCheckUrl) {
      // Envia heartbeat a cada 5 minutos
      setInterval(
        async () => {
          try {
            const response = await fetch(uptimeCheckUrl, { method: 'GET' });
            if (response.ok) {
              console.log('💓 [Uptime] Heartbeat enviado');
            }
          } catch (error) {
            console.error('❌ [Uptime] Falha ao enviar heartbeat:', error.message);
          }
        },
        5 * 60 * 1000,
      ); // 5 minutos

      console.log('💓 [Uptime] Monitoramento habilitado');
      console.log(`   URL: ${uptimeCheckUrl}`);
      console.log(`   Intervalo: 5 minutos`);
    }

    // ============================================================================
    // SENTRY (Performance Transaction)
    // ============================================================================
    if (enableSentry) {
      // Captura informações de startup
      Sentry.captureMessage('Backend iniciado com sucesso', 'info');
    }
  } catch (error) {
    console.error('❌ [NestJS] Erro ao inicializar aplicação:', error);

    // Envia erro crítico para Sentry
    if (enableSentry) {
      Sentry.captureException(error);
      await Sentry.close(2000); // Aguarda 2s para enviar erro
    }

    throw error;
  }
}

bootstrap().catch((err) => {
  console.error('💥 [NestJS] Erro fatal no bootstrap:', err);
  process.exit(1);
});
