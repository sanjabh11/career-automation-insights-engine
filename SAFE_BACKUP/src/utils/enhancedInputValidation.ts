
import { z } from 'zod';

// Enhanced input validation schemas
export const occupationSearchSchema = z.object({
  searchTerm: z.string()
    .min(1, 'Search term is required')
    .max(100, 'Search term too long')
    .regex(/^[a-zA-Z0-9\s\-\.\/]+$/, 'Invalid characters in search term')
    .transform(str => str.trim()),
  
  filters: z.object({
    categories: z.array(z.string()).optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
    location: z.string().max(50).optional(),
    salaryRange: z.object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional()
    }).optional()
  }).optional()
});

export const occupationCodeSchema = z.string()
  .regex(/^\d{2}-\d{4}\.\d{2}$/, 'Invalid O*NET occupation code format')
  .max(10);

export const userProfileSchema = z.object({
  fullName: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\-\'\.]+$/, 'Name contains invalid characters'),
  
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email too long'),
  
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    emailNotifications: z.boolean().optional(),
    autoSaveAnalyses: z.boolean().optional(),
    defaultExportFormat: z.enum(['csv', 'pdf', 'json']).optional()
  }).optional()
});

export const analysisNotesSchema = z.object({
  notes: z.string()
    .max(1000, 'Notes too long')
    .optional(),
  
  tags: z.array(z.string()
    .min(1, 'Tag cannot be empty')
    .max(20, 'Tag too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Tag contains invalid characters')
  ).max(10, 'Too many tags').optional()
});

// Security validation functions
export function validateAndSanitizeInput<T>(
  input: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      success: false,
      errors: ['Invalid input format']
    };
  }
}

// XSS prevention
export function sanitizeHtml(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// SQL injection prevention for dynamic queries
export function escapeSqlString(input: string): string {
  return input.replace(/'/g, "''");
}

// Rate limiting token bucket
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  consume(tokens = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getRemainingTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

// Input validation middleware
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (input: unknown) => {
    const validation = validateAndSanitizeInput(input, schema);
    
    if (!validation.success) {
      // Fix: only access errors if validation.success is false
      const errorList = "errors" in validation ? validation.errors : ["Unknown validation error"];
      throw new Error(`Validation failed: ${errorList.join(', ')}`);
    }
    
    return validation.data;
  };
}

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type),
      'Invalid file type'
    ),
  
  description: z.string()
    .max(200, 'Description too long')
    .optional()
});

// URL validation
export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

// Phone number validation
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(phone) && cleanPhone.length >= 7 && cleanPhone.length <= 15;
}

// Credit card validation (Luhn algorithm)
export function validateCreditCard(cardNumber: string): boolean {
  const cleanNumber = cardNumber.replace(/\s+/g, '');
  
  if (!/^\d+$/.test(cleanNumber)) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}
