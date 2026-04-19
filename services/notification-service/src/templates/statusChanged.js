/**
 * Email template for order status change notification.
 * @param {Object} event - The status change event data
 * @returns {Object} - { subject, html }
 */
function statusChangedTemplate(event) {
  const statusColors = {
    CREATED: { bg: '#dbeafe', text: '#1e40af' },
    CONFIRMED: { bg: '#d1fae5', text: '#065f46' },
    PROCESSING: { bg: '#fef3c7', text: '#92400e' },
    SHIPPED: { bg: '#e0e7ff', text: '#3730a3' },
    DELIVERED: { bg: '#d1fae5', text: '#065f46' },
    CANCELLED: { bg: '#fee2e2', text: '#991b1b' }
  };

  const prevColor = statusColors[event.previousStatus] || { bg: '#f3f4f6', text: '#374151' };
  const currColor = statusColors[event.currentStatus] || { bg: '#f3f4f6', text: '#374151' };

  return {
    subject: `Order ${event.orderId} — Status Updated to ${event.currentStatus}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">📦 Order Status Update</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Your order status has changed</p>
        </div>
        
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="color: #6b7280; font-size: 14px; padding: 4px 0;">Order ID</td>
              <td style="font-weight: 600; text-align: right;">${event.orderId}</td>
            </tr>
          </table>

          <div style="text-align: center; margin: 24px 0;">
            <span style="background: ${prevColor.bg}; color: ${prevColor.text}; padding: 6px 16px; border-radius: 16px; font-weight: 600; font-size: 14px;">
              ${event.previousStatus}
            </span>
            <span style="margin: 0 12px; font-size: 20px; color: #9ca3af;">→</span>
            <span style="background: ${currColor.bg}; color: ${currColor.text}; padding: 6px 16px; border-radius: 16px; font-weight: 600; font-size: 14px;">
              ${event.currentStatus}
            </span>
          </div>

          ${event.notes ? `
            <div style="background: #f9fafb; border-radius: 8px; padding: 12px 16px; margin-top: 16px;">
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px;">Notes</p>
              <p style="color: #374151; margin: 0;">${event.notes}</p>
            </div>
          ` : ''}

          <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
            Updated at: ${new Date(event.timestamp).toLocaleString()}
          </p>

          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; text-align: center;">
            TrackNow — Real-time Order Tracking
          </p>
        </div>
      </div>
    `
  };
}

module.exports = { statusChangedTemplate };
