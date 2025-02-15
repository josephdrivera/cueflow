# CueFlow

CueFlow is a modern web application for managing show flows and cues in live productions. Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Project Structure

```
cueflow/
├── src/
│   ├── app/                 # Next.js 13+ app directory with route groups
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Third-party library configurations
│   ├── providers/          # Application-wide providers
│   ├── services/           # API and external service integrations
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions and helpers
├── public/                 # Static files
├── supabase/              # Supabase configurations and migrations
└── ...config files        # Various configuration files
```

## Tech Stack

- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Context + Custom Hooks
- **Deployment**: Vercel (recommended)

## Getting Started

1. Clone the repository:
   ```bash
   git clone [your-repo-url]
   cd cueflow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development Guidelines

- Follow the TypeScript strict mode guidelines
- Use Tailwind CSS for styling
- Create reusable components in the `components` directory
- Add types for all props and data structures
- Use custom hooks for shared logic
- Follow the Next.js App Router patterns for routing

## Database Schema

The application uses Supabase with the following main tables:
- `shows` - Show information
- `showflows` - Flow sequences for shows
- `cues` - Individual cues within flows
- `users` - User information
- `profiles` - Extended user profiles

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

[Your License] - See LICENSE file for details
