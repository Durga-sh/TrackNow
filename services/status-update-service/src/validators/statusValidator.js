const Joi = require('joi');

const statusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('CREATED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')
    .required(),
  notes: Joi.string().allow('').optional()
});

function validateStatusUpdate(data) {
  return statusUpdateSchema.validate(data);
}

module.exports = { validateStatusUpdate };
