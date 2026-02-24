# CivicLens - AI-Powered Civic Engagement Platform

CivicLens is a modern, transparent platform designed to bridge the gap between legislative hearings and public sentiment. Using advanced AI analysis, CivicLens provides real-time insights into legislative proceedings, helping citizens and policymakers understand the public's view on critical issues.

## Features

- **Landing Page**: A high-impact, public-facing landing page showcasing the platform's value proposition.
- **Auth-Gated Access**: Restricted access to sensitive dashboards with optimized loading states to prevent UI hangs.
- **Live Hearing Tracking**: Watch legislative hearings with real-time AI-generated caption summaries.
- **Sentiment Analysis**: AI-powered analysis of public comments to gauge community reaction.
- **Legislative Insights**: Briefing dashboards for policymakers summarizing key arguments, risks, and public feedback.
- **Admin Console**: Functional dashboard for administrators to create and manage hearings, and promote users to administrative roles.
- **User Profiles**: Personalized profiles for citizens to manage their identity and view their engagement.
- **Performance & Caching**: Efficient in-memory data fetching and state management using React Query for a snappy, responsive experience.

## Project info

**Application Name**: CivicLens
**Description**: Your Voice in Legislation - AI-powered civic engagement platform.

## Getting Started

### Prerequisites

- Node.js & npm installed

### Local Development

Follow these steps to get the project running locally:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd civic-voice-platform

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`.

## Architecture & Tech Stack

This project is built with:

- **Frontend**: Vite, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Backend/Auth**: Supabase
- **AI/ML**: Custom Supabase Edge Functions for sentiment analysis and summarization.

## Deployment

To deploy this project, you can push your changes to GitHub and connect it to your preferred hosting provider (e.g., Vercel, Netlify) or use Supabase for hosting Edge Functions.

## License

MIT
