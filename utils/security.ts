import AsyncStorage from '@react-native-async-storage/async-storage';

// Security utilities for input validation and sanitization
export class SecurityUtils {
  // Rate limiting storage
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  // Input sanitization
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove potentially dangerous characters
    return input
      .replace(/[<>\"'&]/g, '') // Remove HTML/JS injection chars
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim()
      .slice(0, 1000); // Limit length
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Validate date format (YYYY-MM-DD)
  static validateDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }

  // Validate time format (HH:MM)
  static validateTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  // Validate name (letters, spaces, hyphens, apostrophes only)
  static validateName(name: string): boolean {
    const nameRegex = /^[\p{L}\s\-'.]{1,50}$/u;
    return nameRegex.test(name);
  }

  // Validate place name
  static validatePlace(place: string): boolean {
    const placeRegex = /^[\p{L}\p{N}\s\-',.()]{1,100}$/u;
    return placeRegex.test(place);
  }

  // Rate limiting
  static checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const rateLimitKey = `rate_limit_${key}`;
    
    const existing = this.rateLimitStore.get(rateLimitKey);
    
    if (!existing || now > existing.resetTime) {
      this.rateLimitStore.set(rateLimitKey, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (existing.count >= maxRequests) {
      this.logSecurityEvent('rate_limit_exceeded', { key, count: existing.count });
      return false;
    }
    
    existing.count++;
    return true;
  }

  // Security event logging
  static logSecurityEvent(event: string, details: any = {}) {
    const timestamp = new Date().toISOString();
    console.warn(`[SECURITY] ${timestamp} - ${event}:`, details);
    
    // In production, you might want to send this to a security monitoring service
    // SecurityMonitoringService.log({ event, details, timestamp });
  }

  // Secure storage operations
  static async secureStore(key: string, value: string): Promise<boolean> {
    try {
      const sanitizedKey = this.sanitizeInput(key);
      const sanitizedValue = this.sanitizeInput(value);
      
      if (!sanitizedKey || sanitizedValue.length > 10000) {
        this.logSecurityEvent('invalid_storage_attempt', { key: sanitizedKey });
        return false;
      }
      
      await AsyncStorage.setItem(sanitizedKey, sanitizedValue);
      return true;
    } catch (error) {
      this.logSecurityEvent('storage_error', { key, error: (error as Error).message });
      return false;
    }
  }

  static async secureRetrieve(key: string): Promise<string | null> {
    try {
      const sanitizedKey = this.sanitizeInput(key);
      if (!sanitizedKey) return null;
      
      const value = await AsyncStorage.getItem(sanitizedKey);
      return value ? this.sanitizeInput(value) : null;
    } catch (error) {
      this.logSecurityEvent('retrieval_error', { key, error: (error as Error).message });
      return null;
    }
  }

  // Session validation
  static async validateSession(): Promise<boolean> {
    try {
      const sessionData = await this.secureRetrieve('user_session');
      if (!sessionData) return false;
      
      const session = JSON.parse(sessionData);
      const now = Date.now();
      
      // Check if session is expired (24 hours)
      if (session.timestamp && (now - session.timestamp) > 86400000) {
        await AsyncStorage.removeItem('user_session');
        return false;
      }
      
      return true;
    } catch (error) {
      this.logSecurityEvent('session_validation_error', { error: (error as Error).message });
      return false;
    }
  }

  // Clean up old rate limit entries
  static cleanupRateLimits() {
    const now = Date.now();
    for (const [key, value] of this.rateLimitStore.entries()) {
      if (now > value.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  // Enhanced error handling
  static handleSecureError(error: any, context: string): string {
    this.logSecurityEvent('error_handled', { context, error: error.message });
    
    // Don't expose sensitive error details to users
    if (error.message?.includes('auth')) {
      return 'Authentication error. Please try logging in again.';
    }
    
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (error.message?.includes('validation')) {
      return 'Please check your input and try again.';
    }
    
    return 'An error occurred. Please try again later.';
  }
}

// Cleanup rate limits every 5 minutes
setInterval(() => {
  SecurityUtils.cleanupRateLimits();
}, 300000);

// ---------------------------------------------------------------------------
// Compatibility named exports
// These wrap SecurityUtils to match the API shape expected by call sites in
// components/AstrologyAI.tsx and other consumers.
// ---------------------------------------------------------------------------
export const sanitizeInput = {
  text: (s: string) => SecurityUtils.sanitizeInput(s),
};

export const securityMonitor = {
  logSuspiciousActivity: (message: string, details: any = {}) =>
    SecurityUtils.logSecurityEvent('suspicious_activity: ' + message, details),
  logEvent: (message: string, details: any = {}) =>
    SecurityUtils.logSecurityEvent(message, details),
};

export const rateLimiter = {
  isAllowed: (userId: string, actionKey: string) =>
    SecurityUtils.checkRateLimit(`${userId}:${actionKey}`),
};