
/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

export const sanitizeSearchInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove HTML tags and scripts
  const htmlStripped = input.replace(/<[^>]*>/g, '');
  
  // Remove potentially dangerous characters
  const sanitized = htmlStripped
    .replace(/[<>'"&]/g, (char) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    })
    .trim();
  
  // Limit length to prevent DoS
  return sanitized.substring(0, 500);
};

export const sanitizeOccupationCode = (code: string): string => {
  if (!code || typeof code !== 'string') return '';
  
  // O*NET codes should follow pattern: XX-XXXX.XX
  const codePattern = /^[\d\-\.]+$/;
  const cleanCode = code.trim().replace(/[^0-9\-\.]/g, '');
  
  if (!codePattern.test(cleanCode)) {
    throw new Error('Invalid occupation code format');
  }
  
  return cleanCode.substring(0, 20); // Reasonable limit
};

export const validateEmail = (email: string): boolean => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email) && email.length <= 254;
};

export const sanitizeUserInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>'"&]/g, (char) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    })
    .substring(0, 1000);
};
