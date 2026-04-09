const Joi = require('joi');

const orderSchema = Joi.object({
  customerId: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      name: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      price: Joi.number().positive().required()
    })
  ).min(1).required()
});

function validateOrder(data) {
  return orderSchema.validate(data);
}

module.exports = { validateOrder };
