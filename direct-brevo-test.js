/**
 * Direct test of Brevo API to validate email sending capabilities
 * This bypasses the entire Stripe webhook flow
 */
require('dotenv').config({ path: '.env.local' });
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Initialize Brevo API client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const accountApi = new SibApiV3Sdk.AccountApi();

// Test if API key is valid and get account info
async function checkAccount() {
  try {
    console.log('Checking Brevo account details...');
    const response = await accountApi.getAccount();
    console.log('✅ API key is valid');
    console.log('Account details:', JSON.stringify(response, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error checking account:', error);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data || error.response.text);
    }
    return false;
  }
}

// Send a direct email with Brevo API
async function sendDirectEmail(recipientEmail, recipientName) {
  // Create sender info
  const sender = {
    email: process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com',
    name: process.env.BREVO_SENDER_NAME || 'ANDAR'
  };
  
  // Create email send request
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  sendSmtpEmail.to = [{
    email: recipientEmail,
    name: recipientName || recipientEmail.split('@')[0]
  }];
  
  // Try first with template
  sendSmtpEmail.templateId = 7;
  sendSmtpEmail.params = {
    name: recipientName || 'Test User',
    membershipType: 'digital',
    date: new Date().toLocaleDateString('fr-FR'),
    membershipDetails: {
      name: 'Adhésion Test',
      price: '10€',
      description: 'Test direct de l\'API Brevo sans passer par les webhooks',
      duration: '1 an'
    }
  };
  
  sendSmtpEmail.sender = sender;
  
  try {
    console.log('Sending direct template email via Brevo API...');
    console.log('- From:', sender.email);
    console.log('- To:', recipientEmail);
    console.log('- Template ID:', 7);
    console.log('- Params:', JSON.stringify(sendSmtpEmail.params, null, 2));
    
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Template email sent successfully!');
    console.log('Message ID:', response.messageId);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('❌ Error sending template email:', error);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data || error.response.text);
    }
    
    // If template fails, try with direct HTML
    try {
      console.log('\nTemplate email failed, trying direct HTML email...');
      
      // Create a new email with direct HTML content
      const directEmail = new SibApiV3Sdk.SendSmtpEmail();
      directEmail.to = sendSmtpEmail.to;
      directEmail.sender = sender;
      directEmail.subject = 'ANDAR - Test Direct Email';
      directEmail.htmlContent = `
        <html>
          <body>
            <h1>ANDAR Direct Email Test</h1>
            <p>Bonjour ${recipientName || 'membre'},</p>
            <p>Ceci est un test direct de l'API Brevo pour diagnostiquer les problèmes d'envoi d'email.</p>
            <p>Heure d'envoi: ${new Date().toLocaleString('fr-FR')}</p>
            <p>Si vous voyez cet email, l'API Brevo fonctionne correctement!</p>
            <p>Test ID: ${Math.random().toString(36).substring(2, 15)}</p>
          </body>
        </html>
      `;
      
      console.log('Sending direct HTML email...');
      const directResponse = await apiInstance.sendTransacEmail(directEmail);
      console.log('✅ Direct HTML email sent successfully!');
      console.log('Message ID:', directResponse.messageId);
      return { success: true, messageId: directResponse.messageId, directHtml: true };
    } catch (directError) {
      console.error('❌ Error sending direct HTML email:', directError);
      if (directError.response) {
        console.error('Error status:', directError.response.status);
        console.error('Error data:', directError.response.data || directError.response.text);
      }
      return { success: false, error: directError };
    }
  }
}

// Check Brevo sending statistics
async function checkSendingStats() {
  try {
    // Unfortunately, the Brevo Node.js SDK doesn't have a direct method for getting sending stats
    console.log('\nTo check your Brevo sending statistics:');
    console.log('1. Log in to your Brevo dashboard: https://app.brevo.com/');
    console.log('2. Go to "Statistics" to view your email sending activity');
    console.log('3. Check for any delivery issues or failed sends');
    
    return true;
  } catch (error) {
    console.error('Error checking sending stats:', error);
    return false;
  }
}

// Main function
async function main() {
  console.log('=== DIRECT BREVO API TEST ===');
  console.log('Timestamp:', new Date().toISOString());
  
  // Check environment variables
  console.log('\n=== ENVIRONMENT CHECK ===');
  console.log('BREVO_API_KEY exists:', Boolean(process.env.BREVO_API_KEY));
  console.log('BREVO_API_KEY starts with:', process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.substring(0, 10) + '...' : 'NOT SET');
  console.log('BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || 'NOT SET');
  console.log('BREVO_SENDER_NAME:', process.env.BREVO_SENDER_NAME || 'NOT SET');
  
  // Check if Brevo API key is valid
  const accountValid = await checkAccount();
  
  if (!accountValid) {
    console.error('❌ Cannot proceed with tests due to invalid API key or account issues');
    return;
  }
  
  // Process command line arguments for recipient email
  const recipientEmail = process.argv[2] || 'max.plasse@viennou.com';
  const recipientName = process.argv[3] || 'Test User';
  
  console.log(`\nSending test email to: ${recipientEmail} (${recipientName})`);
  
  // Send a direct email
  const emailResult = await sendDirectEmail(recipientEmail, recipientName);
  
  if (emailResult.success) {
    console.log('\n✅ EMAIL SENT SUCCESSFULLY');
    console.log('Message ID:', emailResult.messageId);
    console.log('Type:', emailResult.directHtml ? 'Direct HTML' : 'Template-based');
    
    // Check Brevo sending stats
    await checkSendingStats();
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Check the recipient\'s inbox (and spam folder)');
    console.log('2. Check Brevo dashboard for delivery status');
    console.log('3. If the email was delivered but your webhook emails are not showing up,');
    console.log('   the issue is likely in your webhook implementation or how Brevo logs are being viewed');
  } else {
    console.error('\n❌ EMAIL SENDING FAILED');
    console.log('Please check the error messages above for details');
  }
}

// Run the test
main().catch(error => {
  console.error('Unhandled error in test:', error);
}); 