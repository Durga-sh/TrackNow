/**
 * Format date to ISO string
 */
function formatDate(date = new Date()) {
  return date.toISOString();
}

/**
 * Generate order key for Redis
 */
function getOrderKey(orderId) {
  return `order:${orderId}`;
}

/**
 * Generate order history key for Redis
 */
function getOrderHistoryKey(orderId) {
  return `order:${orderId}:history`;
}

/**
 * Sleep utility for delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
async function retry(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(delay * Math.pow(2, i));
    }
  }
}

/**
 * Parse JSON safely
 */
function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

/**
 * Calculate pagination metadata
 */
function getPaginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

module.exports = {
  formatDate,
  getOrderKey,
  getOrderHistoryKey,
  sleep,
  retry,
  safeJsonParse,
  getPaginationMeta
};
