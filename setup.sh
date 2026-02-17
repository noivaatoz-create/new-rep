#!/bin/bash

# Nova - Quick Setup Script
# This script helps you set up the project quickly

set -e

echo "🚀 Nova Setup Script"
echo "===================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your Supabase credentials before continuing!"
    echo ""
    echo "To get your Supabase credentials:"
    echo "1. Go to https://supabase.com"
    echo "2. Create a new project"
    echo "3. Go to Settings → Database"
    echo "4. Copy the Connection String (URI format)"
    echo ""
    read -p "Press Enter after you've updated .env file..."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Pushing database schema to Supabase..."
npm run db:push

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "The app will be available at http://localhost:5000"
echo ""
