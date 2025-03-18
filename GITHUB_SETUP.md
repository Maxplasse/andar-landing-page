# Setting Up Your GitHub Repository

Follow these steps to push your ANDAR landing page code to GitHub:

## 1. Create a New Repository on GitHub

1. Visit [GitHub](https://github.com/) and sign in to your account.
2. Click on the "+" icon in the top-right corner and select "New repository".
3. Name your repository (e.g., "andar-landing-page").
4. Add a description: "Landing page for ANDAR - Association nationale de défense contre la polyarthrite rhumatoïde"
5. Choose public or private visibility as per your preference.
6. Do NOT initialize the repository with a README, .gitignore, or license (since we've already initialized the repository locally).
7. Click "Create repository".

## 2. Connect Your Local Repository to GitHub

GitHub will show you commands to use. Since you've already initialized your repository locally and committed files, use these commands:

```bash
# Replace 'YOUR_USERNAME' with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/andar-landing-page.git
git branch -M main
git push -u origin main
```

If you're using SSH instead of HTTPS, the remote URL will be different:

```bash
git remote add origin git@github.com:YOUR_USERNAME/andar-landing-page.git
```

## 3. Verify the Push

1. Refresh your GitHub repository page to see if all the files have been pushed successfully.
2. Check that all the important files and directories are present, including:
   - Components
   - Pages
   - API routes
   - Configuration files
   - Documentation files

## 4. Setting Up GitHub Pages (Optional)

If you want to deploy a static export of your Next.js application to GitHub Pages:

1. Go to your repository's "Settings" tab.
2. Navigate to "Pages" in the left sidebar.
3. Under "Source", select "GitHub Actions".
4. Choose a Next.js workflow that suits your needs.
5. Configure the workflow file as necessary and commit it.

Note: For a full Next.js application with API routes, you'll need to use a more complete hosting solution like Vercel or Netlify.

## 5. Adding Repository Secrets for Stripe (Optional)

If you're planning to use GitHub Actions for CI/CD, you'll need to add your Stripe API keys as repository secrets:

1. Go to your repository's "Settings" tab.
2. Navigate to "Secrets and variables" → "Actions" in the left sidebar.
3. Click "New repository secret".
4. Add your Stripe API keys as secrets (e.g., STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET).

## 6. Collaborate and Maintain

Now that your repository is set up, you can:

- Invite collaborators from the "Settings" tab
- Create branches for new features
- Set up pull request templates
- Configure GitHub Actions for CI/CD
- Track issues and manage your project 