# CueFlow Project Structure

```
cueflow/
├── .env.local
├── .eslintrc.json
├── .gitignore
├── CueFlow-masterplan.md
├── README.md
├── create_showflows_table.sql
├── create_shows_table.sql
├── next-env.d.ts
├── next.config.js
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── supabaseClient.js
├── tailwind.config.js
├── tailwind.config.ts
├── tsconfig.json
│
├── public/                  # Static files
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── src/                     # Source code
│   ├── app/                # Next.js 13+ app directory
│   │   ├── api/           # API routes
│   │   ├── archive/       # Archive page
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Dashboard pages
│   │   ├── settings/     # Settings pages
│   │   ├── show/        # Show pages
│   │   ├── fonts/       # Font files
│   │   ├── favicon.ico
│   │   ├── fonts.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── metadata.ts
│   │   └── page.tsx
│   │
│   ├── components/         # React components
│   │   ├── auth/         # Authentication components
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignUpForm.tsx
│   │   ├── ui/          # UI components
│   │   ├── AddCueListModal.tsx
│   │   ├── Auth.tsx
│   │   ├── CueForm.css
│   │   ├── CueForm.tsx
│   │   ├── CueList.tsx
│   │   ├── CueListManager.tsx
│   │   ├── CueModal.tsx
│   │   ├── CueSheetEditor.tsx
│   │   ├── CueStats.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DuplicateCueAlert.tsx
│   │   ├── RunTimeInput.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── ShowForm.tsx
│   │   ├── ThemeRegistry.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── TimeInput.tsx
│   │   └── TimePickerInput.tsx
│   │
│   ├── contexts/           # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Library code
│   │   ├── supabase.ts
│   │   ├── supabaseClient.ts
│   │   ├── theme.ts
│   │   └── utils.ts
│   │
│   ├── middleware.ts      # Next.js middleware
│   ├── pages/             # Next.js pages
│   ├── providers/         # React providers
│   ├── services/          # Service layer
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
│
└── supabase/              # Supabase configuration and migrations

## Directory Descriptions

- `public/`: Contains static assets that are served directly
  - SVG files for various icons and images
- `src/`: Main source code directory
  - `app/`: Next.js 13+ app router components and routes
    - `api/`: Backend API endpoints
    - `auth/`: Authentication-related pages
    - `dashboard/`: Main dashboard interface
    - `settings/`: User settings pages
    - `show/`: Show management pages
  - `components/`: Reusable React components
    - `auth/`: Authentication-related components
    - `ui/`: Shared UI components
    - Various component files for cue management, forms, and modals
  - `contexts/`: React context providers for state management
  - `hooks/`: Custom React hooks for shared logic
  - `lib/`: Shared library code and utilities
    - Supabase configuration and theme utilities
  - `pages/`: Next.js page components (if using pages router)
  - `providers/`: Application-wide providers
  - `services/`: Service layer for API calls and business logic
  - `types/`: TypeScript type definitions and interfaces
  - `utils/`: Helper functions and utilities

## Configuration Files

- `.env.local`: Environment variables
- `.eslintrc.json`: ESLint configuration
- `next.config.js/ts`: Next.js configuration
- `postcss.config.mjs`: PostCSS configuration
- `tailwind.config.js/ts`: Tailwind CSS configuration
- `tsconfig.json`: TypeScript configuration

## Database Files

- `create_showflows_table.sql`: SQL for creating showflows table
- `create_shows_table.sql`: SQL for creating shows table
- `supabaseClient.js`: Supabase client configuration
