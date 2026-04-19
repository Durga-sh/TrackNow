/**
 * Email template for order creation confirmation.
 * @param {Object} order - The order event data
 * @returns {Object} - { subject, html }
 */
function orderCreatedTemplate(order) {
  const itemRows = (order.items || []).map(item => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  return {
    subject: `Order Confirmed — ${order.orderId}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">🎉 Order Confirmed!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Thank you for your order</p>
        </div>
        
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; margin-bottom: 16px;">
            <tr>
              <td style="color: #6b7280; font-size: 14px;">Order ID</td>
              <td style="font-weight: 600; text-align: right;">${order.orderId}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; font-size: 14px;">Customer</td>
              <td style="font-weight: 600; text-align: right;">${order.customerId}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; font-size: 14px;">Status</td>
              <td style="text-align: right;">
                <span style="background: #d1fae5; color: #065f46; padding: 2px 10px; border-radius: 12px; font-size: 13px; font-weight: 600;">
                  ${order.status}
                </span>
              </td>
            </tr>
          </table>

          <h3 style="color: #374151; margin: 20px 0 8px;">Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #6b7280;">Product</th>
                <th style="padding: 8px 12px; text-align: center; font-size: 13px; color: #6b7280;">Qty</th>
                <th style="padding: 8px 12px; text-align: right; font-size: 13px; color: #6b7280;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e5e7eb; text-align: right;">
            <span style="font-size: 18px; font-weight: 700; color: #111827;">Total: $${(order.totalAmount || 0).toFixed(2)}</span>
          </div>

          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; text-align: center;">
            TrackNow — Real-time Order Tracking
          </p>
        </div>
      </div>
    `
  };
}

module.exports = { orderCreatedTemplate };
