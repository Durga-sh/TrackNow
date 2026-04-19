/**
 * Quick standalone test — sends a test email via Ethereal.
 * No Kafka or MongoDB required.
 * 
 * Run: node test-email.js
 */
require('dotenv').config();

const { sendEmail, initTransporter } = require('./src/channels/emailChannel');
const { orderCreatedTemplate } = require('./src/templates/orderCreated');
const { statusChangedTemplate } = require('./src/templates/statusChanged');

async function runTest() {
  console.log('🚀 Initializing email transporter...\n');
  await initTransporter();

  // Test 1: Order Created Email
  console.log('📧 Test 1: Sending Order Created email...');
  const orderTemplate = orderCreatedTemplate({
    orderId: 'test-order-001',
    customerId: 'customer-123',
    status: 'CREATED',
    items: [
      { name: 'Wireless Mouse', quantity: 2, price: 29.99 },
      { name: 'USB-C Cable', quantity: 1, price: 12.50 }
    ],
    totalAmount: 72.48
  });

  const result1 = await sendEmail({
    to: 'customer@example.com',
    subject: orderTemplate.subject,
    html: orderTemplate.html
  });

  if (result1.success) {
    console.log('✅ Order Created email sent!');
    console.log(`   📬 Preview URL: ${result1.previewUrl}`);
  } else {
    console.log('❌ Failed:', result1.error);
  }

  // Test 2: Status Changed Email
  console.log('\n📧 Test 2: Sending Status Changed email...');
  const statusTemplate = statusChangedTemplate({
    orderId: 'test-order-001',
    previousStatus: 'CREATED',
    currentStatus: 'SHIPPED',
    notes: 'Package handed to courier',
    timestamp: new Date().toISOString()
  });

  const result2 = await sendEmail({
    to: 'customer@example.com',
    subject: statusTemplate.subject,
    html: statusTemplate.html
  });

  if (result2.success) {
    console.log('✅ Status Changed email sent!');
    console.log(`   📬 Preview URL: ${result2.previewUrl}`);
  } else {
    console.log('❌ Failed:', result2.error);
  }

  console.log('\n🎉 Done! Click the Preview URLs above to see the emails in your browser.');
}

runTest().catch(console.error);
