# KilangDM Dashboard - Next.js 14

A modern, Apple-style business intelligence dashboard built with Next.js 14, React, TypeScript, and Tailwind CSS.

## Features

- **Apple-Style Design**: Clean white background, soft shadows, rounded-2xl cards, glassmorphism effects
- **Modern Stack**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS
- **Smooth Animations**: Framer Motion for delightful user interactions
- **Firebase Integration**: Real-time data synchronization
- **Responsive Design**: Mobile-first approach with beautiful UI across all devices
- **Performance Optimized**: Fast loading, smooth transitions, and efficient rendering

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **Animations**: Framer Motion
- **Database**: Firebase Firestore
- **Charts**: Chart.js with react-chartjs-2

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

1. Clone the repository or navigate to the project directory:

\`\`\`bash
cd kilangdm-nextjs
\`\`\`

2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:

Create a \`.env.local\` file in the root directory and add your Firebase credentials:

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
\`\`\`

4. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

\`\`\`
kilangdm-nextjs/
├── src/
│   ├── app/                 # Next.js 14 App Router pages
│   │   ├── dashboard/       # Dashboard page
│   │   ├── ecommerce/       # eCommerce input page
│   │   ├── marketing/       # Marketing input page
│   │   ├── salesteam/       # Sales team input page
│   │   ├── followup/        # Follow-up page
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Homepage
│   │   └── globals.css      # Global styles
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── Navigation.tsx   # Navigation component
│   │   └── Footer.tsx       # Footer component
│   └── lib/                 # Utility functions
│       └── firebase.ts      # Firebase configuration
├── public/                  # Static assets
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
\`\`\`

## Design System

### Colors

- **Primary**: Blue gradient (#0ea5e9 → #0284c7)
- **Background**: Clean white (#ffffff)
- **Text**: Gray scale (#111827, #4b5563, #9ca3af)

### Typography

- **Font Family**: Inter (Google Fonts)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Components

All components follow Apple's design principles:
- Rounded corners (rounded-2xl = 1rem)
- Soft shadows for depth
- Glassmorphism effects for overlays
- Smooth transitions and animations

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Firebase Hosting

1. Build the project:
\`\`\`bash
npm run build
\`\`\`

2. Export static files (if using static export):
\`\`\`bash
npm run export
\`\`\`

3. Deploy to Firebase:
\`\`\`bash
firebase deploy
\`\`\`

## Contributing

This is a private project for KilangDM. For any suggestions or improvements, please contact the development team.

## License

© 2024 KilangDM. All rights reserved.
