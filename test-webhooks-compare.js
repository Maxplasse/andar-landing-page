/**
 * Test script to compare different webhook endpoints
 */
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const crypto = require('crypto');

// First, ensure DEBUG_WEBHOOK is true in the environment
process.env.DEBUG_WEBHOOK = 'true';

async function testWebhook(endpoint) {
  console.log(`\n=== TESTING WEBHOOK: ${endpoint} ===`);
  console.log('Timestamp:', new Date().toISOString());
  
  // Create a mock checkout.session.completed event
  const mockEvent = {
    id: 'evt_' + crypto.randomBytes(16).toString('hex'),
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_' + crypto.randomBytes(16).toString('hex'),
        object: 'checkout.session',
        customer: 'cus_' + crypto.randomBytes(16).toString('hex'),
        customer_details: {
          email: 'm20plasse@gmail.com',
          name: 'Max Test Customer',
          phone: null,
          tax_exempt: 'none',
          tax_ids: []
        },
        amount_total: 2500,
        currency: 'eur',
        metadata: {
          membershipType: 'classic'
        },
        payment_status: 'paid',
        status: 'complete',
        mode: 'payment'
      }
    },
    type: 'checkout.session.completed'
  };
  
  try {
    console.log('Sending request to webhook...');
    console.log('Mock event type:', mockEvent.type);
    console.log('Customer email:', mockEvent.data.object.customer_details.email);
    console.log('Membership type:', mockEvent.data.object.metadata.membershipType);
    
    // In debug mode, when DEBUG_WEBHOOK=true, we don't need a signature header for testing
    // However, we'll include a special debugging query parameter to make it clear
    const response = await axios.post(`http://localhost:3000/api/${endpoint}?debug=true`, 
      mockEvent,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    console.log('\nWebhook response status:', response.status);
    console.log('Webhook response:', response.data);
    
    console.log(`\n✅ Test of ${endpoint} completed successfully`);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    console.error(`\n❌ Error testing ${endpoint}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      return { success: false, status: error.response.status, error: error.response.data };
    }
    return { success: false, error: error.message };
  }
}

async function checkEnvironmentVariables() {
  console.log('Checking environment variables:');
  console.log('- DEBUG_WEBHOOK:', process.env.DEBUG_WEBHOOK);
  console.log('- BREVO_API_KEY exists:', Boolean(process.env.BREVO_API_KEY));
  console.log('- BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL);
  console.log('- STRIPE_SECRET_KEY exists:', Boolean(process.env.STRIPE_SECRET_KEY));
  console.log('- STRIPE_CLI_WEBHOOK_SECRET exists:', Boolean(process.env.STRIPE_CLI_WEBHOOK_SECRET));
  
  // Check if essential variables are missing
  const missingVars = [];
  if (!process.env.BREVO_API_KEY) missingVars.push('BREVO_API_KEY');
  if (!process.env.BREVO_SENDER_EMAIL) missingVars.push('BREVO_SENDER_EMAIL');
  if (!process.env.STRIPE_SECRET_KEY) missingVars.push('STRIPE_SECRET_KEY');
  
  if (missingVars.length > 0) {
    console.error('⚠️ Missing essential environment variables:', missingVars.join(', '));
    return false;
  }
  
  console.log('✅ All essential environment variables present');
  return true;
}

async function runTests() {
  // Check environment variables first
  console.log('=== ENVIRONMENT CHECK ===');
  const envOk = await checkEnvironmentVariables();
  if (!envOk) {
    console.log('⚠️ Environment variables are missing. This may cause the tests to fail.');
  }
  
  // Test both webhooks
  console.log('\n=== STARTING WEBHOOK TESTS ===');
  
  try {
    // Test the main webhook
    const mainResult = await testWebhook('webhook');
    
    // Test the debug webhook
    const debugResult = await testWebhook('webhook-debug');
    
    // Compare results
    console.log('\n=== TEST RESULTS SUMMARY ===');
    console.log('Main webhook (webhook.ts):', mainResult.success ? '✅ PASSED' : '❌ FAILED');
    console.log('Debug webhook (webhook-debug.ts):', debugResult.success ? '✅ PASSED' : '❌ FAILED');
    
    // Provide diagnosis
    console.log('\n=== DIAGNOSIS ===');
    if (mainResult.success && debugResult.success) {
      console.log('Both webhooks responded successfully, but emails might not be sending.');
      console.log('Check the server logs for more details on email sending.');
    } else if (!mainResult.success && debugResult.success) {
      console.log('The main webhook is failing but the debug webhook works.');
      console.log('This suggests an issue specific to the main webhook code.');
    } else if (mainResult.success && !debugResult.success) {
      console.log('The main webhook works but the debug webhook is failing.');
      console.log('This is unusual since the debug webhook should be more permissive.');
    } else {
      console.log('Both webhooks are failing. This could indicate:');
      console.log('1. Issues with environment variables');
      console.log('2. Problems with the Brevo API connection');
      console.log('3. Network connectivity issues');
    }
  } catch (err) {
    console.error('Error running tests:', err);
  }
}

// Run the tests
runTests().then(() => {
  console.log('\nTests completed.');
}); 