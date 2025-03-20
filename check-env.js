#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

console.log('=== ENVIRONMENT VARIABLES CHECK ===');
console.log('Timestamp:', new Date().toISOString());

// Define required variables
const envVars = [
  { name: 'NODE_ENV', required: false },
  { name: 'BREVO_API_KEY', required: true },
  { name: 'BREVO_SENDER_EMAIL', required: true },
  { name: 'BREVO_SENDER_NAME', required: true },
  { name: 'STRIPE_SECRET_KEY', required: true },
  { name: 'STRIPE_PUBLISHABLE_KEY', required: true },
  { name: 'STRIPE_WEBHOOK_SECRET', required: true },
  { name: 'STRIPE_CLI_WEBHOOK_SECRET', required: false },
  { name: 'DEBUG_WEBHOOK', required: false },
  { name: 'VERBOSE_DEBUG', required: false }
];

// Check for development vs production mode
const isDev = process.env.NODE_ENV !== 'production';
console.log(`Running in ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);

// Check all variables
let errors = 0;
let warnings = 0;

console.log('\n--- CHECKING REQUIRED VARIABLES ---');
envVars.forEach(variable => {
  const value = process.env[variable.name];
  const exists = !!value;
  
  if (!exists && variable.required) {
    console.error(`❌ ERROR: Required variable ${variable.name} is missing`);
    errors++;
  } else if (!exists && !variable.required) {
    console.warn(`⚠️ WARNING: Optional variable ${variable.name} is missing`);
    warnings++;
  } else {
    // For sensitive values, only show a prefix
    const isSensitive = variable.name.includes('KEY') || variable.name.includes('SECRET');
    const displayValue = isSensitive 
      ? `${value.substring(0, 5)}...${value.substring(value.length - 3)}` 
      : value;
      
    console.log(`✅ ${variable.name}: ${displayValue}`);
  }
});

// Check for debug mode
if (isDev && process.env.DEBUG_WEBHOOK !== 'true') {
  console.warn('\n⚠️ WARNING: DEBUG_WEBHOOK is not set to true. This may cause signature verification issues in development.');
  warnings++;
}

// Check if webhook secrets are properly configured
if (isDev && !process.env.STRIPE_CLI_WEBHOOK_SECRET) {
  console.warn('\n⚠️ WARNING: STRIPE_CLI_WEBHOOK_SECRET is not set. Webhook testing with the Stripe CLI may not work.');
  warnings++;
}

// Check for Brevo API key format
if (process.env.BREVO_API_KEY && !process.env.BREVO_API_KEY.startsWith('xkeysib-')) {
  console.warn('\n⚠️ WARNING: BREVO_API_KEY does not start with "xkeysib-" which is unusual for Brevo API keys.');
  warnings++;
}

// Final summary
console.log('\n=== SUMMARY ===');
if (errors === 0 && warnings === 0) {
  console.log('✅ All environment variables are correctly configured!');
} else {
  if (errors > 0) {
    console.error(`❌ Found ${errors} error(s) in your environment configuration.`);
  }
  if (warnings > 0) {
    console.warn(`⚠️ Found ${warnings} warning(s) in your environment configuration.`);
  }
  
  console.log('\nPlease fix these issues to ensure proper functionality.');
}

// Development-specific tips
if (isDev) {
  console.log('\n--- DEVELOPMENT TIPS ---');
  console.log('• For local testing, ensure the Stripe CLI is running with:');
  console.log('  stripe listen --forward-to http://localhost:3000/api/webhook');
  console.log('• Set DEBUG_WEBHOOK=true in your .env.local file to bypass signature verification');
  console.log('• Use stripe trigger checkout.session.completed to test the webhook');
}

// Exit with error code if there are errors
if (errors > 0) {
  process.exit(1);
} else {
  process.exit(0);
} 