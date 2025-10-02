# Performance Calendar

A full-stack web and mobile application for managing performance submissions with an admin review process.

## Features

- **User Authentication**: Sign up, sign in, and role-based access control
- **Performance Submission**: Users can submit performance details through a form
- **Admin Review Process**: Admins can review, approve, or reject submissions
- **Shared Calendar**: View all approved performances in a calendar format
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Real-time Updates**: Live updates when performances are approved/rejected

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd performance-calendar
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Update the `.env` file with your database URL and other configuration:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/performance_calendar?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Seed the database with an admin user:
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Default Admin Account

After running the seed script, you can log in with:
- Email: `admin@example.com`
- Password: `admin123`

## Usage

### For Regular Users

1. **Sign Up**: Create an account at `/auth/signup`
2. **Sign In**: Log in at `/auth/signin`
3. **Submit Performance**: Go to `/dashboard` to submit a new performance
4. **View Calendar**: Visit `/calendar` to see all approved performances

### For Admins

1. **Sign In**: Use the admin credentials above
2. **Review Submissions**: Go to `/admin` to review pending performances
3. **Approve/Reject**: Review each submission and approve or reject with comments
4. **Manage Users**: Access user management features (if implemented)

## API Endpoints

- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - Authentication
- `GET/POST /api/performances` - Performance CRUD operations
- `POST /api/admin/reviews` - Admin review submissions
- `GET /api/admin/users` - User management (admin only)

## Database Schema

The application uses the following main models:
- **User**: User accounts with roles (USER/ADMIN)
- **Performance**: Performance submissions with status tracking
- **Review**: Admin reviews of performances

## Mobile Support

The application is fully responsive and includes:
- Mobile-optimized navigation
- Touch-friendly calendar interface
- Responsive forms and layouts
- Mobile-specific UI adjustments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.