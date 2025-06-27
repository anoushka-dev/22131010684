// src/loggingMiddleware.js
// Higher-order function to wrap business logic with logging
import logger from './logger';

export function withLogging(fn, context) {
  return function(...args) {
    logger('Function called', { fn: fn.name, args, context });
    const result = fn.apply(this, args);
    logger('Function result', { fn: fn.name, result, context });
    return result;
  };
}
