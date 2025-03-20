require('dotenv').config({ path: '.env.local' });
const SibApiV3Sdk = require('sib-api-v3-sdk');

console.log('=== BREVO API CONNECTION TEST ===');
console.log('Timestamp:', new Date().toISOString());

// Print all environment variables (without exposing full values of sensitive ones)
console.log('\n--- ENVIRONMENT VARIABLES CHECK ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('BREVO_API_KEY exists:', Boolean(process.env.BREVO_API_KEY));
if (process.env.BREVO_API_KEY) {
  console.log('BREVO_API_KEY starts with:', process.env.BREVO_API_KEY.substring(0, 5) + '...');
  console.log('BREVO_API_KEY length:', process.env.BREVO_API_KEY.length);
}
console.log('BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || 'NOT SET');
console.log('BREVO_SENDER_NAME:', process.env.BREVO_SENDER_NAME || 'NOT SET');

// Test function to directly send an email
async function testBrevoConnection() {
  console.log('\n--- TESTING BREVO API CONNECTION ---');
  
  try {
    // Initialize the Brevo API client
    console.log('Initializing Brevo API client...');
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    console.log('Creating API instance...');
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    // Test the API connection by getting account information
    console.log('Testing API connection...');
    
    // Create sender info
    const sender = {
      email: process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com',
      name: process.env.BREVO_SENDER_NAME || 'ANDAR'
    };
    
    console.log('Using sender:', sender);
    
    // Create a test recipient - REPLACE WITH YOUR EMAIL
    const testRecipient = 'm20plasse@gmail.com'; 
    console.log('Test recipient:', testRecipient);
    
    // Create a simple email
    console.log('Creating test email...');
    const testEmail = new SibApiV3Sdk.SendSmtpEmail();
    testEmail.to = [{
      email: testRecipient,
      name: 'Test User'
    }];
    testEmail.subject = 'ANDAR - Test direct Brevo API connection';
    testEmail.htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h1>Brevo API Connection Test</h1>
          <p>This is a test email sent directly using the Brevo API from the webhook debugging script.</p>
          <p>If you're receiving this email, it means the connection to Brevo API is working correctly.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>Sender: ${sender.name} &lt;${sender.email}&gt;</p>
        </body>
      </html>
    `;
    testEmail.sender = sender;
    
    // Send the email
    console.log('Sending test email...');
    const response = await apiInstance.sendTransacEmail(testEmail);
    
    console.log('✅ TEST EMAIL SENT SUCCESSFULLY!');
    console.log('Message ID:', response.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error in Brevo API test:', error);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error details:', error.response.text || error.response.data);
    }
    return false;
  }
}

// Test function to check template email sending
async function testTemplateEmail() {
  console.log('\n--- TESTING TEMPLATE EMAIL SENDING ---');
  
  try {
    // Initialize the Brevo API client
    console.log('Initializing Brevo API client for template test...');
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    console.log('Creating API instance...');
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    // Create sender info
    const sender = {
      email: process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com',
      name: process.env.BREVO_SENDER_NAME || 'ANDAR'
    };
    
    console.log('Using sender:', sender);
    
    // Create a test recipient - REPLACE WITH YOUR EMAIL
    const testRecipient = 'm20plasse@gmail.com';
    console.log('Test recipient:', testRecipient);
    
    // Create an email with template
    console.log('Creating template test email...');
    const templateEmail = new SibApiV3Sdk.SendSmtpEmail();
    templateEmail.to = [{
      email: testRecipient,
      name: 'Test User'
    }];
    templateEmail.templateId = 7; // Your membership confirmation template ID
    templateEmail.params = {
      name: 'Test User',
      membershipType: 'digital',
      date: new Date().toLocaleDateString('fr-FR'),
      membershipDetails: {
        name: "Adhésion Digital",
        price: "32€",
        description: "Adhésion à l'ANDAR",
        duration: "1 an"
      }
    };
    templateEmail.sender = sender;
    
    // Send the template email
    console.log('Sending template test email...');
    const response = await apiInstance.sendTransacEmail(templateEmail);
    
    console.log('✅ TEMPLATE EMAIL SENT SUCCESSFULLY!');
    console.log('Message ID:', response.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error in template email test:', error);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error details:', error.response.text || error.response.data);
    }
    return false;
  }
}

// Run the tests
async function runAllTests() {
  console.log('\n=== STARTING BREVO API TESTS ===');
  
  // Test 1: Direct API connection and simple email
  const connectionTestResult = await testBrevoConnection();
  console.log('\nDirect API connection test result:', connectionTestResult ? 'PASSED ✅' : 'FAILED ❌');
  
  // Test 2: Template email
  const templateTestResult = await testTemplateEmail();
  console.log('\nTemplate email test result:', templateTestResult ? 'PASSED ✅' : 'FAILED ❌');
  
  console.log('\n=== TEST SUMMARY ===');
  console.log('Direct API connection test:', connectionTestResult ? 'PASSED ✅' : 'FAILED ❌');
  console.log('Template email test:', templateTestResult ? 'PASSED ✅' : 'FAILED ❌');
  
  if (connectionTestResult && templateTestResult) {
    console.log('\n✅ ALL TESTS PASSED! Your Brevo API connection is working correctly.');
    console.log('Please check your email inbox (m20plasse@gmail.com) for the test emails.');
  } else {
    console.log('\n❌ SOME TESTS FAILED. Please check the error messages above.');
    
    if (!connectionTestResult) {
      console.log('\nTROUBLESHOOTING TIPS FOR API CONNECTION:');
      console.log('1. Verify your BREVO_API_KEY is correct and not expired');
      console.log('2. Check if your Brevo account is active and not suspended');
      console.log('3. Ensure you have the proper API permissions in your Brevo account');
    }
    
    if (!templateTestResult && connectionTestResult) {
      console.log('\nTROUBLESHOOTING TIPS FOR TEMPLATE EMAIL:');
      console.log('1. Verify the template ID (7) exists in your Brevo account');
      console.log('2. Check if the template variables match what the template expects');
      console.log('3. Ensure the template is active and approved in your Brevo account');
    }
  }
}

// Execute all tests
runAllTests(); 