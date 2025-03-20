require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const crypto = require('crypto');

console.log('=== WEBHOOK ENVIRONMENT TEST ===');
console.log('Timestamp:', new Date().toISOString());

// Create a mock webhook event
const createMockEvent = () => {
  return {
    id: 'evt_test_' + Math.random().toString(36).substring(2, 15),
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_' + Math.random().toString(36).substring(2, 15),
        object: 'checkout.session',
        created: Math.floor(Date.now() / 1000),
        customer: 'cus_test_' + Math.random().toString(36).substring(2, 10),
        customer_details: {
          email: 'm20plasse@gmail.com',
          name: 'Test User',
          phone: null,
          tax_exempt: 'none',
          tax_ids: []
        },
        metadata: {
          membershipType: 'digital'
        },
        amount_total: 3200, // €32.00
        client_reference_id: null,
        payment_intent: 'pi_test_' + Math.random().toString(36).substring(2, 15),
        livemode: false,
      }
    }
  };
};

// Function to sign a payload with a secret
const generateSignature = (payload, secret) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return {
    timestamp,
    signature,
    signedPayload
  };
};

// Test the webhook
async function testWebhook() {
  console.log('\n--- TESTING WEBHOOK ENDPOINT ---');
  
  try {
    const webhookUrl = 'http://localhost:3000/api/webhook';
    console.log('Target webhook URL:', webhookUrl);
    
    // Get the webhook secret from environment
    const webhookSecret = process.env.STRIPE_CLI_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('❌ Webhook secret not found in environment variables!');
      console.log('Please set either STRIPE_CLI_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET');
      return false;
    }
    
    console.log('Webhook secret prefix:', webhookSecret.substring(0, 10) + '...');
    
    // Create mock event
    const mockEvent = createMockEvent();
    console.log('Created mock event:', mockEvent.id);
    console.log('Event type:', mockEvent.type);
    console.log('Customer email:', mockEvent.data.object.customer_details.email);
    
    // Sign the payload
    const { timestamp, signature, signedPayload } = generateSignature(mockEvent, webhookSecret);
    console.log('Generated signature:', signature.substring(0, 10) + '...');
    
    // Set up headers
    const headers = {
      'Content-Type': 'application/json',
      'Stripe-Signature': `t=${timestamp},v1=${signature}`
    };
    
    console.log('Sending request to webhook...');
    
    // Send the request
    const response = await axios.post(webhookUrl, mockEvent, { headers });
    
    console.log('Webhook response status:', response.status);
    console.log('Webhook response data:', response.data);
    
    if (response.status === 200) {
      console.log('✅ WEBHOOK TEST SUCCESSFUL!');
      return true;
    } else {
      console.error('❌ Webhook test failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run in debug mode to bypass signature verification
async function testWebhookDebugMode() {
  console.log('\n--- TESTING WEBHOOK IN DEBUG MODE ---');
  
  try {
    // Debug mode will bypass signature verification but requires the debug flag
    const needsDebugMode = process.env.DEBUG_WEBHOOK !== 'true';
    
    if (needsDebugMode) {
      console.log('⚠️ DEBUG_WEBHOOK is not set to true in the environment.');
      console.log('To test in debug mode, set DEBUG_WEBHOOK=true in your .env.local file.');
      console.log('Continuing with standard test...');
      return await testWebhook();
    }
    
    const webhookUrl = 'http://localhost:3000/api/webhook';
    console.log('Target webhook URL (debug mode):', webhookUrl);
    
    // Create mock event
    const mockEvent = createMockEvent();
    console.log('Created mock event:', mockEvent.id);
    console.log('Event type:', mockEvent.type);
    console.log('Customer email:', mockEvent.data.object.customer_details.email);
    
    // Set up headers - still include a fake signature header even in debug mode
    const timestamp = Math.floor(Date.now() / 1000);
    const headers = {
      'Content-Type': 'application/json',
      'Stripe-Signature': `t=${timestamp},v1=fake_signature_for_debug_mode`
    };
    
    console.log('Sending request to webhook in debug mode...');
    console.log('Using fake signature header (debug mode)');
    
    // Send the request
    const response = await axios.post(webhookUrl, mockEvent, { headers });
    
    console.log('Webhook response status:', response.status);
    console.log('Webhook response data:', response.data);
    
    if (response.status === 200) {
      console.log('✅ WEBHOOK DEBUG TEST SUCCESSFUL!');
      return true;
    } else {
      console.error('❌ Webhook debug test failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing webhook in debug mode:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Test the debug webhook endpoint
async function testDebugWebhookEndpoint() {
  console.log('\n--- TESTING DEBUG WEBHOOK ENDPOINT ---');
  
  try {
    const webhookUrl = 'http://localhost:3000/api/test-webhook-debug';
    console.log('Target debug webhook URL:', webhookUrl);
    
    // Create mock event
    const mockEvent = createMockEvent();
    console.log('Created mock event:', mockEvent.id);
    console.log('Event type:', mockEvent.type);
    console.log('Customer email:', mockEvent.data.object.customer_details.email);
    
    // Set up headers
    const timestamp = Math.floor(Date.now() / 1000);
    const headers = {
      'Content-Type': 'application/json',
      'Stripe-Signature': `t=${timestamp},v1=fake_signature_for_debug_endpoint`
    };
    
    console.log('Sending request to debug webhook...');
    
    // Send the request
    const response = await axios.post(webhookUrl, mockEvent, { headers });
    
    console.log('Debug webhook response status:', response.status);
    console.log('Debug webhook response data:', response.data);
    
    if (response.status === 200) {
      console.log('✅ DEBUG WEBHOOK TEST SUCCESSFUL!');
      
      // Check if emails were sent
      if (response.data.directEmailSent) {
        console.log('✅ Direct email sent successfully with Message ID:', response.data.directMessageId);
      }
      
      if (response.data.templateEmailSent) {
        console.log('✅ Template email sent successfully with Message ID:', response.data.templateMessageId);
      }
      
      return true;
    } else {
      console.error('❌ Debug webhook test failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing debug webhook:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run the tests
async function runAllTests() {
  console.log('\n=== STARTING WEBHOOK TESTS ===');
  
  // Test the debug webhook endpoint first (most comprehensive)
  console.log('\nTesting debug webhook endpoint (with direct email sending)...');
  const debugEndpointResult = await testDebugWebhookEndpoint();
  
  // Test the regular webhook in debug mode
  console.log('\nTesting regular webhook in debug mode...');
  const debugModeResult = await testWebhookDebugMode();
  
  console.log('\n=== TEST SUMMARY ===');
  console.log('Debug webhook endpoint test:', debugEndpointResult ? 'PASSED ✅' : 'FAILED ❌');
  console.log('Regular webhook debug mode test:', debugModeResult ? 'PASSED ✅' : 'FAILED ❌');
  
  if (debugEndpointResult || debugModeResult) {
    console.log('\n✅ TESTS PASSED! Your webhook setup appears to be working correctly.');
    console.log('Please check your email inbox (m20plasse@gmail.com) for the test emails.');
    
    if (debugEndpointResult && !debugModeResult) {
      console.log('\n⚠️ The debug endpoint worked but the regular webhook had issues.');
      console.log('This suggests there might be an issue with the regular webhook handler code.');
    }
  } else {
    console.log('\n❌ ALL TESTS FAILED. Please check the error messages above.');
    
    console.log('\nTROUBLESHOOTING TIPS:');
    console.log('1. Make sure your Next.js server is running on http://localhost:3000');
    console.log('2. Check if the webhook endpoints are accessible');
    console.log('3. Verify that your environment variables are correctly set up');
    console.log('4. Check if BREVO_API_KEY, BREVO_SENDER_EMAIL, and webhook secret are correctly set');
    console.log('5. Look at the server logs for any errors during webhook processing');
  }
}

// Execute all tests
runAllTests(); 