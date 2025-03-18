# Setting Up Stripe Webhooks for ANDAR Membership

This guide provides step-by-step instructions for setting up Stripe webhooks to handle successful payments for ANDAR memberships.

## Prerequisites

- A Stripe account
- Your ANDAR Next.js application deployed (or running locally for testing)

## Step 1: Configure Your Environment Variables

1. Copy the `.env.local.example` file to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Stripe API keys:
   ```
   STRIPE_SECRET_KEY=sk_test_your_test_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

## Step 2: Set Up a Webhook Endpoint in the Stripe Dashboard

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/).

2. Navigate to **Developers > Webhooks**.

3. Click **Add endpoint**.

4. For the endpoint URL, enter your webhook URL:
   - For production: `https://yourdomain.com/api/webhook`
   - For local testing: Use a service like [ngrok](https://ngrok.com/) to expose your local server

5. In the **Events to send** section, select:
   - `checkout.session.completed`
   - `customer.subscription.created`

6. Click **Add endpoint** to create your webhook endpoint.

7. After creating the webhook, you'll see a **Signing secret**. Click **Reveal** to see the value, and copy it to your `.env.local` file as `STRIPE_WEBHOOK_SECRET`.

## Step 3: Testing Webhooks Locally

For local development, you can use the Stripe CLI to test webhooks:

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).

2. Log in to your Stripe account:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```

4. The CLI will output a webhook signing secret. Copy this value to your `.env.local` file:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
   ```

5. In a separate terminal, start your Next.js development server:
   ```bash
   npm run dev
   ```

6. Test the webhook by triggering a checkout session complete event:
   ```bash
   stripe trigger checkout.session.completed
   ```

## Step 4: Customizing the Webhook Handler

The webhook handler is located at `pages/api/webhook.ts`. You can customize it to perform additional actions when a payment is successful:

- Send confirmation emails
- Register users in your database
- Generate access credentials or membership cards
- Log transactions for your records

## Step 5: Going to Production

When you're ready to go to production:

1. Update your `.env.local` file with your live Stripe API keys.

2. Set up a webhook endpoint in your Stripe dashboard pointing to your production URL.

3. Copy the production webhook signing secret to your production environment variables.

4. Deploy your application with the updated configuration.

## Troubleshooting

- **Webhook Failed**: Check the Stripe dashboard for detailed error messages.
- **Signature Verification Failed**: Ensure your `STRIPE_WEBHOOK_SECRET` is correct.
- **Event Not Processing**: Check your server logs for errors in the webhook handler.

For more information, refer to the [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks). 