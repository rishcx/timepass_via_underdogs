# Music Social App

A Next.js application for connecting music lovers through communities, connections, and chat features.

## Features

### 🎵 Communities
- Browse communities based on genres and artists
- Join discussions in community chat rooms
- Filter communities by type (genre/artist)

### 👥 Connections
- Send and receive connection requests
- Manage pending and accepted connections
- Accept, reject, or remove connections

### 💬 Messaging
- Direct messaging with connections
- Community group chats
- Real-time message updates

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (to be implemented)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd timepass_via_underdogs
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Database Setup

You'll need to create the following tables in your Supabase database:

#### Communities Table
```sql
CREATE TABLE communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('genre', 'artist')),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Connections Table
```sql
CREATE TABLE connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, target_id)
);
```

#### Messages Table
```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('dm', 'group')),
  dm_with TEXT,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Community Members Table
```sql
CREATE TABLE community_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, community_id)
);
```

#### Profiles Table (if not already exists)
```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## API Endpoints

### Communities
- `GET /api/communities` - List all communities
- `GET /api/communities/[id]` - Get specific community

### Connections
- `GET /api/connections` - Get user's connections
- `POST /api/connections` - Create connection request
- `PATCH /api/connections/[id]` - Update connection status
- `DELETE /api/connections/[id]` - Remove connection

### Messages
- `GET /api/messages` - Get messages (DMs or group)
- `POST /api/messages` - Send new message
- `PATCH /api/messages/[id]` - Update message
- `DELETE /api/messages/[id]` - Delete message

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── communities/        # Community endpoints
│   │   ├── connections/        # Connection endpoints
│   │   └── messages/          # Message endpoints
│   ├── chat/                  # Chat pages
│   ├── communities/           # Community pages
│   ├── connections/           # Connection pages
│   └── page.tsx              # Home page
├── components/
│   └── Navigation.tsx        # Navigation component
├── lib/
│   └── supabase/             # Supabase client config
└── types.ts                  # TypeScript type definitions
```

## Authentication Integration

The current implementation uses placeholder user IDs (`'current-user-id'`). To integrate with Supabase Auth:

1. Install Supabase Auth helpers:
```bash
npm install @supabase/auth-helpers-nextjs
```

2. Update the API routes to use the authenticated user's ID from the session
3. Add authentication middleware to protect routes
4. Update the frontend components to handle authentication state

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
