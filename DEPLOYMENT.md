# Deployment Guide for Thoven Music App

## Vercel Deployment Steps

### 1. GitHub Repository
✅ Repository created at: https://github.com/sidetoolco/thoven-music-app

### 2. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import the GitHub repository: `sidetoolco/thoven-music-app`
4. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `.` (leave as is)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

### 3. Environment Variables

Add the following environment variable in Vercel:

```
NEXT_PUBLIC_API_BASE_URL = [Your Production API URL]
```

**Important**: Replace `[Your Production API URL]` with your actual Rails backend production URL (e.g., `https://api.thoven.com` or your Railway/Render/Heroku URL).

### 4. Deploy Backend First

Before the frontend will work properly, you need to deploy your Rails backend:

1. Deploy the Rails backend to a hosting service (Railway, Render, Heroku, etc.)
2. Ensure the backend is configured with:
   - CORS settings allowing your Vercel domain
   - Production database (PostgreSQL)
   - JWT secret keys
   - Google OAuth credentials (if using calendar features)

### 5. Update CORS in Rails Backend

In your Rails backend, update `config/initializers/cors.rb`:

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'https://your-vercel-app.vercel.app', 'https://your-custom-domain.com'
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
```

### 6. Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions

## API Endpoints Used

The frontend connects to these backend endpoints:

- **Auth**: `/api/v1/auth/login`, `/api/v1/auth/logout`
- **Teachers**: `/api/v1/teachers/*`, `/api/v1/teacher_finder`
- **Parents**: `/api/v1/parents/*`
- **Students**: `/api/v1/students/*`
- **Bookings**: `/api/v1/parents/bookings/*`
- **Bundles**: `/api/v1/teachers/bundles/*`

## Testing the Deployment

After deployment:

1. Visit your Vercel URL
2. Open browser console to check for API connection errors
3. Test the sign-in functionality
4. Verify API calls are reaching your backend

## Troubleshooting

### CORS Issues
- Ensure your Rails backend allows the Vercel domain
- Check that credentials are included in requests

### API Connection Failed
- Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly
- Ensure backend is running and accessible
- Check network tab for request details

### Build Failures
- Check Vercel build logs
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

## Local Testing with Production API

To test locally with production API:

1. Update `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=https://your-production-api.com
```

2. Run:
```bash
npm run dev
```

## Support

For deployment issues:
- Check Vercel logs
- Review Rails backend logs
- Ensure all environment variables are set correctly