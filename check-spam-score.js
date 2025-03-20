/**
 * Script to check and analyze potential spam factors in your Brevo emails.
 */
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask for input
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Get email template content from Brevo
async function getTemplateContent() {
  console.log('Fetching membership template content...');
  
  // Unfortunately, we can't directly access Brevo templates via API in this script
  console.log('To analyze your email template:');
  console.log('1. Go to your Brevo dashboard: https://app.brevo.com/');
  console.log('2. Navigate to "Email Templates"');
  console.log('3. Find your membership confirmation template (ID: 7)');
  console.log('4. Copy the HTML content');
  
  const templateContent = await askQuestion('\nPaste your email template HTML here (or press Enter to skip): ');
  return templateContent;
}

// Analyze the email for spam factors
async function analyzeSpamFactors(htmlContent) {
  if (!htmlContent) {
    console.log('No HTML content provided to analyze.');
    return;
  }
  
  console.log('\n=== Spam Analysis ===');
  
  // Load HTML with Cheerio for analysis
  const $ = cheerio.load(htmlContent);
  
  // Check for common spam factors
  const spamFactors = [];
  
  // 1. Check image to text ratio
  const textContent = $('body').text().trim();
  const imgTags = $('img').length;
  console.log(`Text length: ${textContent.length} characters`);
  console.log(`Number of images: ${imgTags}`);
  if (textContent.length < 200 && imgTags > 3) {
    spamFactors.push('High image to text ratio (common spam characteristic)');
  }
  
  // 2. Check for spam trigger words
  const spamTriggerWords = [
    'free', 'gratuit', 'buy now', 'achetez maintenant', 'clearance', 'soldes', 
    'order now', 'commandez maintenant', 'money back', 'remboursement garanti',
    'call now', 'appelez maintenant', 'limited time', 'temps limité',
    'prize', 'prix', 'winner', 'gagnant', 'urgent', 'congratulations', 'félicitations'
  ];
  
  const lowerText = textContent.toLowerCase();
  const foundTriggerWords = spamTriggerWords.filter(word => lowerText.includes(word));
  
  if (foundTriggerWords.length > 0) {
    spamFactors.push(`Contains spam trigger words: ${foundTriggerWords.join(', ')}`);
  }
  
  // 3. Check for excessive links
  const links = $('a').length;
  console.log(`Number of links: ${links}`);
  if (links > 10) {
    spamFactors.push('Excessive number of links');
  }
  
  // 4. Check for all capital letters
  const allCapsRegions = textContent.match(/[A-Z]{5,}/g) || [];
  if (allCapsRegions.length > 0) {
    spamFactors.push('Contains all-capital text regions (appears shouting)');
  }
  
  // 5. Check for missing alt text on images
  const imagesWithoutAlt = $('img:not([alt])').length;
  if (imagesWithoutAlt > 0) {
    spamFactors.push(`${imagesWithoutAlt} images missing alt text`);
  }
  
  // 6. Check for HTML structure issues
  if (!$('html').length || !$('body').length || !$('head').length) {
    spamFactors.push('Missing proper HTML structure tags');
  }
  
  // Report findings
  if (spamFactors.length > 0) {
    console.log('\n⚠️ Potential spam factors found:');
    spamFactors.forEach((factor, index) => {
      console.log(`${index + 1}. ${factor}`);
    });
  } else {
    console.log('\n✅ No common spam factors detected in the email content.');
  }
}

// Check the server health and configuration
async function checkEmailServerConfig() {
  const domain = process.env.BREVO_SENDER_EMAIL.split('@')[1];
  console.log(`\n=== Server Configuration for ${domain} ===`);
  
  console.log('To ensure good deliverability, verify these configurations:');
  console.log('1. SPF Record: Ensure this domain has a proper SPF record');
  console.log('   - Use a tool like https://mxtoolbox.com/spf.aspx to check');
  
  console.log('2. DKIM Record: Ensure DKIM is properly configured for this domain');
  console.log('   - This should be set up in your Brevo account');
  
  console.log('3. DMARC Policy: Having a DMARC policy improves deliverability');
  console.log('   - Check with https://mxtoolbox.com/DMARC.aspx');
  
  console.log('4. Verify sending domain in Brevo');
  console.log('   - Make sure your domain is verified in the Brevo dashboard');
  
  // Provide links to check domain reputation
  console.log('\nCheck your domain reputation:');
  console.log(`- Google Postmaster Tools: https://postmaster.google.com/`);
  console.log(`- Sender Score: https://www.senderscore.org/`);
  console.log(`- Mail-Tester: https://www.mail-tester.com/`);
}

