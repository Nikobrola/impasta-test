# Netlify Deployment Guide

## Prerequisites
- A GitHub account (or GitLab/Bitbucket)
- A Netlify account (free tier works)
- Your Supabase project URL and anon key

## Step 1: Push Your Code to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub repository**:
   - Go to https://github.com/new
   - Create a new repository (don't initialize with README)
   - Copy the repository URL

3. **Push your code**:
   ```bash
   git remote add origin YOUR_REPOSITORY_URL
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard (Easiest)

1. **Go to Netlify**:
   - Visit https://app.netlify.com
   - Sign up/Log in with GitHub

2. **Add a new site**:
   - Click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"
   - Authorize Netlify to access your GitHub
   - Select your repository

3. **Configure build settings**:
   - **Build command**: `npm run build` (should auto-detect)
   - **Publish directory**: `dist` (should auto-detect)
   - Click "Deploy site"

4. **Add Environment Variables**:
   - Go to Site settings → Environment variables
   - Add these variables:
     - `VITE_SUPABASE_URL` = Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
   - Click "Save"
   - Go to Deploys → Trigger deploy → Deploy site (to rebuild with env vars)

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize Netlify**:
   ```bash
   netlify init
   ```
   - Choose "Create & configure a new site"
   - Choose your team
   - Site name (or leave blank for random)
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Add Environment Variables**:
   ```bash
   netlify env:set VITE_SUPABASE_URL "your-supabase-url"
   netlify env:set VITE_SUPABASE_ANON_KEY "your-supabase-anon-key"
   ```

5. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

## Step 3: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Go to Settings → API
3. Copy:
   - **Project URL** (this is your `VITE_SUPABASE_URL`)
   - **anon/public key** (this is your `VITE_SUPABASE_ANON_KEY`)

## Step 4: Configure Supabase for Production

1. **Update Supabase CORS settings**:
   - Go to Settings → API → CORS
   - Add your Netlify domain (e.g., `https://your-site.netlify.app`)

2. **Update RLS policies** (if needed):
   - Make sure your RLS policies work with anonymous users
   - Test authentication flow

## Step 5: Test Your Deployment

1. Visit your Netlify URL (e.g., `https://your-site.netlify.app`)
2. Test the game flow:
   - Create a room
   - Join from another device/browser
   - Test game functionality

## Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Make sure all dependencies are in `package.json`
- Check for TypeScript errors: `npm run build` locally first

### Environment Variables Not Working
- Make sure variables start with `VITE_` prefix
- Redeploy after adding environment variables
- Check Netlify build logs for errors

### Supabase Connection Issues
- Verify your Supabase URL and key are correct
- Check Supabase CORS settings
- Check browser console for errors

### Real-time Not Working
- Make sure Supabase Realtime is enabled
- Check Supabase dashboard → Database → Replication
- Verify your Supabase plan supports Realtime

## Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] Netlify site created and connected to GitHub
- [ ] Environment variables added (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [ ] Site rebuilt after adding environment variables
- [ ] Supabase CORS configured for Netlify domain
- [ ] Tested game functionality

## Need Help?

- Netlify Docs: https://docs.netlify.com
- Supabase Docs: https://supabase.com/docs
- Check build logs in Netlify dashboard for specific errors

