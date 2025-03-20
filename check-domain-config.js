/**
 * Check domain configuration for email deliverability
 * This script will help identify any issues with your domain configuration
 * that might be causing emails to be marked as spam.
 */
require('dotenv').config({ path: '.env.local' });
const dns = require('dns');
const util = require('util');
const axios = require('axios');

// Convert DNS functions to promises
const resolveTxt = util.promisify(dns.resolveTxt);
const resolveMx = util.promisify(dns.resolveMx);

// Function to check SPF record
async function checkSPF(domain) {
  try {
    console.log(`Checking SPF record for ${domain}...`);
    const records = await resolveTxt(domain);
    
    // Find SPF record
    const spfRecord = records.find(record => record.join('').startsWith('v=spf1'));
    
    if (spfRecord) {
      const spfString = spfRecord.join('');
      console.log('✅ SPF record found:', spfString);
      
      // Check if Brevo's SPF is included
      if (spfString.includes('include:spf.brevo.com') || 
          spfString.includes('include:spf.sendinblue.com')) {
        console.log('✅ Brevo SPF record is included');
      } else {
        console.log('❌ Brevo SPF record is not included');
        console.log('  Recommended: Add "include:spf.brevo.com" to your SPF record');
      }
      
      return { exists: true, record: spfString };
    } else {
      console.log('❌ No SPF record found');
      console.log('  Recommended: Add an SPF record with "v=spf1 include:spf.brevo.com ~all"');
      return { exists: false };
    }
  } catch (error) {
    console.error('❌ Error checking SPF:', error.message);
    return { exists: false, error: error.message };
  }
}

// Function to check DKIM record
async function checkDKIM(domain, selector = 'brevo._domainkey') {
  try {
    const dkimDomain = `${selector}.${domain}`;
    console.log(`Checking DKIM record for ${dkimDomain}...`);
    
    const records = await resolveTxt(dkimDomain);
    
    if (records && records.length > 0) {
      const dkimRecord = records[0].join('');
      console.log('✅ DKIM record found');
      return { exists: true, record: dkimRecord };
    } else {
      console.log('❌ No DKIM record found for selector:', selector);
      console.log('  Recommended: Add a DKIM record with the value provided by Brevo');
      return { exists: false };
    }
  } catch (error) {
    console.log('❌ DKIM record not found or error:', error.message);
    console.log('  Recommended: Configure DKIM in Brevo dashboard and add the provided record');
    return { exists: false, error: error.message };
  }
}

// Function to check DMARC record
async function checkDMARC(domain) {
  try {
    const dmarcDomain = `_dmarc.${domain}`;
    console.log(`Checking DMARC record for ${dmarcDomain}...`);
    
    const records = await resolveTxt(dmarcDomain);
    
    if (records && records.length > 0) {
      const dmarcRecord = records[0].join('');
      console.log('✅ DMARC record found:', dmarcRecord);
      return { exists: true, record: dmarcRecord };
    } else {
      console.log('❌ No DMARC record found');
      console.log('  Recommended: Add a DMARC record: "v=DMARC1; p=none; rua=mailto:dmarc@polyarthrite-andar.com"');
      return { exists: false };
    }
  } catch (error) {
    console.log('❌ DMARC record not found or error:', error.message);
    console.log('  Recommended: Add a DMARC record: "v=DMARC1; p=none; rua=mailto:dmarc@polyarthrite-andar.com"');
    return { exists: false, error: error.message };
  }
}

// Function to check MX records
async function checkMX(domain) {
  try {
    console.log(`Checking MX records for ${domain}...`);
    
    const records = await resolveMx(domain);
    
    if (records && records.length > 0) {
      console.log('✅ MX records found:');
      records.forEach(record => console.log(`  Priority: ${record.priority}, Exchange: ${record.exchange}`));
      return { exists: true, records: records };
    } else {
      console.log('⚠️ No MX records found');
      console.log('  Note: MX records are required for receiving email, not sending');
      return { exists: false };
    }
  } catch (error) {
    console.log('⚠️ Error checking MX records:', error.message);
    return { exists: false, error: error.message };
  }
}

// Function to check domain with external tools
async function checkExternalTools(domain) {
  console.log('\n=== EXTERNAL TOOLS FOR DOMAIN VERIFICATION ===');
  console.log('Use these tools to verify your domain configuration:');
  console.log('1. MXToolbox SPF Record Lookup:');
  console.log(`   https://mxtoolbox.com/SuperTool.aspx?action=spf%3a${domain}`);
  console.log('2. MXToolbox DKIM Record Lookup:');
  console.log(`   https://mxtoolbox.com/SuperTool.aspx?action=dkim%3abrevo._domainkey.${domain}`);
  console.log('3. MXToolbox DMARC Record Lookup:');
  console.log(`   https://mxtoolbox.com/SuperTool.aspx?action=dmarc%3a${domain}`);
  console.log('4. Mail-Tester (send an email to the provided address):');
  console.log('   https://www.mail-tester.com/');
  console.log('5. Google Postmaster Tools (for Gmail deliverability):');
  console.log('   https://postmaster.google.com/');
}

// Main function
async function main() {
  // Get the domain from environment or default to polyarthrite-andar.com
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com';
  const domain = senderEmail.split('@')[1];
  
  console.log('=== DOMAIN CONFIGURATION CHECKER ===');
  console.log('Checking domain configuration for', domain);
  console.log('Sender email:', senderEmail);
  console.log('');
  
  // Check all DNS records
  const spfResult = await checkSPF(domain);
  console.log('');
  
  // Try both standard DKIM selectors
  let dkimResult = await checkDKIM(domain, 'brevo._domainkey');
  if (!dkimResult.exists) {
    dkimResult = await checkDKIM(domain, 'mail._domainkey');
  }
  console.log('');
  
  const dmarcResult = await checkDMARC(domain);
  console.log('');
  
  const mxResult = await checkMX(domain);
  console.log('');
  
  // Show external tools
  await checkExternalTools(domain);
  
  // Summarize findings and recommendations
  console.log('\n=== SUMMARY AND RECOMMENDATIONS ===');
  
  if (spfResult.exists && dkimResult.exists && dmarcResult.exists) {
    console.log('✅ Your domain appears to be configured correctly for email sending.');
    console.log('If emails are still not being delivered:');
    console.log('1. Check your Brevo account reputation in the dashboard');
    console.log('2. Test with different email providers (Gmail, Outlook, etc.)');
    console.log('3. Make sure your templates comply with anti-spam regulations');
  } else {
    console.log('⚠️ Your domain needs configuration improvements:');
    
    if (!spfResult.exists) {
      console.log('- Add an SPF record: "v=spf1 include:spf.brevo.com ~all"');
    } else if (!spfResult.record?.includes('spf.brevo.com') && 
              !spfResult.record?.includes('spf.sendinblue.com')) {
      console.log('- Update your SPF record to include: "include:spf.brevo.com"');
    }
    
    if (!dkimResult.exists) {
      console.log('- Add a DKIM record from your Brevo dashboard');
      console.log('  (Go to Brevo → Settings → Senders & IPs → Domain Authentication)');
    }
    
    if (!dmarcResult.exists) {
      console.log('- Add a DMARC record: "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"');
    }
  }
  
  console.log('\nFor detailed step-by-step configuration:');
  console.log('1. Login to Brevo dashboard: https://app.brevo.com/');
  console.log('2. Go to Settings → Senders & IPs → Domain Authentication');
  console.log('3. Follow the instructions to authenticate your domain');
}

// Execute the main function
main().catch(error => {
  console.error('Unhandled error:', error);
}); 