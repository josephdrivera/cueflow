
# CueFlow

## CueFlow - Professional Show Cue Management System

CueFlow is a modern, web-based application designed for managing and coordinating technical cues in live productions, events, and shows. It provides a comprehensive solution for technical directors, stage managers, and production teams to organize and execute complex technical sequences with precision.

## Features

- **Intuitive Cue Sheet Management**
  - Create, edit, and organize cues with detailed timing information
  - Track multiple technical elements per cue (lighting, audio, video, graphics)
  - Add detailed notes and instructions for each cue

- **Real-time Collaboration**
  - Multi-user access for entire production team
  - Live updates across all connected devices
  - Role-based permissions system

- **Technical Integration**
  - Supports common show control protocols
  - Integration with lighting, audio, and video systems
  - Time-code synchronization capabilities

- **Production Tools**
  - Built-in show timer
  - Customizable cue triggers
  - Emergency backup system

## Tech Stack

- Next.js 14 for the frontend framework
- Supabase for real-time database and authentication
- TypeScript for type safety
- Tailwind CSS for styling
- Radix UI for accessible components

## Environment Variables

To run this project, you will need to add the following environment variables to your `.env.local` file:

```plaintext
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```


