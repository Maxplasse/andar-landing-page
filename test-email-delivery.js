/**
 * Script to test email delivery and help diagnose delivery issues.
 * This script will test email delivery with different methods and settings.
 */
require('dotenv').config({ path: '.env.local' });
const SibApiV3Sdk = require('sib-api-v3-sdk');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Initialize the Brevo API client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Helper function to ask for input
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Test direct email sending with Brevo API
async function testDirectEmailSend(email, templateId = null) {
  console.log(`Testing direct email sending to ${email}...`);
  
  try {
    // Create sender info
    const sender = {
      email: process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com',
      name: process.env.BREVO_SENDER_NAME || 'ANDAR'
    };
    
    // Create email send request
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.to = [{
      email: email,
      name: email.split('@')[0]
    }];
    
    if (templateId) {
      // Send using template
      sendSmtpEmail.templateId = templateId;
      sendSmtpEmail.params = {
        name: 'Test User',
        membershipType: 'digital',
        date: new Date().toLocaleDateString('fr-FR'),
        membershipDetails: {
          name: 'Adhésion Test',
          price: '10€',
          description: 'Email test pour diagnostiquer les problèmes de livraison',
          duration: '1 an'
        }
      };
    } else {
      // Send plain email
      sendSmtpEmail.subject = 'ANDAR - Test Email Delivery';
      sendSmtpEmail.htmlContent = `
        <html>
          <body>
            <h1>ANDAR Email Delivery Test</h1>
            <p>This is a test email sent directly from the Brevo API to diagnose delivery issues.</p>
            <p>Time sent: ${new Date().toISOString()}</p>
            <p>If you're seeing this, the email delivery is working!</p>
            <p>Test ID: ${Math.random().toString(36).substring(2, 15)}</p>
          </body>
        </html>
      `;
    }
    
    sendSmtpEmail.sender = sender;
    
    // Send the email
    console.log('Sending email with these details:');
    console.log('- From:', sender.email);
    console.log('- To:', email);
    console.log('- Template ID:', templateId || 'No template (direct HTML)');
    
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', response.messageId);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data || error.response.text);
    }
    return { success: false, error };
  }
}

// Check DKIM and SPF records
async function checkEmailConfig() {
  console.log('\n=== Email Configuration Check ===');
  console.log('To ensure emails are not marked as spam, check the following:');
  console.log('1. Make sure your Brevo domain has DKIM and SPF records configured');
  console.log('2. Verify your sender domain in Brevo');
  console.log('3. Check if your emails are landing in spam folders');
  console.log('4. Check if your email contains spam trigger words');
  console.log('5. Ensure your IP is not blacklisted');
  
  console.log('\nDNS records to check for your sending domain:');
  console.log(`- Domain: ${process.env.BREVO_SENDER_EMAIL.split('@')[1]}`);
  console.log('- SPF record (TXT): v=spf1 include:spf.sendinblue.com mx ~all');
  console.log('- DKIM record: Check in Brevo dashboard');
  console.log('- DMARC record (TXT): v=DMARC1; p=none; sp=none; pct=100;');
}

// Get account details and monitor recent email activity
async function checkRecentActivity() {
  console.log('\n=== Recent Email Activity ===');
  console.log('To check your recent email activity:');
  console.log('1. Go to your Brevo dashboard: https://app.brevo.com/');
  console.log('2. Navigate to the "Statistics" section');
  console.log('3. Check for emails marked as "Delivered" but not opened');
  console.log('4. Look for emails marked as "Bounced" or "Rejected"');
  console.log('5. Check your spam score');
}

// Main function
async function main() {
  console.log('=== Email Delivery Diagnostic Tool ===');
  console.log('This script will help diagnose email delivery issues.');
  
  // Environment check
  console.log('\n=== Environment Check ===');
  console.log('BREVO_API_KEY exists:', Boolean(process.env.BREVO_API_KEY));
  console.log('BREVO_API_KEY starts with:', process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.substring(0, 10) + '...' : 'NOT SET');
  console.log('BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || 'NOT SET');
  console.log('BREVO_SENDER_NAME:', process.env.BREVO_SENDER_NAME || 'NOT SET');
  
  // Get email to test with
  const testEmail = await askQuestion('\nEnter the email address to test with: ');
  
  // Test menu
  console.log('\n=== Test Options ===');
  console.log('1. Send direct HTML email (bypasses template)');
  console.log('2. Send template email (using membership template)');
  console.log('3. Check email configuration');
  console.log('4. Review recent email activity');
  console.log('5. Run all tests');
  console.log('6. Exit');
  
  const choice = await askQuestion('\nSelect an option (1-6): ');
  
  switch (choice) {
    case '1':
      await testDirectEmailSend(testEmail);
      break;
    case '2':
      await testDirectEmailSend(testEmail, 7); // Use template ID 7 (membership confirmation)
      break;
    case '3':
      await checkEmailConfig();
      break;
    case '4':
      await checkRecentActivity();
      break;
    case '5':
      // Run all tests
      await testDirectEmailSend(testEmail);
      await testDirectEmailSend(testEmail, 7);
      await checkEmailConfig();
      await checkRecentActivity();
      break;
    case '6':
      console.log('Exiting...');
      break;
    default:
      console.log('Invalid choice. Exiting...');
  }
  
  // Follow-up questions
  console.log('\n=== Delivery Troubleshooting ===');
  console.log('If emails are being sent but not received:');
  console.log('1. Check your spam/junk folder');
  console.log('2. Add the sender email to your contacts/safe senders list');
  console.log('3. Check with your email provider if they are blocking emails from Brevo');
  console.log('4. Try with a different email provider (Gmail, Outlook, etc.)');
  
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('Error running diagnostic tool:', error);
  rl.close();
}); 