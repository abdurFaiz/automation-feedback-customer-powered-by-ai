# 🌪️ Customer Feedback Insights

**Closing the Gap Between What Customers Say and What Businesses Do**

Customer Feedback Insights is a state-of-the-art Feedback Management System (FMS) designed to transform raw customer reviews into actionable business intelligence. Built for high-stakes service industries like coffee shops, retail, and hospitality, Customer doesn't just display data—it monitors the Impact Velocity of every operational change you make.

![alt text](https://raw.githubusercontent.com/your-username/Customer/main/public/og-image.png)
*(Note: Replace with your actual dashboard screenshot)*

## 🚀 The Core Philosophy: "The Loop"

Unlike traditional analytics that stop at insights, Customer is built on a continuous improvement cycle:

1. **Hear**: Ingest data from Google Maps Reviews, Spreadsheets, and direct inputs.
2. **Analyze**: AI-driven sentiment scoring and categorical classification (Product, Staff, Wifi, etc.).
3. **Act**: Owners log specific actions (e.g., "Upgraded WiFi Router" or "Changed Barista Shift").
4. **Evaluate**: Measure the Impact Velocity—how fast did customer sentiment improve after your action?

## ✨ Key Features

- 🎯 **Pain Point Matrix**: A 2x2 prioritization grid (Frequency vs. Negativity) to identify "Crisis" zones instantly.
- 📈 **Impact Timeline**: Correlate your logged actions directly onto the rating/sentiment chart to see "Before vs. After" results.
- 💰 **Revenue Risk**: AI-estimated monthly loss based on customer churn and negative sentiment trends.
- ⚡ **AI SOP Generator**: Automatic generation of operational Standard Operating Procedures based on detected issues.
- 📊 **Sentiment breakdown**: Granular analysis of Business Pillars (Service, Hygiene, Product, Atmosphere).
- 🔒 **Shared SSO**: Seamless authentication between the core app and the analytical suite under the Customer.id ecosystem.

## 🛠️ Tech Stack

This project is built with the modern [T3 Stack](https://create.t3.gg/) and additional cutting-edge technologies:

### Core Framework
- **[Next.js 15](https://nextjs.org)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[React 19](https://react.dev/)** - UI library with latest features

### Database & ORM
- **[Prisma](https://prisma.io)** - Type-safe database ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Production database

### Authentication
- **[NextAuth.js v5](https://next-auth.js.org)** - Authentication solution
- **[@auth/prisma-adapter](https://authjs.dev/reference/adapter/prisma)** - Database adapter

### API & State Management
- **[tRPC](https://trpc.io)** - End-to-end typesafe APIs
- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[Zod](https://zod.dev/)** - Schema validation

### UI & Styling
- **[Tailwind CSS v4](https://tailwindcss.com)** - Utility-first CSS framework
- **[HeroUI](https://heroui.com/)** - Modern React component library
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library

### Development Tools
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[TypeScript ESLint](https://typescript-eslint.io/)** - TypeScript linting

## 📁 Project Structure

```
Customer-feedback-insights/
├── prisma/                    # Database schema and migrations
│   └── schema.prisma         # Prisma schema definition
├── public/                   # Static assets
│   └── favicon.ico
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── _components/      # App-specific components
│   │   ├── api/             # API routes
│   │   │   ├── auth/        # Authentication endpoints
│   │   │   └── trpc/        # tRPC API handler
│   │   ├── auth/            # Authentication pages
│   │   │   ├── login/       # Login page
│   │   │   ├── register/    # Registration page
│   │   │   └── verify-email/ # Email verification
│   │   ├── dashboard/       # Dashboard pages
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   └── providers.tsx    # App providers
│   ├── components/          # Reusable components
│   │   ├── auth/           # Authentication components
│   │   └── shared/         # Shared UI components
│   ├── hooks/              # Custom React hooks
│   ├── server/             # Server-side code
│   │   ├── api/           # tRPC routers and procedures
│   │   ├── auth/          # Authentication configuration
│   │   └── db.ts          # Database connection
│   ├── styles/            # Global styles
│   ├── trpc/              # tRPC client configuration
│   └── env.js             # Environment variables validation
├── generated/             # Generated Prisma client
├── .env                   # Environment variables
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── eslint.config.js      # ESLint configuration
└── prettier.config.js    # Prettier configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** database

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Customer-feedback-insights.git
cd Customer-feedback-insights
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/Customer_db"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Configuration (optional)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@Customer.id"
```

### 4. Database Setup

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio to view your database
npm run db:studio
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbo
npm run build        # Build for production
npm run start        # Start production server
npm run preview      # Build and start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run typecheck    # Run TypeScript type checking
npm run check        # Run linting and type checking
npm run format:check # Check code formatting
npm run format:write # Format code with Prettier
```

## 🔧 Development Workflow

### Adding New Features

1. **Database Changes**: Update `prisma/schema.prisma` and run `npm run db:push`
2. **API Routes**: Create tRPC procedures in `src/server/api/routers/`
3. **UI Components**: Add components in `src/components/`
4. **Pages**: Create pages in `src/app/`

### Code Quality

The project enforces code quality through:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for consistent formatting
- **Prisma** for type-safe database operations

### Authentication Flow

The app uses NextAuth.js v5 with:
- Email/password authentication
- OAuth providers (Google, GitHub, etc.)
- Database sessions with Prisma adapter
- Protected routes and middleware

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on every push

### Docker

```bash
# Build Docker image
docker build -t Customer-feedback-insights .

# Run container
docker run -p 3000:3000 Customer-feedback-insights
```

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 📚 Learn More

### Technology Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/getting-started/introduction)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 👥 Authors

Developed with ❤️ by **Spinotek Team**.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
