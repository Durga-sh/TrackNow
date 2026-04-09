# Shared Libraries

Common code, utilities, and configurations shared across all microservices.

## Contents

### constants.js
- Order status definitions
- Kafka topic names
- Redis key prefixes
- Event type names

### errors.js
- Custom error classes
- HTTP status code mappings
- Error handling utilities

### utils.js
- Date formatting
- Redis key generators
- Retry logic with exponential backoff
- Safe JSON parsing
- Pagination helpers

### validators.js
- Joi validation schemas
- Reusable validation functions
- Common input validation

## Usage

```javascript
// Import in any service
const { ORDER_STATUSES, KAFKA_TOPICS } = require('../../shared/constants');
const { ValidationError, NotFoundError } = require('../../shared/errors');
const { getOrderKey, retry } = require('../../shared/utils');
const { schemas, validate } = require('../../shared/validators');
```

## Benefits
- Consistent error handling
- Centralized constants
- Reusable validation logic
- DRY principle across services
