const isDev = process.env.NODE_ENV === 'development';

const logger = {
  info: (message, data = null) => {
    if (isDev) {
      console.log(`[INFO] ${message}`, data || '');
    }
  },
  warn: (message, data = null) => {
    if (isDev) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  },
  error: (message, error = null) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  debug: (message, data = null) => {
    if (isDev && process.env.DEBUG) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  }
};

module.exports = logger;