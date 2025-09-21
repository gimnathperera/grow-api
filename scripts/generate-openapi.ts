import { writeFileSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';

async function generateOpenApi() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('GROW Fitness API')
    .setDescription('Generated via script for frontend consumption')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const outputPath = join(__dirname, '../../client/docs/openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));

  await app.close();
  // eslint-disable-next-line no-console
  console.log(`OpenAPI document written to ${outputPath}`);
}

generateOpenApi().catch(error => {
  // eslint-disable-next-line no-console
  console.error('Failed to generate OpenAPI document', error);
  process.exit(1);
});
