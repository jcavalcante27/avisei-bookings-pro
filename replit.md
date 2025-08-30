# Overview

This is a modern full-stack web application for an appointment scheduling system called "Avisei". The application is built with a TypeScript React frontend using Vite, shadcn/ui components, and Tailwind CSS for styling. The backend is an Express.js server with Drizzle ORM for database management and PostgreSQL as the primary database. The system focuses on automated email notifications for appointment confirmations and reminders to reduce no-shows and improve business efficiency.

The application appears to be designed for service-based businesses like salons, clinics, and other establishments that need professional appointment management with automated communication features.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled using Vite for fast development and optimized builds
- **UI Components**: shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with a custom design system featuring HSL color variables and CSS custom properties
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: React Router for client-side navigation with a catch-all route for 404 handling
- **Development**: Hot module replacement via Vite with custom error overlay and Replit integration

## Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Database ORM**: Drizzle ORM with TypeScript support for type-safe database operations
- **Development Mode**: Custom Vite middleware integration for seamless full-stack development
- **API Structure**: Modular route system with centralized error handling and request logging
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development

## Database Design
- **Primary Database**: PostgreSQL configured via Neon Database serverless connection
- **Schema Management**: Drizzle Kit for migrations and schema synchronization
- **Current Schema**: User management system with username/password authentication
- **Type Safety**: Zod schemas for runtime validation integrated with Drizzle types

## Development Environment
- **Build System**: Dual build process - Vite for frontend assets and esbuild for backend bundling
- **TypeScript**: Strict configuration with path aliases for clean imports
- **Code Organization**: Shared types and schemas between frontend and backend via `shared/` directory
- **Asset Handling**: Vite-managed static assets with alias support for attached assets

## Deployment Architecture
- **Production Build**: Static frontend assets served via Express with SSR capabilities
- **Server Bundle**: Single ESM bundle for Node.js deployment
- **Environment**: Environment variable based configuration for database connections
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple

The architecture emphasizes type safety, developer experience, and maintainability while providing a solid foundation for a professional appointment scheduling application with email automation capabilities.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: TypeScript-first ORM with PostgreSQL dialect support

## UI and Styling
- **Radix UI**: Comprehensive primitive component library for accessibility
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: SVG icon library for consistent iconography
- **Class Variance Authority**: Type-safe variant API for component styling

## Development Tools
- **Vite**: Next-generation frontend build tool with HMR and plugin ecosystem
- **Replit Integration**: Development environment plugins for cartographer and error handling
- **TanStack Query**: Powerful data synchronization for React applications

## Form and Validation
- **React Hook Form**: Performant forms library with minimal re-renders
- **Zod**: TypeScript-first schema validation library
- **Hookform Resolvers**: Integration between React Hook Form and validation libraries

## Session and Authentication
- **Express Session**: Session middleware for Express.js
- **Connect PG Simple**: PostgreSQL session store for persistent sessions

## Utility Libraries
- **Date-fns**: Modern JavaScript date utility library
- **clsx & tailwind-merge**: Conditional CSS class utilities for component styling
- **Nanoid**: URL-safe unique string ID generator for session management