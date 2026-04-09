const Joi = require('joi');

const schemas = {
  createOrder: Joi.object({
    customerId: Joi.string().min(1).max(100).required(),
    items: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string().required(),
          name: Joi.string().required(),
          quantity: Joi.number().integer().min(1).required(),
          price: Joi.number().positive().required()
        })
      )
      .min(1)
      .required()
  }),

  updateStatus: Joi.object({
    status: Joi.string()
      .valid('CREATED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')
      .required(),
    notes: Joi.string().allow('').max(500).optional()
  }),

  orderId: Joi.string()
    .uuid()
    .required()
};

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return { valid: false, errors };
  }
  
  return { valid: true, value };
}

module.exports = {
  schemas,
  validate
};
