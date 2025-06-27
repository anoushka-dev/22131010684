// src/logger.js
// Custom logging middleware for React (no console.log or built-in loggers)
// Usage: import logger from './logger'; logger('message', data)

const logs = [];

function logger(message, data) {
  const entry = {
    timestamp: new Date().toISOString(),
    message,
    data,
  };
  logs.push(entry);
  // Optionally, trigger a callback or event for log listeners
}

logger.getLogs = () => logs.slice();

export default logger;
