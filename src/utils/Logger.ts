/**
 * Log levels in order of severity
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  category?: string;
  metadata?: Record<string, unknown>;
  error?: Error;
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFileLogging?: boolean;
  logFilePath?: string;
  maxLogEntries?: number;
  includeTimestamp?: boolean;
  includeLevel?: boolean;
  includeCategory?: boolean;
  dateFormat?: string;
}

/**
 * Logger interface for dependency injection
 */
export interface ILogger {
  debug(message: string, metadata?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, error?: Error, metadata?: Record<string, unknown>): void;
  log(level: LogLevel, message: string, metadata?: Record<string, unknown>, error?: Error): void;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: Required<Omit<LoggerConfig, 'logFilePath'>> &
  Pick<LoggerConfig, 'logFilePath'> = {
  level: 'info',
  enableConsole: true,
  enableFileLogging: false,
  logFilePath: undefined,
  maxLogEntries: 1000,
  includeTimestamp: true,
  includeLevel: true,
  includeCategory: true,
  dateFormat: 'ISO',
};

/**
 * Log level hierarchy for filtering
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Default logger implementation for the chatbot system
 * Provides structured logging with configurable output and filtering
 */
export class DefaultLogger implements ILogger {
  private config: Required<Omit<LoggerConfig, 'logFilePath'>> & Pick<LoggerConfig, 'logFilePath'>;
  private logHistory: LogEntry[] = [];
  private category?: string;

  constructor(config?: Partial<LoggerConfig>, category?: string) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.category = category;
  }

  /**
   * Create a logger with a specific category
   */
  public static createCategoryLogger(
    category: string,
    config?: Partial<LoggerConfig>
  ): DefaultLogger {
    return new DefaultLogger(config, category);
  }

  /**
   * Log debug message
   */
  public debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata);
  }

  /**
   * Log info message
   */
  public info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }

  /**
   * Log warning message
   */
  public warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }

  /**
   * Log error message
   */
  public error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata, error);
  }

  /**
   * Log message with specified level
   */
  public log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): void {
    // Check if this log level should be recorded
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      category: this.category,
      metadata,
      error,
    };

    // Add to history
    this.addToHistory(logEntry);

    // Output to console if enabled
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry);
    }

    // Output to file if enabled (placeholder for future implementation)
    if (this.config.enableFileLogging && this.config.logFilePath) {
      this.outputToFile(logEntry);
    }
  }

  /**
   * Set the minimum log level
   */
  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get the current log level
   */
  public getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Get log history
   */
  public getHistory(limit?: number): LogEntry[] {
    const history = [...this.logHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get logs by level
   */
  public getLogsByLevel(level: LogLevel, limit?: number): LogEntry[] {
    const filtered = this.logHistory.filter((entry) => entry.level === level);
    return limit ? filtered.slice(-limit) : filtered;
  }

  /**
   * Get logs by category
   */
  public getLogsByCategory(category: string, limit?: number): LogEntry[] {
    const filtered = this.logHistory.filter((entry) => entry.category === category);
    return limit ? filtered.slice(-limit) : filtered;
  }

  /**
   * Get logs since a specific time
   */
  public getLogsSince(since: Date, limit?: number): LogEntry[] {
    const filtered = this.logHistory.filter((entry) => entry.timestamp >= since);
    return limit ? filtered.slice(-limit) : filtered;
  }

  /**
   * Clear log history
   */
  public clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Get logging statistics
   */
  public getStats(): {
    totalLogs: number;
    logsByLevel: Record<LogLevel, number>;
    oldestLog?: Date;
    newestLog?: Date;
  } {
    const logsByLevel = this.logHistory.reduce(
      (acc, entry) => {
        acc[entry.level] = (acc[entry.level] || 0) + 1;
        return acc;
      },
      {} as Record<LogLevel, number>
    );

    const oldestEntry = this.logHistory.length > 0 ? this.logHistory[0] : undefined;
    const newestEntry = this.logHistory.length > 0 ? this.logHistory[this.logHistory.length - 1] : undefined;

    return {
      totalLogs: this.logHistory.length,
      logsByLevel,
      oldestLog: oldestEntry?.timestamp,
      newestLog: newestEntry?.timestamp,
    };
  }

  /**
   * Update logger configuration
   */
  public updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Add log entry to history with size management
   */
  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);

    // Trim history if it exceeds max size
    if (this.logHistory.length > this.config.maxLogEntries) {
      this.logHistory = this.logHistory.slice(-this.config.maxLogEntries);
    }
  }

  /**
   * Output log entry to console with formatting
   */
  private outputToConsole(entry: LogEntry): void {
    const parts: string[] = [];

    // Add timestamp
    if (this.config.includeTimestamp) {
      const timestamp =
        this.config.dateFormat === 'ISO'
          ? entry.timestamp.toISOString()
          : entry.timestamp.toLocaleString();
      parts.push(`[${timestamp}]`);
    }

    // Add level
    if (this.config.includeLevel) {
      parts.push(`[${entry.level.toUpperCase()}]`);
    }

    // Add category
    if (this.config.includeCategory && entry.category) {
      parts.push(`[${entry.category}]`);
    }

    // Add message
    parts.push(entry.message);

    const logMessage = parts.join(' ');

    // Use appropriate console method based on level
    switch (entry.level) {
      case 'debug':
        // eslint-disable-next-line no-console
        console.debug(logMessage, entry.metadata, entry.error);
        break;
      case 'info':
        // eslint-disable-next-line no-console
        console.info(logMessage, entry.metadata);
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(logMessage, entry.metadata, entry.error);
        break;
      case 'error':
        // eslint-disable-next-line no-console
        console.error(logMessage, entry.metadata, entry.error);
        break;
    }
  }

  /**
   * Output log entry to file (placeholder implementation)
   */
  private outputToFile(entry: LogEntry): void {
    // This is a placeholder for file logging functionality
    // In a real implementation, this would write to a file system
    // For now, we'll just store the intent to log to file
    const fileLogEntry = {
      ...entry,
      outputTarget: 'file',
      filePath: this.config.logFilePath,
    };

    // In MVP, we'll just add this to a separate in-memory store
    // Real implementation would use fs.appendFile or a logging library
    if (this.config.enableConsole) {
      // eslint-disable-next-line no-console
      console.debug('[Logger] Would write to file:', fileLogEntry);
    }
  }
}

/**
 * Null logger implementation for disabling logging
 */
export class NullLogger implements ILogger {
  public debug(): void {
    // No-op
  }

  public info(): void {
    // No-op
  }

  public warn(): void {
    // No-op
  }

  public error(): void {
    // No-op
  }

  public log(): void {
    // No-op
  }

  public setLevel(): void {
    // No-op
  }

  public getLevel(): LogLevel {
    return 'error';
  }
}

/**
 * Create a logger instance with category
 */
export function createLogger(category: string, config?: Partial<LoggerConfig>): ILogger {
  return DefaultLogger.createCategoryLogger(category, config);
}

/**
 * Create a null logger (disables all logging)
 */
export function createNullLogger(): ILogger {
  return new NullLogger();
}
