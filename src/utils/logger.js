// src/utils/logger.js
import fs from 'fs';
import path from 'path';
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

const {
  combine,
  timestamp,
  printf,
  colorize,
  errors,
  splat,
  json,
} = format;

const isProd = process.env.NODE_ENV === 'production';

// Ensure logs dir exists
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Pretty format for local dev
const devFormat = combine(
  colorize({ all: true }),
  timestamp(),
  errors({ stack: true }),
  splat(),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const rest = Object.keys(meta || {}).length ? JSON.stringify(meta) : '';
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack} ${rest}`
      : `[${timestamp}] ${level}: ${message} ${rest}`;
  })
);

// JSON for prod
const prodFormat = combine(timestamp(), errors({ stack: true }), splat(), json());

const rotateFile = new transports.DailyRotateFile({
  dirname: logsDir,
  filename: '%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info',
});

const logger = createLogger({
  level: isProd ? 'info' : 'debug',
  format: isProd ? prodFormat : devFormat,
  transports: [
    new transports.Console({ level: isProd ? 'info' : 'debug' }),
    ...(isProd ? [rotateFile] : []),
  ],
  exceptionHandlers: [
    new transports.Console(),
    ...(isProd ? [rotateFile] : []),
  ],
  rejectionHandlers: [
    new transports.Console(),
    ...(isProd ? [rotateFile] : []),
  ],
});

// Minimal helper so we can do logger.http() from morgan
logger.http = (msg, meta) => logger.info(msg, meta);

export default logger;
