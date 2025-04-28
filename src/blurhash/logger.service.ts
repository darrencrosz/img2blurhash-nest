import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logDir = path.join(__dirname, '../../logs');
  private readonly accessLogPath = path.join(this.logDir, 'access.log');
  private readonly errorLogPath = path.join(this.logDir, 'error.log');
  private accessLogStream: fs.WriteStream;
  private errorLogStream: fs.WriteStream;

  constructor() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    this.accessLogStream = fs.createWriteStream(this.accessLogPath, { flags: 'a' });
    this.errorLogStream = fs.createWriteStream(this.errorLogPath, { flags: 'a' });
  }

  log(message: string, meta: Record<string, any> = {}) {
    this.writeLog('info', message, meta);
  }
  info(message: string, meta: Record<string, any> = {}) {
    this.writeLog('info', message, meta);
  }
  warn(message: string, meta: Record<string, any> = {}) {
    this.writeLog('warn', message, meta);
  }
  error(message: string, meta: Record<string, any> = {}) {
    this.writeLog('error', message, meta);
  }
  debug(message: string, meta: Record<string, any> = {}) {
    this.writeLog('debug', message, meta);
  }

  private writeLog(level: string, message: string, meta: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta,
    };
    const logString = JSON.stringify(logEntry) + '\n';
    if (level === 'error') {
      this.errorLogStream.write(logString);
      // eslint-disable-next-line no-console
      console.error(`[${timestamp}] [ERROR] ${message}`);
    } else {
      this.accessLogStream.write(logString);
      // eslint-disable-next-line no-console
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }
  }
}
