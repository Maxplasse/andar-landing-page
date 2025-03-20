// Simple script to test Brevo email sending
require('dotenv').config({ path: '.env.local' }); // Explicitly specify the .env.local file
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Log environment variables (without revealing full API key)
console.log('Environment check:');
const apiKey = process.env.BREVO_API_KEY || '';
console.log('- BREVO_API_KEY exists:', apiKey.length > 0 ? 'Yes' : 'No');
console.log('- BREVO_API_KEY prefix:', apiKey.substring(0, 10) + '...');
console.log('- BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL);
console.log('- BREVO_SENDER_NAME:', process.env.BREVO_SENDER_NAME);

async function sendTestEmail() {
  try {
    // Initialize the Brevo API client
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    // Log SDK initialization
    console.log('SDK initialized with API key');

    // Create an instance of the API class
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    console.log('TransactionalEmailsApi instance created');

    // Set up the sender information
    const sender = {
      email: process.env.BREVO_SENDER_EMAIL || 'notifications@andar.fr',
      name: process.env.BREVO_SENDER_NAME || 'ANDAR',
    };

    // Create a test recipient
    const testRecipient = 'max.plasse@viennou.com'; // Replace with your email for testing

    // Create email send request
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    // Set basic email properties (without template)
    sendSmtpEmail.to = [{ email: testRecipient }];
    sendSmtpEmail.subject = 'Test Email from ANDAR';
    sendSmtpEmail.htmlContent = '<html><body><h1>Test Email</h1><p>This is a test email from ANDAR membership system.</p></body></html>';
    sendSmtpEmail.sender = sender;
    
    console.log('Email request created:', {
      to: testRecipient,
      subject: sendSmtpEmail.subject,
      sender: sender
    });

    // Send the email
    console.log('Attempting to send email...');
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log('Email sent successfully!');
    console.log('Response:', JSON.stringify(response, null, 2));
    
    return { success: true, data: response };
  } catch (error) {
    console.error('ERROR SENDING EMAIL:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Try to provide more detailed error information
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.text || error.response.body || 'No response data');
      console.error('Response headers:', error.response.headers);
    }
    
    return { success: false, error };
  }
}

// Run the test
sendTestEmail()
  .then(result => {
    console.log('Test completed with result:', result.success ? 'SUCCESS' : 'FAILURE');
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error in test execution:', err);
    process.exit(1);
  }); 