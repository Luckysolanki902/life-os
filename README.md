# Life Dashboard (Gamified OS)

A minimal, classy, and dreamy personal operating system built with Next.js, Tailwind, and MongoDB.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env.local` file in the root:
    ```env
    MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/life-dashboard
    APP_PASSWORD=your-secret-password
    JWT_SECRET=your-long-random-secret
    ENCRYPTION_KEY=01234567890123456789012345678901 # Must be 32 chars
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Features

-   **Identity Metric**: "You are X% better version of yourself".
-   **Domains**: Health, Career, Learning, Startups, Social.
-   **Security**: Single-password auth, AES-256 encryption for private logs.
-   **UI**: Dreamy/Classy aesthetic with Light/Dark mode.
-   **Mobile**: Capacitor-ready layout (Bottom Nav).

## Tech Stack

-   Next.js 14 (App Router)
-   Tailwind CSS + Framer Motion
-   Redux Toolkit + Persist
-   MongoDB + Mongoose
-   Jose (JWT)
