# Course Recommender Platform

A modern course recommendation system built with Next.js, NextAuth.js, and Prisma. Users can browse courses, get personalized recommendations, and manage their learning preferences.

## Features

- 🔐 **Authentication**: Secure user authentication with NextAuth.js
- 👤 **User Profiles**: Personal profile management and settings
- 📚 **Course Browsing**: Browse and search through available courses
- 🎯 **Personalized Recommendations**: AI-powered course recommendations
- 📱 **Responsive Design**: Modern, mobile-friendly interface
- 🔍 **Advanced Filtering**: Filter courses by subject, level, and search terms

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Authentication**: NextAuth.js
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Python Flask (optional, for AI recommendations)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Python 3.8+ (optional, for AI recommendations)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd course-recommender-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
   
   # Optional: OAuth providers
   GOOGLE_CLIENT_ID=""
   GOOGLE_CLIENT_SECRET=""
   GITHUB_ID=""
   GITHUB_SECRET=""
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
```bash
npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Authentication Setup

### OAuth Providers (Optional)

To enable OAuth authentication with Google or GitHub:

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Add the client ID and secret to your `.env` file

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set the callback URL to `http://localhost:3000/api/auth/callback/github`
4. Add the client ID and secret to your `.env` file

### Credentials Provider

The app includes a credentials provider for email/password authentication. For production use, you should implement proper password hashing and validation.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth.js routes
│   │   ├── courses/       # Course API
│   │   └── recommendations/ # Recommendations API
│   ├── auth/              # Authentication pages
│   ├── profile/           # User profile page
│   ├── recommendations/   # Recommendations page
│   └── layout.tsx         # Root layout
├── components/            # React components
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
└── middleware.ts          # Next.js middleware
```

## API Endpoints

- `GET /api/courses` - Get all courses
- `GET /api/recommendations?userId={id}&topK={number}` - Get personalized recommendations
- `GET /api/auth/*` - NextAuth.js authentication routes

## Database Schema

The application uses Prisma with the following models:
- `User` - User accounts and profiles
- `Account` - OAuth account connections
- `Session` - User sessions
- `VerificationToken` - Email verification tokens

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

For other deployment platforms, make sure to:
- Set up environment variables
- Configure the database (consider using PostgreSQL for production)
- Update `NEXTAUTH_URL` to your production domain

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
