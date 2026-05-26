const { existsSync, writeFileSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { randomBytes } = require('node:crypto');

const rootDir = process.cwd();
const envPath = join(rootDir, '.env');
const envExamplePath = join(rootDir, '.env.example');

const generateSecret = (length = 32) => randomBytes(length).toString('hex');
const generatePassword = (length = 16) => randomBytes(length).toString('base64url');

const redisPassword = generatePassword(16);
const rabbitmqPassword = generatePassword(16);
const mongoDBName = 'selfhostchat';
const mongodbPassword = generatePassword(16);
const mongoDBUsername = `user${generateSecret(4)}`;
const mongoDBPort = 33701;
const redisPort = 33702;
const rabbitmqPort = 33703;
const rabbitmqManagementPort = 33704;
const minioPort = 33705;
const minioConsolePort = 33706;

const requiredVars = [
  'NODE_ENV=development',
  'PORT=3000',
  'WS_PORT=3001',
  
  // MongoDB
  `MONGO_INITDB_ROOT_USERNAME=root${generateSecret(4)}`,
  `MONGO_INITDB_ROOT_PASSWORD=${generatePassword(16)}`,
  `MONGO_DATABASE_NAME=${mongoDBName}`,
  `MONGODB_PORT=${mongoDBPort}`,
  `MONGO_USERNAME=${mongoDBUsername}`,
  `MONGO_PASSWORD=${mongodbPassword}`,
  `MONGODB_URI=mongodb://${mongoDBUsername}:${mongodbPassword}@localhost:${mongoDBPort}/${mongoDBName}?authSource=${mongoDBName}`,

  // Redis
  `REDIS_PORT=${redisPort}`,
  `REDIS_PASSWORD=${redisPassword}`,
  `REDIS_URI=redis://default:${redisPassword}@localhost:${redisPort}`,

  // RabbitMQ
  `RABBITMQ_PORT=${rabbitmqPort}`,
  `RABBITMQ_MANAGEMENT_PORT=${rabbitmqManagementPort}`,
  `RABBITMQ_URI=amqp://admin:${rabbitmqPassword}@localhost:${rabbitmqPort}`,
  `RABBITMQ_PASSWORD=${rabbitmqPassword}`,

  // MinIO
  `MINIO_ENDPOINT=localhost`,
  `MINIO_PORT=${minioPort}`,
  `MINIO_CONSOLE_PORT=${minioConsolePort}`,
  'MINIO_USE_SSL=false',
  'MINIO_BUCKET=selfhostchat',
  `MINIO_ACCESS_KEY=${generatePassword(12)}`,
  `MINIO_SECRET_KEY=${generatePassword(24)}`,
  
  `JWT_SECRET=${generateSecret()}`,
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
