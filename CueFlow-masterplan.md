# CueFlow - Technical Show Management System
## Project Overview
CueFlow is a modern, web-based application designed for managing and coordinating technical cues in live productions, events, and shows. The system provides real-time collaboration features and comprehensive cue management capabilities for technical directors, stage managers, and production teams.

## Target Audience
- Show Callers/Stage Managers
- Technical Directors
- Production Team Members (Graphics, Video, Audio, Lighting operators)
- Event Production Companies

## Core Features

### 1. Show Management
- Multiple show creation and management
- Per-day cue list versions
- Comprehensive show statistics and timing information
- Show search and filtering capabilities

### 2. Cue Management
- Detailed cue creation and editing
  - Unique Cue ID system
  - Start time, run time, and end time tracking
  - Department-specific technical details (Graphics, Video, Audio, Lighting)
  - Activity descriptions and notes
- Drag-and-drop cue reordering
- Automatic timing calculations and updates

### 3. Real-time Show Execution
- Live cue status tracking with color coding:
  - Completed cues (red)
  - Active cue (green)
  - Standby cue (yellow)
  - Upcoming cues (default)
- Keyboard shortcuts for show operation:
  - Space bar for cue advancement
  - Arrow keys for navigation
  - Custom hotkeys for common actions
- Prominent current/next cue display
- "Go" button for cue execution

### 4. Collaboration Features
- Multi-user real-time access
- Role-based permissions system:
  - Show Caller/Producer (full access)
  - Department Operators (limited to their section)
  - View-only access for other team members
- Live updates across all connected devices
- Conflict resolution for simultaneous edits

### 5. User Interface
- Dark/Light theme options
- Adjustable font sizes
- Configurable display options:
  - Table borders
  - Search bar visibility
  - Statistics display
- Responsive design for various screen sizes

## Technical Architecture

### Frontend
- Next.js 14 with App Router and TypeScript
- Tailwind CSS for styling
- Shadcn/ui components for accessible UI
- Real-time updates using Supabase subscriptions
- Client-side state management with React hooks
- Server-side rendering for improved performance

### Backend
- Supabase for:
  - PostgreSQL database with RLS policies
  - Authentication with multiple providers
  - Row Level Security (RLS) for granular permissions
  - Real-time subscriptions for live updates
  - Edge Functions for serverless operations
  - Storage for media assets

### Data Model
- Shows
  - ID (UUID)
  - Title
  - Description
  - Creator ID
  - Created At
  - Is Template
  - Metadata (JSONB)
- Showflows (Cues)
  - ID (UUID)
  - Show ID (Foreign Key)
  - Department
  - Cue Number
  - Description
  - Timing Information
  - Status
  - Created At
  - Updated At
- Users
  - ID (UUID)
  - Email
  - Profile Information
  - Role
- Permissions
  - Role-based access controls via RLS
  - Department-specific access rules
  - Show-level permissions

## Development Phases

### Phase 1: Core Infrastructure (Completed)
- ✓ Next.js 14 project setup with TypeScript
- ✓ Supabase integration and configuration
- ✓ Authentication system
- ✓ Database schema and tables
- ✓ Basic show management (CRUD operations)
- ✓ Dashboard implementation

### Phase 2: Show Management (In Progress)
- Show creation and editing
- Template system for quick show setup
- Cue management interface
- Department assignment system
- Basic search and filtering
- Show statistics

### Phase 3: Real-time Features
- Live cue tracking system
- Collaborative editing
- Real-time notifications
- Status synchronization
- Chat/communication system
- Auto-save functionality

### Phase 4: Advanced Features
- Keyboard shortcuts system
- Advanced search and filtering
- Export/import functionality
- Show versioning
- Media asset management
- Backup and recovery system

### Phase 5: Polish and Production
- Performance optimization
- Error tracking and monitoring
- Documentation
- User onboarding
- Production deployment
- Security audits

## Technical Considerations

### Security
- Implemented:
  - ✓ Supabase RLS policies
  - ✓ Secure authentication flow
  - ✓ Environment variable protection
- Planned:
  - API rate limiting
  - Audit logging
  - Regular security scans
  - Backup automation

### Scalability
- Current Implementation:
  - ✓ Edge-ready architecture
  - ✓ Efficient database queries
  - ✓ Optimistic UI updates
- Future Improvements:
  - Query caching
  - Connection pooling
  - Load balancing
  - Database sharding strategy

### Reliability
- Implemented:
  - ✓ Error boundary system
  - ✓ Connection state management
  - ✓ Graceful degradation
- Planned:
  - Offline mode
  - Conflict resolution
  - Automated testing
  - Error reporting

## Future Expansion Possibilities
- Mobile companion app
- Additional department integrations
- Advanced statistics and reporting
- Show templates and presets
- Multi-language support
- Custom theme creation

## Development Guidelines
- TypeScript for type safety
- Component-based architecture
- Comprehensive testing
- Performance monitoring
- Regular security audits
