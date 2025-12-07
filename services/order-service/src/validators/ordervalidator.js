const { z } = require('zod');

const orderSchema = z.object({
  customerId: z.string(),
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      quantity: z.number().int().min(1),
      price: z.number().positive()
    })
  ).min(1)
});

function validateOrder(data) {
  return orderSchema.safeParse(data);
}

module.exports = { validateOrder };
