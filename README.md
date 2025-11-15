# KilangDM Dashboard - Next.js 14

**Version 2.2.0** - A modern, Apple-style business intelligence dashboard built with Next.js 14, React, TypeScript, and Tailwind CSS.

## 🎯 Overview

KilangDM Dashboard is a comprehensive business intelligence platform designed for managing eCommerce operations, sales teams, and marketing data. It features advanced analytics, customer insights, and team performance tracking with a beautiful, modern interface.

## ✨ Key Features

### 📊 **Tabbed Orders Dashboard**
- **Overview Tab**: Quick stats, recent orders, and key metrics
- **Customers Tab**: Customer analytics, top spenders, repeat customers, contact directory
- **Products Tab**: Product performance, best sellers, slow movers, inventory insights
- **Teams Tab**: Sales team leaderboard, performance comparison, platform distribution

### 🌙 **Dark Mode**
- Modern slate-based dark theme with enhanced contrast
- Automatic system preference detection
- Smooth theme transitions
- Optimized for eye comfort

### 📄 **PDF Invoice Processing**
- Automatic data extraction from PDF invoices
- Structured product information with size breakdowns
- Customer contact details and shipping addresses
- Tracking number and payment method capture

### 📈 **Advanced Analytics**
- Revenue trends and monthly comparisons
- Platform performance analysis
- Team sales metrics
- Product performance tracking
- Customer lifetime value

### 🔍 **Smart Filtering & Search**
- Multi-criteria filtering (date range, platform, team, amount)
- Real-time search across all order fields
- Quick filter presets (Last 7 days, Last 30 days, This month)
- Filter combination with visual indicators

### 📤 **Flexible Export Options**
- Export to CSV and PDF formats
- Filtered data export
- Date range export
- Formatted reports with summaries

### 🎨 **Apple-Style Design**
- Clean, modern interface with glassmorphism effects
- Soft shadows and smooth animations
- Responsive design for all devices
- Consistent design language throughout

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.4
- **Styling**: Tailwind CSS 3.4 with custom design tokens
- **Animations**: Framer Motion 11.0
- **Database**: Firebase Firestore
- **Charts**: Chart.js 4.5 with react-chartjs-2
- **PDF Export**: jsPDF 3.0
- **Date Handling**: date-fns 3.6

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Firebase project with Firestore enabled

### Installation

1. **Clone or navigate to the project**:
```bash
cd kilangdm-nextjs
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:

Create a `.env.local` file:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. **Run development server**:
```bash
npm run dev
```

5. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
kilangdm-nextjs/
├── src/
│   ├── app/                      # Next.js 14 App Router
│   │   ├── dashboard/            # Main dashboard
│   │   ├── orders/               # Orders management
│   │   │   ├── components/       # Tab components
│   │   │   │   ├── TabNavigation.tsx
│   │   │   │   ├── OverviewTab.tsx
│   │   │   │   ├── CustomersTab.tsx
│   │   │   │   ├── ProductsTab.tsx
│   │   │   │   └── TeamsTab.tsx
│   │   │   ├── analytics.tsx     # Analytics component
│   │   │   └── page.tsx          # Orders page
│   │   ├── ecommerce/            # Order input
│   │   ├── marketing/            # Marketing data
│   │   ├── salesteam/            # Sales team data
│   │   ├── followup/             # Customer follow-ups
│   │   ├── team-members/         # Team management
│   │   ├── awb-upload/           # AWB file upload
│   │   ├── layout.tsx            # Root layout with theme
│   │   ├── page.tsx              # Homepage
│   │   └── globals.css           # Global styles + dark mode
│   ├── components/               # Shared components
│   │   ├── ui/                   # UI components
│   │   │   ├── Button.tsx
│   │   │   └── Card.tsx
│   │   ├── ThemeToggle.tsx       # Dark mode toggle
│   │   ├── Navigation.tsx
│   │   └── Footer.tsx
│   ├── contexts/                 # React contexts
│   │   └── ThemeContext.tsx      # Theme provider
│   ├── lib/                      # Utilities
│   │   ├── firebase.ts           # Firebase config
│   │   ├── firestore.ts          # Firestore functions
│   │   └── exportUtils.ts        # Export functions
│   └── styles/                   # Additional styles
├── public/                       # Static assets
├── .env.local                    # Environment variables
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

## 🎨 Design System

### Color Palette

**Light Mode:**
- Background: White (#ffffff)
- Text: Gray-900 (#111827)
- Accents: Blue-500 to Blue-600 gradient

**Dark Mode:**
- Background: Slate-900 (#0f172a)
- Text: Slate-50 (#f8fafc)
- Accents: Blue-400 to Blue-500 with glow effects
- Cards: Slate-800 with elevated shadows

### Typography

- **Font**: Inter (Google Fonts)
- **Weights**: 400, 500, 600, 700
- **Display**: Swap for performance

### Components

All components follow Apple's design philosophy:
- Generous rounded corners (rounded-2xl)
- Soft, layered shadows
- Glassmorphism for overlays
- Smooth transitions (300ms)
- Hover states with subtle transforms

## 📊 Features in Detail

### Orders Dashboard

**Overview Tab:**
- Total orders, revenue, and average order value
- Unique customer count
- Recent 10 orders with quick access

**Customers Tab:**
- Top 10 customers by spending
- Customer retention rate
- Repeat vs new customer breakdown
- Complete contact directory with phone and address
- Customer lifetime value tracking

**Products Tab:**
- Best selling products by revenue
- Most popular products by quantity sold
- Slow moving product alerts
- Product type categorization
- Average price per unit

**Teams Tab:**
- Sales team performance leaderboard
- Revenue comparison with rankings
- Market share percentage
- Platform distribution per team
- Performance vs average indicators

### Data Processing

- **Automatic Deduplication**: Removes duplicate orders based on invoice numbers
- **PDF Data Extraction**: Parses PDF invoices for structured data
- **Real-time Updates**: Live data from Firebase
- **Smart Filtering**: Complex multi-criteria filtering with instant results

## 🔧 Available Scripts

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint checks
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy automatically on push

### Manual Build

```bash
npm run build
npm run start
```

## 🔐 Environment Variables

Required variables for `.env.local`:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

## 🎯 Business Use Cases

### For Business Owners
- Track overall business performance
- Identify top customers and products
- Monitor team productivity
- Make data-driven decisions

### For Sales Managers
- Compare team performance
- Track individual sales metrics
- Identify training opportunities
- Optimize platform strategies

### For Operations
- Process orders efficiently
- Track inventory movement
- Manage customer relationships
- Generate reports for analysis

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔄 Recent Updates

### Version 2.2.0 (Latest)
- ✨ Tabbed orders dashboard with focused insights
- 🌙 Enhanced dark mode with slate color scheme
- 📊 Customer analytics and insights
- 👕 Product performance tracking
- 👔 Team performance comparison
- 🔧 Automatic order deduplication
- 🎨 Improved visual contrast and accessibility

### Version 2.1.0
- 🌙 Dark theme implementation
- 📄 PDF invoice processing
- 📈 Advanced analytics charts
- 🔍 Enhanced filtering options

## 🤝 Contributing

This is a private project for KilangDM. For suggestions or improvements, contact the development team.

## 📄 License

© 2024-2025 KilangDM. All rights reserved.

---

**Built with** ❤️ **using Next.js 14 and modern web technologies**
