/**
 * Simplified script to test the webhook with debug mode enabled.
 */
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const crypto = require('crypto');

async function testDebugWebhook() {
  console.log('=== TESTING DEBUG WEBHOOK ===');
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
    console.log('Sending request to debug webhook...');
    console.log('Mock event type:', mockEvent.type);
    console.log('Customer email:', mockEvent.data.object.customer_details.email);
    console.log('Membership type:', mockEvent.data.object.metadata.membershipType);
    
    // Send the request to our debug webhook
    const response = await axios.post('http://localhost:3000/api/webhook-debug', 
      mockEvent,
      {
        headers: {
          'Content-Type': 'application/json',
          // Add a fake signature header to indicate this is a test
          'stripe-signature': 'test_' + crypto.randomBytes(16).toString('hex')
        }
      }
    );
    
    console.log('\nWebhook response status:', response.status);
    console.log('Webhook response:', response.data);
    
    console.log('\n✅ Test completed. Please check server logs for detailed information.');
    console.log('If you don\'t see any errors in the logs, the problem might be:');
    console.log('1. Environment variables not being loaded in production');
    console.log('2. Network connectivity issues in production');
    console.log('3. Incorrect Brevo API key or template ID in production');
    
    return true;
  } catch (error) {
    console.error('\n❌ Error testing webhook:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Test the direct Brevo API as a comparison
async function testDirectBrevoAPI() {
  console.log('\n=== TESTING DIRECT BREVO API ===');
  
  try {
    // Dynamically import the direct test file
    console.log('Running direct API test...');
    const { testDirectEmailSend } = {
      testDirectEmailSend: require('./test-email-direct').testDirectEmailSend
    };
    
    if (typeof testDirectEmailSend === 'function') {
      await testDirectEmailSend();
    } else {
      console.log('Direct test function not available, using built-in test...');
      
      // Use the Brevo SDK directly
      const SibApiV3Sdk = require('sib-api-v3-sdk');
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = process.env.BREVO_API_KEY;
      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      
      // Create a test email
      const testEmail = 'm20plasse@gmail.com';
      const testName = 'Direct API Test';
      
      const sender = {
        email: process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com',
        name: process.env.BREVO_SENDER_NAME || 'ANDAR'
      };
      
      const templateEmail = new SibApiV3Sdk.SendSmtpEmail();
      templateEmail.to = [{ email: testEmail, name: testName }];
      templateEmail.templateId = 7;
      templateEmail.params = {
        name: testName,
        membershipType: 'digital',
        date: new Date().toLocaleDateString('fr-FR'),
        membershipDetails: {
          name: "Test Digital",
          price: "10€",
          description: "Test description",
          duration: "1 an"
        }
      };
      templateEmail.sender = sender;
      
      console.log('Sending direct test email...');
      const response = await apiInstance.sendTransacEmail(templateEmail);
      
      console.log('\n✅ Direct email sent successfully!');
      console.log('Message ID:', response.messageId);
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ Error in direct API test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function runAllTests() {
  // First, check environment
  console.log('Checking environment variables:');
  console.log('BREVO_API_KEY exists:', Boolean(process.env.BREVO_API_KEY));
  console.log('BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || 'NOT SET');
  console.log('DEBUG_WEBHOOK:', process.env.DEBUG_WEBHOOK || 'NOT SET');
  
  // Run the tests
  console.log('\nRunning tests sequentially:');
  
  // Test 1: Direct Brevo API
  console.log('\n=== TEST 1: DIRECT BREVO API ===');
  const directAPIResult = await testDirectBrevoAPI();
  
  // Test 2: Debug Webhook
  console.log('\n=== TEST 2: DEBUG WEBHOOK ===');
  const webhookResult = await testDebugWebhook();
  
  // Summary
  console.log('\n=== TEST RESULTS SUMMARY ===');
  console.log('Direct Brevo API:', directAPIResult ? '✅ PASSED' : '❌ FAILED');
  console.log('Debug Webhook:', webhookResult ? '✅ PASSED' : '❌ FAILED');
  
  if (directAPIResult && !webhookResult) {
    console.log('\n🔍 DIAGNOSIS: The Brevo API works directly, but fails from the webhook.');
    console.log('This suggests a problem with how the webhook is processing the request or calling the API.');
    console.log('Check the server logs for details on what might be failing in the webhook handler.');
  } else if (!directAPIResult && !webhookResult) {
    console.log('\n🔍 DIAGNOSIS: Both tests failed, suggesting an issue with your Brevo API key or configuration.');
    console.log('Double-check your environment variables and Brevo account status.');
  } else if (directAPIResult && webhookResult) {
    console.log('\n✅ GOOD NEWS: Both tests passed! This suggests your local setup is working correctly.');
    console.log('The issue might be specific to your production environment or how Stripe events are being handled there.');
  }
}

// Run the tests
runAllTests()
  .then(() => {
    console.log('\nTests completed.');
  })
  .catch(err => {
    console.error('Unexpected error in tests:', err);
  }); 