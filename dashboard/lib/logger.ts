/**
 * Structured logging utility for Pi Sensor Dashboard
 *
 * Provides consistent logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Structured context data
 * - Request correlation IDs
 * - Performance tracking
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  // Request context
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;

  // Error context
  errorCode?: string;
  errorDetails?: unknown;
  stack?: string;

  // Performance context
  duration?: number;
  timestamp?: string;

  // Additional context
  [key: string]: unknown;
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    // Break circular dependency: Check NODE_ENV directly instead of importing env
    const nodeEnv = process.env.NODE_ENV || 'development';
    this.isDevelopment = nodeEnv === 'development';
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  /**
   * Log a debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log(LogLevel.INFO, message, context);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log(LogLevel.WARN, message, context);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext: LogContext = {
        ...context,
        errorDetails: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
      };

      this.log(LogLevel.ERROR, message, errorContext);
    }
  }

  /**
   * Track performance of an operation
   */
  async trackPerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      this.info(`${operation} completed`, {
        ...context,
        duration,
        status: 'success',
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.error(`${operation} failed`, error, {
        ...context,
        duration,
        status: 'error',
      });

      throw error;
    }
  }

  /**
   * Create a child logger with preset context
   */
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minIndex = levels.indexOf(this.minLevel);
    const currentIndex = levels.indexOf(level);
    return currentIndex >= minIndex;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    // In development, use pretty console output
    if (this.isDevelopment) {
      this.prettyLog(level, message, context);
    } else {
      // In production, use structured JSON logging
      console.log(JSON.stringify(logEntry));
    }
  }

  private prettyLog(level: LogLevel, message: string, context?: LogContext): void {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
    };

    const reset = '\x1b[0m';
    const timestamp = new Date().toISOString();
    const color = colors[level];

    const prefix = `${color}[${level.toUpperCase()}]${reset} ${timestamp}`;

    console.log(`${prefix} ${message}`);

    if (context && Object.keys(context).length > 0) {
      console.log('  Context:', context);
    }
  }
}

/**
 * Child logger with preset context
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private context: LogContext
  ) {}

  debug(message: string, additionalContext?: LogContext): void {
    this.parent.debug(message, { ...this.context, ...additionalContext });
  }

  info(message: string, additionalContext?: LogContext): void {
    this.parent.info(message, { ...this.context, ...additionalContext });
  }

  warn(message: string, additionalContext?: LogContext): void {
    this.parent.warn(message, { ...this.context, ...additionalContext });
  }

  error(message: string, error?: Error | unknown, additionalContext?: LogContext): void {
    this.parent.error(message, error, { ...this.context, ...additionalContext });
  }

  async trackPerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    additionalContext?: LogContext
  ): Promise<T> {
    return this.parent.trackPerformance(operation, fn, {
      ...this.context,
      ...additionalContext,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types
export type { ChildLogger };
