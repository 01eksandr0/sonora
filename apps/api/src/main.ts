import 'reflect-metadata'
import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module.js'
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js'
import type { Env } from './infrastructure/config/env.schema.js'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true })
  const config = app.get(ConfigService<Env, true>)
  const logger = new Logger('Bootstrap')

  const prefix = config.get('API_PREFIX', { infer: true })
  app.setGlobalPrefix(prefix)

  app.use(helmet())
  app.use(cookieParser())
  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }).split(','),
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  app.useGlobalFilters(new HttpExceptionFilter())
  app.enableShutdownHooks()

  if (config.get('NODE_ENV', { infer: true }) !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Music App API')
        .setDescription('REST API for the Music App backend')
        .setVersion('0.1.0')
        .addCookieAuth('access_token')
        .build(),
    )
    SwaggerModule.setup(`${prefix}/docs`, app, document)
  }

  const port = config.get('PORT', { infer: true })
  await app.listen(port)
  logger.log(`API listening on http://localhost:${port}/${prefix}`)
}

await bootstrap()
