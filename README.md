# ANDAR Landing Page

This repository contains the landing page for ANDAR (Association nationale de défense contre la polyarthrite rhumatoïde), a French association dedicated to supporting people with rheumatoid arthritis.

## Overview

The landing page is built with Next.js and includes features such as:

- Modern, responsive design
- Membership subscription via Stripe
- Stripe webhook integration for payment processing
- Thank you page for successful memberships
- Legal pages (Terms of Service, Privacy Policy, Cookie Policy)

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn
- A Stripe account for membership payments

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/andar-landing-page.git
cd andar-landing-page
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Configure environment variables
```bash
cp .env.local.example .env.local
```
Edit `.env.local` and add your Stripe API keys.

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Stripe Integration

This project includes Stripe integration for handling membership subscriptions. For details on setting up Stripe webhooks and testing the payment flow, please refer to the [STRIPE_SETUP.md](STRIPE_SETUP.md) file.

## Project Structure

- `pages/` - Next.js pages and API routes
  - `api/` - API endpoints for Stripe integration
  - `merci-adhesion.tsx` - Thank you page for successful memberships
  - Various legal pages
- `components/` - Reusable React components
- `public/` - Static assets
- `styles/` - Global styles

## Deployment

The site can be deployed using [Vercel](https://vercel.com/) (recommended for Next.js projects) or any other hosting service that supports Node.js applications.

Follow these steps for deployment:
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- ANDAR Association for their mission in supporting people with rheumatoid arthritis
- Next.js team for providing an excellent framework
- Stripe for their payment processing platform 