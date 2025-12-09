# Deployment Guide

This guide explains how to deploy the PUBG Tournament App to production using **Vercel** (Frontend) and **Render/Railway** (Backend).

## Prerequisites
- GitHub Account
- Vercel Account (for Frontend)
- Render or Railway Account (for Backend)
- MongoDB Atlas Account (for Database)

---

## 1. Database Setup (MongoDB Atlas)
1.  Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a new Cluster (Shared Free Tier is fine for starting).
3.  Whitelist "Allow Access from Anywhere" (0.0.0.0/0) in Network Access or specific IPs of your hosting provider.
4.  Create a Database User (Username/Password).
5.  Get the Connection String:
    `mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/pubg-app`

---

## 2. Backend Deployment (Render.com)
We will deploy the Node.js/Express server first.

1.  **Create a new Web Service**:
    - Connect your GitHub repository.
    - **Root Directory**: `server`
    - **Build Command**: `npm install`
    - **Start Command**: `node server.js` 
2.  **Environment Variables**:
    Add the following in the "Environment" tab:
    - `MONGODB_URI`: (Your MongoDB Connection String)
    - `JWT_SECRET`: (A long random string)
    - `PORT`: `10000` (Render default)
    - `CASHFREE_APP_ID`: (Your Cashfree App ID)
    - `CASHFREE_SECRET_KEY`: (Your Cashfree Secret)
    - `CASHFREE_ENV`: `TEST` (or `PROD`)
3.  **Deploy**: Click "Create Service".
4.  **Copy URL**: Once deployed, copy the URL (e.g., `https://pubg-server.onrender.com`).

---

## 3. Frontend Deployment (Vercel)
Now deploy the Next.js frontend.

1.  **Import Project**:
    - Go to Vercel Dashboard -> "Add New..." -> "Project".
    - Select your GitHub repository.
2.  **Configure Project**:
    - **Framework Preset**: Next.js
    - **Root Directory**: `./` (Default)
3.  **Environment Variables**:
    - `NEXT_PUBLIC_API_URL`: The URL of your deployed Backend (e.g., `https://pubg-server.onrender.com/api`)
    - `NEXT_PUBLIC_CASHFREE_MODE`: `sandbox` (or `production`)
4.  **Deploy**: Click "Deploy".

---

## 4. Post-Deployment Checks
1.  **CORS**: If you face CORS errors, update `server/server.js` to allow your Vercel domain in the CORS origin list.
2.  **Admin User**: Use an API tool (like Postman) or a script to create the first Admin user on the production database.

## Troubleshooting
- **Build Fails**: Check if you included `package-lock.json` or `pnpm-lock.yaml`.
## 5. Environment Variables Map

Here is exactly where each variable from your `.env` file should go.

### **Backend (Render / Railway / Docker)**
**Add ALL of these to your Backend hosting settings.** The backend does all the heavy lifting.

| Variable Name | Value / Description |
| :--- | :--- |
| `MONGODB_URI` | Your MongoDB Connection String |
| `JWT_SECRET` | Secure Random String (e.g. `openssl rand -base64 32`) |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `MESSAGECENTRAL_BASE` | MessageCentral API URL |
| `MC_CUSTOMER_ID` | MessageCentral Data |
| `MC_COUNTRY_CODE` | MessageCentral Data |
| `MC_KEY` | MessageCentral Data |
| `MC_SCOPE` | MessageCentral Data |
| `CASHFREE_APP_ID` | Cashfree App ID (Test/Prod) |
| `CASHFREE_SECRET_KEY` | Cashfree Secret (Test/Prod) |
| `CASHFREE_WEBHOOK_SECRET` | Cashfree Webhook Secret |
| `CASHFREE_ENV` | `TEST` or `PROD` |
| `PORT` | Optional (Render usually sets this automatically to `10000`) |

### **Frontend (Vercel)**
The Frontend only needs to know **where the backend is**. It should **NOT** have access to database keys or payment secrets.

| Variable Name | Value / Description |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **CRITICAL**: The URL of your deployed backend (e.g., `https://my-pubg-api.onrender.com/api`) |
| `NEXT_PUBLIC_CASHFREE_MODE` | `sandbox` or `production` |

> **⚠️ SECURITY WARNING**: Never put keys starting with `NEXT_PUBLIC_` in your backend secrets, and NEVER put backend secrets (like `JWT_SECRET` or `CASHFREE_SECRET_KEY`) in your Frontend Vercel variables. Anyone can see frontend variables in their browser!

---

## 6. Advanced DevOps (Docker & CI/CD)

Yes! You can use **Docker** and **CI/CD** workflows to make your deployment more professional.

### **A. Docker (Containerization)**
I have added a `Dockerfile` to your `server` folder. This allows you to package your backend as a lightweight container.

**How to run locally with Docker:**
```bash
# 1. Build the image
docker build -t pubg-backend ./server

# 2. Run the container (passing env vars)
docker run -p 5050:5050 --env-file ./server/.env pubg-backend
```

### **B. CI/CD (Hub & Automation)**
Since you are using **Vercel** and **Render**, you actually **already have CI/CD**!
*   **Continuous Integration (CI)**: When you push to GitHub, Vercel/Render detects the changes.
*   **Continuous Deployment (CD)**: They automatically build and deploy the new version.

**Moving to Custom CI/CD (GitHub Actions)**
If you want to host on a VPS (like AWS EC2 or DigitalOcean) instead of Render/Vercel, you would use GitHub Actions.

**Example Workflow**: Create `.github/workflows/deploy.yml`
```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ "main" ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: ./server
        push: true
        tags: yourusername/pubg-backend:latest
```

