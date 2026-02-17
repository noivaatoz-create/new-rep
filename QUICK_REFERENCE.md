# 🚀 Quick Reference Card

## Essential Commands

```bash
# Setup (first time)
./setup.sh                  # Run automated setup
# OR manually:
cp .env.example .env        # Create environment file
npm install                 # Install dependencies
npm run db:push             # Push schema to Supabase

# Development
npm run dev                 # Start dev server (http://localhost:5000)
npm run check               # Type check
npm run build               # Build for production

# Deployment
vercel                      # Deploy to Vercel
vercel --prod               # Deploy to production
```

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SESSION_SECRET=your-random-secret-key
NODE_ENV=development
```

## Supabase Setup (5 minutes)

1. Go to https://supabase.com → Create project
2. Settings → Database → Copy "Connection String"
3. Paste into `.env` as `DATABASE_URL`
4. Run `npm run db:push`

## Vercel Deployment (3 minutes)

### Option 1: CLI
```bash
npm i -g vercel
vercel login
vercel
```

### Option 2: Dashboard
1. Push to GitHub
2. Import on vercel.com
3. Add env vars
4. Deploy

## Required Vercel Environment Variables

- `DATABASE_URL` → Your Supabase connection string
- `SESSION_SECRET` → Random secret (generate with `openssl rand -base64 32`)
- `NODE_ENV` → `production`

## Project Structure

```
Nova/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types & schema
├── .env.example     # Environment template
├── vercel.json      # Vercel config
└── README.md        # Full documentation
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection fails | Check `DATABASE_URL` format |
| Build fails | Run `npm install` and `npm run check` |
| Session issues | Verify `SESSION_SECRET` is set |
| Vercel deployment fails | Check environment variables in dashboard |

## Important Files

- `README.md` → Full documentation
- `DEPLOYMENT_CHECKLIST.md` → Step-by-step deployment guide
- `MIGRATION_SUMMARY.md` → What changed from Replit
- `.env.example` → Environment variable template

## Support

- Check `README.md` for detailed troubleshooting
- Review Vercel deployment logs
- Check Supabase database logs

## What Changed from Replit?

✅ Removed all Replit dependencies  
✅ Switched from Neon to Supabase (PostgreSQL)  
✅ Configured for Vercel deployment  
✅ Added proper environment variable management  
✅ Created comprehensive documentation  

## Next Steps After Deployment

1. ✅ Test the deployed app
2. ✅ Set up custom domain (optional)
3. ✅ Enable Vercel Analytics (optional)
4. ✅ Configure Supabase Row Level Security
5. ✅ Set up monitoring and alerts
