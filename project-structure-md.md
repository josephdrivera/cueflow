# CueFlow - Project Structure Documentation

## Directory Structure

```
/
├── src/
│   ├── app/                         # Next.js app directory
│   ├── components/                  # React components
│   │   ├── ui/                     # Base UI components
│   │   │   ├── button.tsx         # Button component
│   │   │   ├── input.tsx          # Input component
│   │   │   └── modal.tsx          # Modal component
│   │   ├── AddCueListModal.tsx     # Modal for adding cue lists
│   │   ├── Auth.tsx               # Authentication component
│   │   ├── CueForm.tsx            # Form for creating/editing cues
│   │   ├── CueList.tsx            # List view of cues
│   │   ├── CueModal.tsx           # Modal for cue operations
│   │   ├── CueSheetEditor.tsx     # Main cue sheet editing interface
│   │   ├── CueStats.tsx           # Statistics display component
│   │   ├── Dashboard.tsx          # Main dashboard view
│   │   ├── DuplicateCueAlert.tsx  # Alert for duplicate cue numbers
│   │   ├── RunTimeInput.tsx       # Custom runtime input component
│   │   ├── SettingsModal.tsx      # Settings configuration modal
│   │   ├── ThemeRegistry.tsx      # Theme configuration
│   │   ├── ThemeToggle.tsx        # Theme switching component
│   │   └── TimeInput.tsx          # Custom time input component
│   │
│   ├── contexts/                   # React contexts
│   │   ├── AuthContext.tsx        # Authentication context
│   │   └── SettingsContext.tsx    # Application settings context
│   │
│   ├── lib/                       # Utility libraries
│   │   ├── supabase.ts           # Supabase client configuration
│   │   └── utils.ts              # General utility functions
│   │
│   ├── services/                  # API services
│   │   ├── cueService.ts         # Cue management service
│   │   └── showService.ts        # Show management service
│   │
│   ├── styles/                    # Styling files
│   │   └── CueForm.css           # Cue form specific styles
│   │
│   ├── types/                     # TypeScript type definitions
│   │   └── cue.ts                # Cue-related type definitions
│   │
│   └── utils/                     # Utility functions
│       └── cueNumbering.ts       # Cue numbering logic
│
├── supabase/                      # Supabase configuration
│   ├── migrations/                # Database migrations
│   │   ├── 20231210_create_shows_table.sql
│   │   ├── 20240113_add_cue_ordering.sql
│   │   ├── 20240114_create_day_cue_lists.sql
│   │   └── ... (other migrations)
│   └── schema.sql                # Main database schema
│
├── public/                        # Static files
│
├── .env.local                    # Environment variables
├── next.config.js                # Next.js configuration
├── package.json                  # Project dependencies
├── postcss.config.mjs            # PostCSS configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

## Directory Overview

### `/src` Directory

The `/src` directory contains all the source code for the application, organized into several subdirectories:

#### `/src/app`
- Next.js 14 app directory
- Contains page components and routing logic
- Implements the App Router pattern

#### `/src/components`
React components organized by functionality:
- `ui/`: Base UI components using shadcn/ui
- Feature-specific components for cue management
- Modal components for various operations
- Form components for data input

#### `/src/contexts`
React contexts for global state management:
- Authentication state
- Application settings
- Theme preferences

#### `/src/lib`
Core library code:
- Supabase client configuration
- Utility functions
- Common helpers

#### `/src/services`
API service layer:
- Cue management operations
- Show management operations
- Database interactions

#### `/src/types`
TypeScript type definitions:
- Interface definitions
- Type aliases
- Shared types

### `/supabase` Directory

The `/supabase` directory contains all Supabase-related configurations:
- Database migrations
- Schema definitions
- Security policies

## Configuration Files

### Root Level Configuration Files
- `next.config.js`: Next.js framework configuration
- `tailwind.config.js`: Tailwind CSS styling configuration
- `tsconfig.json`: TypeScript compiler configuration
- `package.json`: Project dependencies and scripts
- `.env.local`: Environment variables

## Technology Stack

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime

### State Management
- **Global State**: React Context
- **Forms**: Native React forms
- **Date/Time**: date-fns library

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase credentials

4. Start the development server:
   ```bash
   npm run dev
   ```

## Development Guidelines

1. Follow the established directory structure
2. Use TypeScript for all new files
3. Create components in appropriate directories
4. Maintain proper type definitions
5. Follow the component naming convention
