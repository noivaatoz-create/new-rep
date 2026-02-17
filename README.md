# Nova - Deployment Guide

A modern travel application built with React, Express, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Neon (or any PostgreSQL) for database
- Vercel account

## 📦 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database (Neon)

1. Go to [Neon](https://neon.tech) and create a new project
2. Copy the **Connection string** (URI format)
3. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

4. Update the `.env` file:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=your-random-secret-key
NODE_ENV=development
```

### 3. Run Database Migrations

Push the database schema:

```bash
npm run db:push
```

### 4. Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## 🌐 Deploy to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Navigate to **Environment Variables**
   - Add:
     - `DATABASE_URL` - Your Neon (or PostgreSQL) connection string
     - `SESSION_SECRET` - A random secret key
     - `NODE_ENV` - Set to `production`

### Option 2: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Configure environment variables:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `NODE_ENV=production`
6. Click **Deploy**

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon / PostgreSQL connection string | ✅ Yes |
| `SESSION_SECRET` | Secret key for session encryption | ✅ Yes |
| `NODE_ENV` | Environment (development/production) | ✅ Yes |
| `ADMIN_USERNAME` | Admin username for initial setup | ❌ Optional |
| `ADMIN_PASSWORD` | Admin password for initial setup | ❌ Optional |

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type check with TypeScript
- `npm run db:push` - Push database schema to your database

## 🗄️ Database Schema

The application uses Drizzle ORM with PostgreSQL. Schema is defined in `shared/schema.ts`.

To modify the schema:
1. Edit `shared/schema.ts`
2. Run `npm run db:push` to apply changes

## 🔐 Security Notes

- Never commit `.env` files to version control
- Use strong, random values for `SESSION_SECRET`
- Rotate secrets regularly in production
- Use strong database credentials and restrict access in production

## 📚 Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Express, Node.js
- **Database**: PostgreSQL (Neon or any Postgres)
- **ORM**: Drizzle
- **Deployment**: Vercel
- **Authentication**: Passport.js with sessions

## 🐛 Troubleshooting

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- For Neon: check connection string and SSL (sslmode=require)
- Ensure the database is active

### Build Failures
- Clear `node_modules` and `dist` folders
- Run `npm install` again
- Check TypeScript errors with `npm run check`

### Session Issues
- Ensure `SESSION_SECRET` is set
- Check cookie settings in `server/index.ts`
- Verify `secure` cookie flag matches your environment (HTTPS in production)

## 📞 Support

For issues and questions, please open an issue on GitHub.
