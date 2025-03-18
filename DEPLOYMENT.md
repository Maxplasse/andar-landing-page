# Deploying the ANDAR Landing Page

This guide covers how to deploy the ANDAR landing page to Vercel, which is the recommended hosting platform for Next.js applications.

## Deploying to Vercel

### Prerequisites

- A GitHub account with your repository pushed
- A Vercel account (you can sign up at [vercel.com](https://vercel.com/) using your GitHub account)

### Step 1: Connect to Vercel

1. Sign in to [Vercel](https://vercel.com/).
2. Click "Add New..." -> "Project".
3. Import your GitHub repository (you may need to install the Vercel GitHub app if this is your first time).
4. Select the "andar-landing-page" repository.

### Step 2: Configure Project

1. Keep the default framework preset as "Next.js".
2. Configure your project settings:
   - **Environment Variables**: Add your Stripe API keys as environment variables
     - `STRIPE_SECRET_KEY`
     - `STRIPE_PUBLISHABLE_KEY`
     - `STRIPE_WEBHOOK_SECRET`
   - **Build and Output Settings**: Keep defaults unless you have specific requirements

3. Click "Deploy".

### Step 3: Set Up a Custom Domain (Optional)

1. Once deployed, go to the "Domains" section in your project settings.
2. Add a custom domain you own, or purchase one through Vercel.
3. Follow the DNS configuration instructions provided by Vercel.

### Step 4: Update Stripe Webhook URL

After deployment, update your Stripe webhook URL to point to your production domain:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/) > Developers > Webhooks.
2. Update your webhook endpoint URL to `https://your-domain.com/api/webhook`.

## Deploying to Other Platforms

### Netlify

1. Sign up for [Netlify](https://www.netlify.com/).
2. Connect your GitHub repository.
3. Set the build command to `npm run build` and publish directory to `.next`.
4. Add your environment variables.
5. Deploy.

Note: You may need to add a `netlify.toml` file with additional configuration for API routes.

### AWS Amplify

1. Go to the [AWS Amplify Console](https://console.aws.amazon.com/amplify/home).
2. Connect your GitHub repository.
3. Configure the build settings according to Next.js requirements.
4. Add environment variables.
5. Deploy.

## Post-Deployment Checklist

After deploying to any platform, make sure to:

1. Test the entire user flow from the homepage to completing a membership payment.
2. Verify that webhooks are working correctly by making a test purchase.
3. Check that all pages are loading correctly and all links work.
4. Test the responsive design on various devices.
5. Set up analytics to track visitor behavior.

## Production Considerations

Before going live:

1. Make sure to switch from Stripe test keys to production keys.
2. Set up proper error logging with a service like Sentry.
3. Configure proper security headers.
4. Set up monitoring for your application.
5. Create a backup strategy for your data. 