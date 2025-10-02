/**
 * Rate limiter configuration options
 */
export interface RateLimiterConfig {
  // Basic rate limiting
  maxRequests: number;
  windowMs: number; // Time window in milliseconds

  // Advanced options
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string) => string;

  // Response options
  message?: string;
  statusCode?: number;

  // Reset behavior
  resetTime?: number;

  // Logging
  enableLogging?: boolean;
}

/**
 * Rate limit status information
 */
export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
  isExceeded: boolean;
}

/**
 * Internal rate limit tracking data
 */
interface RateLimitData {
  count: number;
  resetTime: number;
  firstRequest: number;
}

/**
 * Default configuration for rate limiter
 */
const DEFAULT_CONFIG: Required<RateLimiterConfig> = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (identifier: string) => identifier,
  message: 'Too many requests, please try again later.',
  statusCode: 429,
  resetTime: 0,
  enableLogging: true,
};

/**
 * Rate limiter implementation for controlling request frequency
 * Supports per-user rate limiting with sliding window algorithm
 */
export class RateLimiter {
  private config: Required<RateLimiterConfig>;
  private store: Map<string, RateLimitData> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config?: Partial<RateLimiterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupTask();
  }

  /**
   * Check if request is within rate limit
   */
  public async checkLimit(identifier: string): Promise<RateLimitInfo> {
    const key = this.config.keyGenerator(identifier);
    const now = Date.now();

    // Get or create rate limit data
    let data = this.store.get(key);

    if (!data || now >= data.resetTime) {
      // Create new window or reset expired window
      data = {
        count: 0,
        resetTime: now + this.config.windowMs,
        firstRequest: now,
      };
      this.store.set(key, data);
    }

    // Check if limit is exceeded
    const isExceeded = data.count >= this.config.maxRequests;

    if (!isExceeded) {
      data.count++;
    }

    const rateLimitInfo: RateLimitInfo = {
      limit: this.config.maxRequests,
      current: data.count,
      remaining: Math.max(0, this.config.maxRequests - data.count),
      resetTime: new Date(data.resetTime),
      isExceeded,
    };

    if (this.config.enableLogging && isExceeded) {
      console.warn(`[RateLimiter] Rate limit exceeded for ${identifier}:`, rateLimitInfo);
    }

    return rateLimitInfo;
  }

  /**
   * Check if request would exceed rate limit without incrementing counter
   */
  public async checkLimitDryRun(identifier: string): Promise<RateLimitInfo> {
    const key = this.config.keyGenerator(identifier);
    const now = Date.now();

    const data = this.store.get(key);

    if (!data || now >= data.resetTime) {
      // Would create new window
      return {
        limit: this.config.maxRequests,
        current: 0,
        remaining: this.config.maxRequests,
        resetTime: new Date(now + this.config.windowMs),
        isExceeded: false,
      };
    }

    const isExceeded = data.count >= this.config.maxRequests;

    return {
      limit: this.config.maxRequests,
      current: data.count,
      remaining: Math.max(0, this.config.maxRequests - data.count),
      resetTime: new Date(data.resetTime),
      isExceeded,
    };
  }

  /**
   * Reset rate limit for a specific identifier
   */
  public resetLimit(identifier: string): void {
    const key = this.config.keyGenerator(identifier);
    this.store.delete(key);

    if (this.config.enableLogging) {
      console.info(`[RateLimiter] Rate limit reset for ${identifier}`);
    }
  }

  /**
   * Reset all rate limits
   */
  public resetAllLimits(): void {
    this.store.clear();

    if (this.config.enableLogging) {
      console.info('[RateLimiter] All rate limits reset');
    }
  }

  /**
   * Get current rate limit status for identifier
   */
  public getCurrentStatus(identifier: string): RateLimitInfo | null {
    const key = this.config.keyGenerator(identifier);
    const data = this.store.get(key);
    const now = Date.now();

    if (!data || now >= data.resetTime) {
      return null;
    }

    return {
      limit: this.config.maxRequests,
      current: data.count,
      remaining: Math.max(0, this.config.maxRequests - data.count),
      resetTime: new Date(data.resetTime),
      isExceeded: data.count >= this.config.maxRequests,
    };
  }

  /**
   * Get all active rate limits
   */
  public getAllActiveStatuses(): Map<string, RateLimitInfo> {
    const activeStatuses = new Map<string, RateLimitInfo>();
    const now = Date.now();

    for (const [key, data] of this.store.entries()) {
      if (now < data.resetTime) {
        activeStatuses.set(key, {
          limit: this.config.maxRequests,
          current: data.count,
          remaining: Math.max(0, this.config.maxRequests - data.count),
          resetTime: new Date(data.resetTime),
          isExceeded: data.count >= this.config.maxRequests,
        });
      }
    }

    return activeStatuses;
  }

  /**
   * Update rate limiter configuration
   */
  public updateConfig(newConfig: Partial<RateLimiterConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.config.enableLogging) {
      console.info('[RateLimiter] Configuration updated:', newConfig);
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): RateLimiterConfig {
    return { ...this.config };
  }

  /**
   * Get rate limiter statistics
   */
  public getStats(): {
    activeUsers: number;
    totalRequests: number;
    averageRequestsPerUser: number;
    exceededUsers: number;
  } {
    const now = Date.now();
    let totalRequests = 0;
    let exceededUsers = 0;
    let activeUsers = 0;

    for (const data of this.store.values()) {
      if (now < data.resetTime) {
        activeUsers++;
        totalRequests += data.count;
        if (data.count >= this.config.maxRequests) {
          exceededUsers++;
        }
      }
    }

    return {
      activeUsers,
      totalRequests,
      averageRequestsPerUser: activeUsers > 0 ? totalRequests / activeUsers : 0,
      exceededUsers,
    };
  }

  /**
   * Check if rate limiter should skip the request based on configuration
   */
  public shouldSkipRequest(wasSuccessful: boolean): boolean {
    if (wasSuccessful && this.config.skipSuccessfulRequests) {
      return true;
    }

    if (!wasSuccessful && this.config.skipFailedRequests) {
      return true;
    }

    return false;
  }

  /**
   * Manually increment counter for identifier (useful for retroactive counting)
   */
  public incrementCounter(identifier: string): RateLimitInfo {
    const key = this.config.keyGenerator(identifier);
    const now = Date.now();

    let data = this.store.get(key);

    if (!data || now >= data.resetTime) {
      // Create new window
      data = {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequest: now,
      };
      this.store.set(key, data);
    } else {
      data.count++;
    }

    const isExceeded = data.count >= this.config.maxRequests;

    return {
      limit: this.config.maxRequests,
      current: data.count,
      remaining: Math.max(0, this.config.maxRequests - data.count),
      resetTime: new Date(data.resetTime),
      isExceeded,
    };
  }

  /**
   * Start cleanup task to remove expired entries
   */
  private startCleanupTask(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredEntries();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, data] of this.store.entries()) {
      if (now >= data.resetTime) {
        this.store.delete(key);
        cleanedCount++;
      }
    }

    if (this.config.enableLogging && cleanedCount > 0) {
      console.debug(`[RateLimiter] Cleaned up ${cleanedCount} expired entries`);
    }
  }

  /**
   * Destroy rate limiter and cleanup resources
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    this.store.clear();

    if (this.config.enableLogging) {
      console.info('[RateLimiter] Rate limiter destroyed');
    }
  }
}
