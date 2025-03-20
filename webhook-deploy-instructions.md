# Stripe Webhook Email Deployment Instructions

## 1. Development Environment Setup

1. Make sure your `.env.local` file has:
   ```
   DEBUG_WEBHOOK=true
   VERBOSE_DEBUG=true
   BREVO_API_KEY=your-brevo-api-key
   BREVO_SENDER_EMAIL=solene.legendre@polyarthrite-andar.com
   BREVO_SENDER_NAME=ANDAR
   STRIPE_CLI_WEBHOOK_SECRET=whsec_...from_stripe_cli
   ```

2. Run the Stripe CLI forwarder:
   ```
   stripe listen --forward-to http://localhost:3000/api/webhook
   ```

3. Start your Next.js development server:
   ```
   npm run dev
   ```

4. Test the webhook with:
   ```
   stripe trigger checkout.session.completed
   ```

5. Check your terminal logs to confirm that emails are being sent correctly.

## 2. Production Deployment

1. Replace your production webhook handler:
   ```
   cp pages/api/webhook-fixed.ts pages/api/webhook.ts
   ```

2. Make sure your production environment has the following variables set:
   ```
   BREVO_API_KEY=your-brevo-api-key
   BREVO_SENDER_EMAIL=solene.legendre@polyarthrite-andar.com
   BREVO_SENDER_NAME=ANDAR
   STRIPE_WEBHOOK_SECRET=whsec_...your_live_webhook_secret
   ```

3. Deploy your application using your normal deployment process.

4. Test a real purchase through the production checkout flow or use the Stripe dashboard to send a test webhook.

## 3. Troubleshooting

If emails are still not being sent in production:

1. Check your server logs for any errors.

2. Verify that your production environment variables are correct.

3. Test the direct email sending functionality:
   ```
   node test-email-direct.js
   ```

4. Make sure your Stripe webhook endpoint is correctly configured in the Stripe dashboard.

5. Consider implementing a webhook monitoring system to track failed webhook events.

## 4. Key Improvements in the Fixed Webhook

1. **Robust Email Extraction**: The new webhook handler has much better email extraction logic that checks multiple potential locations for the customer email.

2. **Enhanced Error Handling**: All operations have proper try/catch blocks with detailed error logging.

3. **Retry Logic**: Email sending now has retry logic to handle transient failures.

4. **Debug Mode**: The `DEBUG_WEBHOOK=true` setting allows bypassing signature verification during development.

5. **Comprehensive Logging**: The webhook now logs detailed information about its operation, making troubleshooting easier.

Remember to check both your application logs and the Brevo dashboard to ensure that emails are being sent correctly. 