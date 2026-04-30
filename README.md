## Architecture overview

Dependency direction is one-way:

app (routes/pages) → features (domain services) → services (infra wrappers) → lib (helpers)

- features: domain modules with `server/repository.ts` (DB I/O) and `server/service.ts` (business rules)
- services: provider-agnostic integrations (storage, email, rate-limit)
- lib: framework helpers (supabase clients), validations, constants, authz helpers

# Performance Calendar Application

A full-stack web application built with Next.js 15 that allows users to submit performance events for review and display on a shared calendar.

## Features

### 🎭 **Core Functionality**
- **Performance Submissions**: Users can submit performance events with details like title, date, time, location, and contact information
- **Anonymous Submissions**: No account required to submit performances
- **Admin Review System**: Administrators can approve or reject submissions with comments
- **Shared Calendar View**: Displays approved performances in a monthly calendar format
- **User Profiles**: Signed-in users can track their submitted events and review status

### 🔐 **Authentication & Authorization**
- **NextAuth.js Integration**: Secure user authentication with credentials
- **Role-Based Access**: Separate user and admin roles
- **Session Management**: Persistent login sessions
- **Protected Routes**: Admin-only access to review dashboard

### 📱 **User Experience**
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean interface built with Tailwind CSS
- **Modal Forms**: Intuitive performance submission experience
- **Real-time Updates**: Calendar updates immediately after admin approvals
- **Mobile Navigation**: Hamburger menu for mobile users

### 🛠 **Technical Stack**
- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Form Validation**: React Hook Form with Zod schemas
- **Date Handling**: date-fns for calendar operations

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd performance-calendar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/performance_calendar"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # Seed the database with initial admin user
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser
   - Default admin credentials:
     - Email: `admin@example.com`
     - Password: `admin123`

## Project Structure

```
performance-calendar/
├── prisma/
│   ├── migrations/          # Database migration files
│   ├── schema.prisma        # Database schema
│   └── seed.ts             # Database seeding script
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── admin/          # Admin dashboard
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── calendar/       # Main calendar view
│   │   ├── dashboard/      # User dashboard
│   │   └── profile/        # User profile page
│   ├── components/         # Reusable React components
│   │   ├── layout/         # Layout components
│   │   ├── ui/             # UI components
│   │   └── ...             # Other components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and configurations
│   └── types/              # TypeScript type definitions
├── .env.example            # Environment variables template
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## Key Components

### 🗓 **Calendar System**
- Monthly view with proper day alignment
- Performance events displayed as badges
- Navigation between months
- Responsive grid layout

### 📝 **Form System**
- Anonymous performance submission
- Form validation with error handling
- Modal-based user experience
- Contact information collection

### 👥 **User Management**
- User registration and authentication
- Admin role assignment
- Profile management
- Submission tracking

### 🔍 **Admin Features**
- Performance review dashboard
- Approve/reject submissions
- Add review comments
- User management capabilities

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Performances
- `GET /api/performances` - Get performances (with optional filtering)
- `POST /api/performances` - Submit new performance

### Admin
- `POST /api/admin/reviews` - Submit performance review
- `GET /api/admin/users` - Get user list (admin only)

## Database Schema

### Users
- User authentication and profile information
- Role-based access (USER/ADMIN)

### Performances
- Performance event details
- Status tracking (PENDING/APPROVED/REJECTED)
- Optional user association for anonymous submissions

### Reviews
- Admin review history
- Comments and status changes
- Reviewer tracking

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with initial data

### Database (Supabase)

Schema is managed with SQL migrations in `supabase/migrations/`. For **local → staging → production** workflow, env separation on Vercel, and Next.js practices, see **[docs/supabase-staging-workflow.md](./docs/supabase-staging-workflow.md)**.

Common CLI commands (from repo root, with [Supabase CLI](https://supabase.com/docs/guides/cli) installed):

- `supabase start` — run local Postgres, API, and Studio
- `supabase db diff -f <name>` — generate a migration from local schema changes (Docker required)
- `supabase link --project-ref <ref>` — link this folder to a hosted project
- `supabase db push` — apply pending migrations to the linked remote

> **Note:** Older README sections below may still mention Prisma; the app uses Supabase. Prefer the doc above for database work.

## Deployment

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Seed initial admin user

### Build and Deploy
1. `npm run build`
2. `npm run start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please create an issue in the repository or contact the development team.