// Check Brevo limits and metrics
async function checkBrevoMetrics() {
  console.log('\n=== Brevo Account Metrics ===');
  console.log('To check your Brevo metrics and limits:');
  console.log('1. Log in to your Brevo dashboard: https://app.brevo.com/');
  console.log('2. Go to "Statistics" to check your delivery rates');
  console.log('3. Look for any bounces, complaints, or delivery issues');
  console.log('4. Check your plan limits and if you\'re approaching them');
  
  console.log('\nKey metrics to monitor:');
  console.log('- Delivery Rate: Should be above 95%');
  console.log('- Open Rate: Industry average is ~20%');
  console.log('- Click Rate: Industry average is ~2-3%');
  console.log('- Bounce Rate: Should be below 2%');
  console.log('- Complaint Rate: Should be below 0.1%');
}

// Provide suggested actions to improve deliverability
function suggestActions() {
  console.log('\n=== Suggested Actions to Improve Deliverability ===');
  console.log('1. Verify Domain: Make sure your sending domain is verified in Brevo');
  console.log('2. Implement SPF, DKIM, and DMARC: These DNS records improve authentication');
  console.log('3. IP Warming: If using a new IP address, gradually increase sending volume');
  console.log('4. Clean Your List: Remove inactive subscribers and bounced emails');
  console.log('5. Double Opt-In: Use double opt-in to ensure subscribers want your emails');
  console.log('6. Consistent Sending: Maintain regular sending patterns');
  console.log('7. Monitor Reputation: Regularly check your domain and IP reputation');
  console.log('8. Test Deliverability: Use tools like mail-tester.com before campaigns');
  console.log('9. Check Spam Score: Use tools to check your email spam score before sending');
  console.log('10. Check Spam Folders: Ask recipients to check their spam folders and mark as "not spam"');
}

// Main function
async function main() {
  try {
    console.log('=== Email Spam Score & Deliverability Checker ===');
    console.log('This tool helps identify issues that might cause your emails to be marked as spam.');
    
    // Environment check
    console.log('\n=== Environment Check ===');
    console.log('BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || 'NOT SET');
    console.log('BREVO_SENDER_NAME:', process.env.BREVO_SENDER_NAME || 'NOT SET');
    
    if (!process.env.BREVO_SENDER_EMAIL) {
      console.error('Error: BREVO_SENDER_EMAIL environment variable is not set.');
      return;
    }
    
    // Main menu
    console.log('\n=== Options ===');
    console.log('1. Analyze email template for spam factors');
    console.log('2. Check email server configuration');
    console.log('3. Check Brevo metrics and limits');
    console.log('4. Get suggestions to improve deliverability');
    console.log('5. Run all checks');
    console.log('6. Exit');
    
    const choice = await askQuestion('\nSelect an option (1-6): ');
    
    switch (choice) {
      case '1':
        const templateContent = await getTemplateContent();
        await analyzeSpamFactors(templateContent);
        break;
      case '2':
        await checkEmailServerConfig();
        break;
      case '3':
        await checkBrevoMetrics();
        break;
      case '4':
        suggestActions();
        break;
      case '5':
        // Run all checks
        const content = await getTemplateContent();
        await analyzeSpamFactors(content);
        await checkEmailServerConfig();
        await checkBrevoMetrics();
        suggestActions();
        break;
      case '6':
        console.log('Exiting...');
        break;
      default:
        console.log('Invalid choice. Exiting...');
    }
    
    // Check if the domain is properly configured
    const domain = process.env.BREVO_SENDER_EMAIL.split('@')[1];
    console.log(`\n=== Final Recommendations for ${domain} ===`);
    console.log('1. If emails are being sent but not received, check:');
    console.log('   - Recipient\'s spam/junk folder');
    console.log('   - Email domain reputation (especially if using a custom domain)');
    console.log('   - Brevo dashboard for any delivery or abuse issues');
    console.log('2. Have recipients add your sender email to their contacts/whitelist');
    console.log('3. Consider using a different email provider for testing (Gmail, Outlook, etc.)');
    
  } catch (error) {
    console.error('Error running checks:', error);
  } finally {
    rl.close();
  }
}

// Run the script
main(); 