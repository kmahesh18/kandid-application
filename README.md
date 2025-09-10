# Linkbird.ai - Leads & Campaigns Management Platform

A modern, full-stack web application for managing lead generation campaigns, built with Next.js 15, Better Auth, PostgreSQL, and Drizzle ORM.

![Linkbird.ai Platform](https://img.shields.io/badge/Status-Production_Ready-success)
![Next.js](https://img.shields.io/badge/Next.js-15+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3+-06B6D4)

## 🌟 Features

### 🔐 Authentication System
- **Better Auth** integration with email/password and Google OAuth
- Protected routes with middleware
- Session management and secure logout
- User registration and login forms
- Password reset functionality

### 📊 Dashboard
- **Real-time analytics** with KPI cards
- Campaign performance metrics
- Lead conversion tracking
- Recent activity feed
- Quick action buttons

### 👥 Lead Management
- **Infinite scrolling** lead table
- Advanced search and filtering
- Lead status management (Pending, Contacted, Responded, Converted)
- Detailed lead profiles with interaction history
- Bulk operations (update, delete)
- Lead scoring system
- Campaign assignment

### 🎯 Campaign Management
- Campaign creation and management
- Status tracking (Draft, Active, Paused, Completed)
- Progress bars and success rate calculations
- Lead assignment to campaigns
- Bulk campaign operations
- Campaign analytics and insights

### 🎨 Modern UI/UX
- **Responsive design** for all screen sizes
- **shadcn/ui** component library
- Dark/light theme support
- Smooth animations and transitions
- Loading states and error handling
- Accessible components

## 🛠️ Tech Stack

### Frontend
- **Next.js 15+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern React component library
- **TanStack Query (React Query)** - Server state management
- **Zustand** - Client-side state management
- **Lucide React** - Beautiful icons

### Backend
- **Next.js API Routes** - Server-side API
- **Better Auth** - Authentication system
- **PostgreSQL** - Primary database
- **Drizzle ORM** - Type-safe database toolkit
- **Zod** - Schema validation

### DevOps
- **Vercel** - Deployment platform
- **ESLint & Prettier** - Code formatting
- **TypeScript** - Type checking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kandid-application
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure environment variables**
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/linkbird"
   
   # Better Auth
   BETTER_AUTH_SECRET="your-secret-key-here"
   BETTER_AUTH_URL="http://localhost:3000"
   
   # Google OAuth (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

5. **Database setup**
   ```bash
   # Generate database schema
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # (Optional) Seed with sample data
   npm run db:seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Visit the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard layout group
│   │   ├── campaigns/     # Campaigns page
│   │   ├── leads/         # Leads page
│   │   ├── dashboard/     # Dashboard page
│   │   ├── analytics/     # Analytics page
│   │   └── settings/      # Settings page
│   ├── auth/              # Authentication pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── campaigns-table.tsx
│   ├── leads-table.tsx
│   ├── app-sidebar.tsx
│   └── header.tsx
├── hooks/                # Custom React hooks
│   └── queries/          # TanStack Query hooks
├── lib/                  # Utility functions
├── store/                # Zustand stores
├── types/                # TypeScript types
└── db/                   # Database configuration
    ├── schema.ts         # Drizzle schema
    └── index.ts          # Database connection
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in/email` - Email login
- `GET /api/auth/session` - Get current session
- `POST /api/auth/sign-out` - Logout

### Campaigns
- `GET /api/campaigns` - List campaigns (with pagination, search, filters)
- `POST /api/campaigns` - Create campaign
- `PATCH /api/campaigns` - Bulk update campaigns
- `DELETE /api/campaigns` - Bulk delete campaigns

### Leads
- `GET /api/leads` - List leads (with pagination, search, filters)
- `POST /api/leads` - Create lead
- `GET /api/leads/[id]` - Get lead details
- `PUT /api/leads/[id]` - Update lead
- `DELETE /api/leads/[id]` - Delete lead
- `PATCH /api/leads` - Bulk update leads
- `DELETE /api/leads` - Bulk delete leads

### Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics

### Interactions
- `POST /api/leads/[id]/interactions` - Create interaction
- `GET /api/leads/[id]/interactions` - List interactions

## 🧪 Testing

### Backend API Testing
```bash
# Run automated backend tests
node test-backend.js

# Use HTTP client for manual testing
# Use api-tests.http with VS Code REST Client extension
```

### Frontend Testing
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

## 📊 Database Schema

### Users (Better Auth)
- Authentication and user management
- Supports email/password and OAuth

### Campaigns
- Campaign management with status tracking
- User-scoped with proper relationships

### Leads
- Lead information with company details
- Status progression and scoring
- Campaign assignment with foreign keys

### Account Interactions
- Interaction history (emails, calls, meetings)
- Timestamped with lead association

## 🎨 UI Components

### Layout Components
- **AppSidebar** - Collapsible navigation
- **Header** - Breadcrumbs and user actions
- **Layout** - Consistent page structure

### Data Tables
- **LeadsTable** - Infinite scroll, search, filters
- **CampaignsTable** - Progress bars, bulk actions
- Responsive design with loading states

### Forms & Sheets
- **CreateLeadSheet** - Lead creation form
- **CreateCampaignSheet** - Campaign creation form
- **LeadDetailSheet** - Detailed lead view
- Form validation with error handling

## 🔄 State Management

### Zustand Stores
- **UIStore** - Modal/sheet states, theme, loading
- **FilterStore** - Search and filter states
- **PaginationStore** - Pagination and sorting

### TanStack Query
- **Server state caching** with automatic invalidation
- **Infinite scroll** for large datasets
- **Optimistic updates** for better UX
- **Background refetching** for fresh data

## 🚀 Deployment

### Vercel Deployment
1. **Connect to Vercel**
   ```bash
   npx vercel
   ```

2. **Configure environment variables** in Vercel dashboard

3. **Set up database** (Vercel Postgres or external provider)

4. **Deploy**
   ```bash
   git push origin main
   ```

### Manual Deployment
```bash
# Build application
npm run build

# Start production server
npm start
```

## 🔒 Security Features

- **Protected routes** with middleware
- **Input validation** with Zod schemas
- **SQL injection prevention** with Drizzle ORM
- **CSRF protection** via Better Auth
- **Session management** with secure cookies
- **Rate limiting** on API endpoints

## 📈 Performance Optimizations

- **Server-side rendering** with Next.js
- **Infinite scroll** for large datasets
- **Query caching** with TanStack Query
- **Image optimization** with Next.js
- **Bundle splitting** and lazy loading
- **Database indexing** for fast queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact: support@linkbird.ai
- Documentation: [docs.linkbird.ai](https://docs.linkbird.ai)

---

Built with ❤️ by Mahesh using Next.js, Better Auth, and modern web technologies.
