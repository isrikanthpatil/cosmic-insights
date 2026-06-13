# Cosmic Insights - Astrology App

A comprehensive astrology application built with Expo Router and Supabase, offering personalized astrological readings, numerology analysis, and palm reading features.

## Features

- **Personalized Astrology Readings**: Sun sign, moon sign, and ascendant calculations
- **Numerology Analysis**: Birth numbers, destiny numbers, and Lo Shu grid analysis
- **Palm Reading**: AI-powered palm analysis with detailed insights
- **Daily Horoscopes**: Personalized daily and weekly predictions
- **User Profiles**: Secure user authentication and profile management

## Tech Stack

- **Frontend**: React Native with Expo Router
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Styling**: React Native StyleSheet
- **Navigation**: Expo Router with tab-based navigation
- **Fonts**: Google Fonts (Inter, Playfair Display)

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd cosmic-insights
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Migration

Run the migration files in your Supabase SQL editor in this order:

1. `supabase/migrations/20250105120000_initial_schema.sql` - Core database schema
2. `supabase/migrations/20250105121000_functions_and_triggers.sql` - Functions and triggers

### 4. Run the App

```bash
npm run dev
```

## Database Schema

The app uses the following main tables:

- `user_profiles` - User information and birth details
- `astrology_readings` - Astrological analysis and predictions
- `numerology_readings` - Numerology calculations and meanings
- `palm_readings` - Palm analysis results
- `daily_horoscopes` - Daily horoscope predictions
- `app_settings` - User preferences and settings

## Authentication Flow

1. Users sign up with email/password and birth details
2. Supabase handles authentication and session management
3. User profiles are automatically created with RLS policies
4. All user data is secured with Row Level Security

## Key Features Implementation

### Astrology Engine
- Calculates sun sign, moon sign, and ascendant based on birth details
- Uses coordinate-based calculations for accurate readings
- Integrates traditional astrological knowledge base

### Numerology System
- Implements FEAT Theory ABC for Lo Shu grid analysis
- Calculates birth numbers, destiny numbers, and Kua numbers
- Includes gender-specific Kua number conversions

### Security
- Row Level Security (RLS) on all user data
- Secure authentication with Supabase Auth
- Environment variables for sensitive configuration

## Creating Test User

> Full backend setup is documented in DEPLOYMENT.md.

To create a test user with email `<your-email>` and password `<your-password>`:

1. Start the development server: `npm run dev`
2. Navigate to the sign-up page
3. Fill in the form with:
   - Email: `<your-email>`
   - Password: `<your-password>`
   - First Name: `<first-name>`
   - Last Name: `<last-name>`
   - Gender: `<gender>`
   - Date of Birth: `15/06/1990` (DD/MM/YYYY format)
   - Time of Birth: `10:30 AM` (optional)
   - Place of Birth: `Mumbai, Maharashtra`
4. Click "Create Account"

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure Supabase URL and keys are correct in `.env`
2. **Database Errors**: Run all migration files in the correct order
3. **Missing Tables**: Ensure both migration files have been executed

### Error Messages

- `INVALID_CREDENTIALS`: Check email/password combination
- `EMAIL_NOT_CONFIRMED`: Check email for confirmation link (if enabled)
- `PROFILE_CREATION_FAILED`: Check database migrations and RLS policies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.