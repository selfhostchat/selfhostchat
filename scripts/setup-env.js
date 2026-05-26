const { existsSync, writeFileSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { randomBytes } = require('node:crypto');

const rootDir = process.cwd();
const envPath = join(rootDir, '.env');

const envExamplePath = join(rootDir, '.env.example');

const generateSecret = (length = 32) =>
  randomBytes(length).toString('hex');

const generatePassword = (length = 16) =>
  randomBytes(length).toString('base64url');

const mongodbPassword = generatePassword(16);
const redisPassword = generatePassword(16);
const rabbitmqPassword = generatePassword(16);

const requiredVars = [
  'NODE_ENV=development',
  'PORT=3000',
  'WS_PORT=3001',
  `MONGODB_URI=mongodb://admin:${mongodbPassword}@localhost:27017/selfhostchat?authSource=admin`,
  `MONGODB_PASSWORD=${mongodbPassword}`,
  `REDIS_URI=redis://default:${redisPassword}@localhost:6379`,
  `REDIS_PASSWORD=${redisPassword}`,
  `RABBITMQ_URI=amqp://admin:${rabbitmqPassword}@localhost:5672`,
  `RABBITMQ_PASSWORD=${rabbitmqPassword}`,
  `JWT_SECRET=${generateSecret()}`,
  'MINIO_ENDPOINT=localhost',
  'MINIO_PORT=9000',
  'MINIO_USE_SSL=false',
  `MINIO_ACCESS_KEY=${generatePassword(12)}`,
  `MINIO_SECRET_KEY=${generatePassword(24)}`,
  'MINIO_BUCKET=selfhostchat',
  'REDIS_PORT=6379',
  'RABBITMQ_PORT=5672',
  'RABBITMQ_MANAGEMENT_PORT=15672',
  'MINIO_CONSOLE_PORT=9001',
];

const exampleContent = requiredVars.join('\n') + '\n';
writeFileSync(envExamplePath, exampleContent);
console.log('✅ .env.example updated');

if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8');
  const hasAllVars = requiredVars.every((line) => {
    const key = line.split('=')[0];
    return content.includes(`${key}=`);
  });
  if (hasAllVars) {
    console.log('ℹ️  .env already exists with all required vars, skipping');
  } else {
    writeFileSync(envPath, exampleContent);
    console.log('\n⚠️  .env was missing vars, regenerated. Restart Docker containers.\n');
  }
} else {
  writeFileSync(envPath, exampleContent);
  console.log('✅ .env created');
  console.log('\n⚠️  Restart Docker containers after updating .env\n');
}
