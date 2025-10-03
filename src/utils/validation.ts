/**
 * Enhanced input validation and sanitization utilities
 */

// Invalid characters for Windows file paths
const INVALID_PATH_CHARS = /[<>:"|?*]/;
const INVALID_NAME_CHARS = /[<>:"/\\|?*]/;

/**
 * Validate file paths
 */
export function validateFilePath(path: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!path || path.trim().length === 0) {
    errors.push('Path cannot be empty');
  }

  if (path.length > 260) {
    errors.push('Path too long (Windows limit)');
  }

  if (INVALID_PATH_CHARS.test(path)) {
    errors.push('Path contains invalid characters');
  }

  if (path.includes('..')) {
    errors.push('Path cannot contain directory traversal');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate mod names
 */
export function validateModName(name: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Mod name cannot be empty');
  }

  if (name.length > 100) {
    errors.push('Mod name too long');
  }

  if (INVALID_NAME_CHARS.test(name)) {
    errors.push('Mod name contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize file names for safe usage
 */
export function sanitizeFileName(fileName: string, options?: {
  replacement?: string;
  maxLength?: number;
}): string {
  const { replacement = '_', maxLength = 100 } = options || {};
  
  // Remove or replace invalid characters
  let sanitized = fileName
    .replace(/[<>:"/\\|?*]/g, replacement)
    .replace(/[\x00-\x1f]/g, '') // Remove control characters
    .replace(/^\.+/, '') // Remove leading dots
    .trim();

  // Ensure it's not empty
  if (sanitized.length === 0) {
    sanitized = 'unnamed';
  }

  // Truncate if too long
  if (sanitized.length > maxLength) {
    const ext = sanitized.lastIndexOf('.');
    if (ext > 0) {
      const name = sanitized.substring(0, ext);
      const extension = sanitized.substring(ext);
      sanitized = name.substring(0, maxLength - extension.length) + extension;
    } else {
      sanitized = sanitized.substring(0, maxLength);
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize file paths
 */
export function validateAndSanitizePath(path: string): {
  isValid: boolean;
  sanitized: string;
  errors: string[];
} {
  const validation = validateFilePath(path);
  
  // Sanitize path
  let sanitized = path
    .replace(/\\/g, '/') // Normalize separators
    .replace(/\/+/g, '/') // Remove duplicate separators
    .replace(/^\/+/, '') // Remove leading separators
    .replace(/\/+$/, ''); // Remove trailing separators

  return {
    isValid: validation.isValid,
    sanitized,
    errors: validation.errors
  };
}

/**
 * Validate settings object
 */
export function validateSettings(settings: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof settings !== 'object' || settings === null) {
    errors.push('Settings must be an object');
    return { isValid: false, errors };
  }

  const settingsObj = settings as Record<string, unknown>;

  // Validate number fields
  const numberFields = ['launch', 'hotReload', 'toggle', 'open', 'type', 'bgType', 'listType', 'nsfw'];
  numberFields.forEach(field => {
    if (settingsObj[field] !== undefined && typeof settingsObj[field] !== 'number') {
      errors.push(`${field} must be a number`);
    }
  });

  // Validate opacity (0-1 range)
  if (settingsObj.opacity !== undefined) {
    if (typeof settingsObj.opacity !== 'number' || settingsObj.opacity < 0 || settingsObj.opacity > 1) {
      errors.push('opacity must be a number between 0 and 1');
    }
  }

  // Validate string fields
  const stringFields = ['appDir', 'onlineType'];
  stringFields.forEach(field => {
    if (settingsObj[field] !== undefined && typeof settingsObj[field] !== 'string') {
      errors.push(`${field} must be a string`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Safe JSON parsing with error handling
 */
export function safeJsonParse<T = unknown>(json: string): {
  success: boolean;
  data?: T;
  error?: string;
} {
  try {
    const parsed = JSON.parse(json);
    return { success: true, data: parsed };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON'
    };
  }
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    new URL(url);
  } catch {
    errors.push('Invalid URL format');
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    errors.push('URL must use HTTP or HTTPS protocol');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}