const mode = process.argv?.[process.argv.indexOf('--mode') + 1] ?? 'root';
if (process.env.CI) {
  console.log('CI mode: skipping env setup');
  process.exit(0);
}

const { existsSync, writeFileSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { randomBytes } = require('node:crypto');

const rootDir = process.cwd();
const envRootPath = join(rootDir, '.env');
const envRootExamplePath = join(rootDir, '.env.example');
const envDockerPath = join(rootDir, 'docker', '.env.docker');
const envExampleDockerPath = join(rootDir, 'docker', '.env.docker.example');
let envPath = envRootPath;
let envExamplePath = envRootExamplePath;

const generateSecret = (length = 32) => randomBytes(length).toString('hex');
const generatePassword = (length = 16) => randomBytes(length).toString('base64url');

const redisPassword = generatePassword(16);
const rabbitmqPassword = generatePassword(16);
const mongoDBName = 'selfhostchat';
const mongodbPassword = generatePassword(16);
const mongoDBUsername = `user${generateSecret(4)}`;
let mongoDBPort = 33701;
const redisPort = 33702;
const rabbitmqPort = 33703;
const rabbitmqManagementPort = 33704;
const minioPort = 33705;
const minioConsolePort = 33706;

const vars = {
  NODE_ENV: 'development',
  PORT: '3000',
  WS_PORT: '3001',
  
  // MongoDB
  MONGO_INITDB_ROOT_USERNAME: `root${generateSecret(4)}`,
  MONGO_INITDB_ROOT_PASSWORD: generatePassword(16),
  MONGO_DATABASE_NAME: mongoDBName,
  MONGODB_PORT: mongoDBPort,
  MONGO_USERNAME: mongoDBUsername,
  MONGO_PASSWORD: mongodbPassword,
  MONGODB_URI: `mongodb://${mongoDBUsername}:${mongodbPassword}@localhost:${mongoDBPort}/${mongoDBName}?authSource=${mongoDBName}`,

  REDIS_PORT: redisPort,
  REDIS_PASSWORD: generatePassword(16),
  REDIS_URI: `redis://default:${redisPassword}@localhost:${redisPort}`,
  RABBITMQ_PORT: rabbitmqPort,
  RABBITMQ_MANAGEMENT_PORT: rabbitmqManagementPort,
  RABBITMQ_PASSWORD: rabbitmqPassword,
  RABBITMQ_URI: `amqp://admin:${rabbitmqPassword}@localhost:${rabbitmqPort}`,
  MINIO_ENDPOINT: 'localhost',
  MINIO_USE_SSL: 'false',
  MINIO_BUCKET: 'selfhostchat',
  MINIO_PORT: minioPort,
  MINIO_CONSOLE_PORT: minioConsolePort,
  MINIO_ACCESS_KEY: generatePassword(12),
  MINIO_SECRET_KEY: generatePassword(24),
  JWT_SECRET: generateSecret(),
};

switch (mode) {
  case 'root':
    break;
  case 'docker':
    envPath = envDockerPath;
    envExamplePath = envExampleDockerPath;
    mongoDBPort = 27017;
    vars.MONGODB_PORT = mongoDBPort;
    vars.MONGODB_URI = `mongodb://${mongoDBUsername}:${mongodbPassword}@mongodb:${mongoDBPort}/${mongoDBName}?authSource=${mongoDBName}`;
    break;
  default:
    console.error(`Invalid mode: '${mode}'`);
    console.error('Usage: node scripts/setup-env.js --mode <root|docker>');
    process.exit(1);
}

const requiredVars = Object.entries(vars).map(([key, value]) => `${key}=${value}`);
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
}
