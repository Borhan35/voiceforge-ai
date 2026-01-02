# Deployment Guide for VoiceForge AI

This guide will help you deploy your application for free.

## Prerequisites
- A **GitHub** account.
- Accounts on **Vercel** (for frontend) and **Render** (for backend).

## Step 1: Push Code to GitHub
1. Create a new repository on GitHub (e.g., `voiceforge-ai`).
2. Open your terminal in VS Code (`Ctrl+` `)`.
3. Run these commands to push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   # Replace the URL below with your new repository URL
   git remote add origin https://github.com/YOUR_USERNAME/voiceforge-ai.git
   git push -u origin main
   ```

## Step 2: Deploy Backend (Render)
1. Go to [dashboard.render.com](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Select the repository `voiceforge-ai`.
5. Configure the following:
   - **Name**: `voiceforge-backend` (or similar)
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Scroll down to **Free** plan and click **Create Web Service**.
7. Wait for deployment to finish. **Copy the backend URL** (e.g., `https://voiceforge-backend.onrender.com`).

## Step 3: Deploy Frontend (Vercel)
1. Go to [vercel.com/new](https://vercel.com/new).
2. Import your `voiceforge-ai` repository.
3. Configure the Project:
   - **Root Directory**: Click "Edit" and select `frontend`.
   - **Environment Variables**:
     - Key: `VITE_API_URL`
     - Value: `https://voiceforge-backend.onrender.com` (Your Render URL from Step 2).
4. Click **Deploy**.

## Step 4: Final Check
- Visit your Vercel URL.
- Try generating a voice. It should connect to your Render backend.
- **Note**: The free Render plan spins down after inactivity. The first request might take 50 seconds to wake it up.
