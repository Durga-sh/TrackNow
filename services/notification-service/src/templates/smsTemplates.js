
function orderCreatedSMS(order) {
  const itemCount = (order.items || []).length;
  return {
    message: `TrackNow: Your order ${order.orderId.substring(0, 8)}... is confirmed! ${itemCount} item(s), Total: $${(order.totalAmount || 0).toFixed(2)}. Track your order at tracknow.app`
  };
}

function statusChangedSMS(event) {
  return {
    message: `TrackNow: Order ${event.orderId.substring(0, 8)}... status changed from ${event.previousStatus} → ${event.currentStatus}.${event.notes ? ' Note: ' + event.notes.substring(0, 50) : ''}`
  };
}

module.exports = { orderCreatedSMS, statusChangedSMS };
