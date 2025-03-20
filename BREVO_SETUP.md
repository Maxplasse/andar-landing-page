# Setting Up Brevo Email Integration

This guide provides step-by-step instructions for setting up Brevo (formerly Sendinblue) email templates to send membership confirmation emails after successful Stripe payments.

## Prerequisites

- A Brevo account (you can sign up at [https://www.brevo.com/](https://www.brevo.com/))
- Access to your ANDAR website codebase

## Step 1: Configure Your Brevo Account

1. Log in to your Brevo account.
2. Verify your sender email domain to ensure good deliverability.
3. Navigate to **SMTP & API** in the left sidebar.
4. Copy your API v3 key (this has already been added to your `.env.local` file).

## Step 2: Create an Email Template in Brevo

1. Navigate to **Email > Templates** in the left sidebar.
2. Click **Create a template** and select **Drag & Drop editor**.
3. Name your template "ANDAR Membership Confirmation" and click **Create**.
4. Design your email template using the drag-and-drop editor.
5. Use the following structure for your template:
   - Header with ANDAR logo
   - Greeting: "Bonjour {{params.name}},"
   - Confirmation message: "Merci pour votre adhésion à ANDAR!"
   - Membership details section:
     - Type: "{{params.membershipDetails.name}}"
     - Price: "{{params.membershipDetails.price}}"
     - Description: "{{params.membershipDetails.description}}"
     - Duration: "{{params.membershipDetails.duration}}"
   - Footer with contact information
6. Save the template.
7. Note the template ID (visible in the URL when you edit the template).
8. Update the `EmailTemplate.MEMBERSHIP_CONFIRMATION` enum value in `utils/email.ts` with your template ID.

## Step 3: Testing the Email Integration

Once your template is set up, you can test the email integration using the provided test endpoint:

1. Run your development server:
   ```bash
   npm run dev
   ```

2. Send a test email using cURL or Postman:
   ```bash
   curl -X POST http://localhost:3000/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"email":"your.email@example.com","name":"Your Name","membershipType":"digital"}'
   ```

3. Check your inbox for the test email.

## Step 4: Customizing the Email Template

You can further customize the email template by adding more parameters:

1. In `utils/email.ts`, modify the `sendMembershipConfirmationEmail` function to include additional parameters.
2. Update your Brevo template to use these new parameters.

For example, to add a custom message based on membership type:

```typescript
// In utils/email.ts
export async function sendMembershipConfirmationEmail(
  email: string,
  name: string,
  membershipType: string
) {
  return sendEmail({
    to: { email, name },
    templateId: EmailTemplate.MEMBERSHIP_CONFIRMATION,
    params: {
      name,
      membershipType,
      date: new Date().toLocaleDateString('fr-FR'),
      membershipDetails: getMembershipDetails(membershipType),
      welcomeMessage: membershipType === 'digital' 
        ? 'Bienvenue dans notre communauté numérique!'
        : 'Bienvenue dans la grande famille ANDAR!',
    },
  });
}
```

Then in your Brevo template, use `{{params.welcomeMessage}}` to display this custom text.

## Troubleshooting

- **Emails Not Sending**: Check the console logs for error messages. Ensure your Brevo API key is correct and that your sender domain is verified.
- **Template Variables Not Working**: Ensure your template variables exactly match the parameters you're passing from the code.
- **Emails Going to Spam**: Verify your sender domain in Brevo and ensure your email content doesn't contain spam triggers.

## Production Considerations

- Ensure the `BREVO_SENDER_EMAIL` in your production environment matches a verified sender in your Brevo account.
- Monitor your email sending limits to avoid hitting Brevo's rate limits.
- Consider implementing error handling for failed email sends, such as adding them to a queue for retry. 