// Sync Logger utility
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class SyncLogger {
  constructor() {
    this.logFile = path.join(logsDir, 'sync.log');
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to sync log:', error);
    }
    
    // Also log to console
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data);
  }

  syncStart(type, data = {}) {
    this.log('info', `Sync started: ${type}`, data);
  }

  syncSuccess(type, data = {}) {
    this.log('success', `Sync completed successfully: ${type}`, data);
  }

  syncError(type, error, data = {}) {
    this.log('error', `Sync failed: ${type}`, { error: error.message, stack: error.stack, ...data });
  }

  clientSync(clientId, companyName, stage, level, data = {}) {
    this.log(level, `Client sync [${clientId}] ${companyName}: ${stage}`, data);
  }

  financialDataSync(clientId, oldData, newData) {
    this.log('info', `Financial data sync for client ${clientId}`, { oldData, newData });
  }

  syncPerformance(type, duration, count) {
    this.log('info', `Sync performance: ${type}`, { duration, count });
  }
}

const syncLogger = new SyncLogger();

module.exports = { syncLogger };