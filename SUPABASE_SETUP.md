# Supabase Setup Guide

This project uses Supabase for real-time multiplayer game state synchronization. Follow these steps to set up Supabase:

## 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project or select an existing one
3. Wait for the project to finish initializing

## 2. Set Up Database Tables

Run the SQL code you provided in your Supabase SQL Editor. This will create:
- `rooms` table - Stores game rooms
- `room_players` table - Stores players in each room
- `game_states` table - Stores the current game state for each room
- Row Level Security (RLS) policies for secure access

## 3. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` key, not the `service_role` key)

## 4. Configure Environment Variables

Create a `.env` file in the root directory of this project with the following:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:** 
- Replace `your_supabase_project_url` with your actual Supabase project URL
- Replace `your_supabase_anon_key` with your actual anon key
- Never commit the `.env` file to version control (it's already in `.gitignore`)

## 5. Verify Database Schema

Make sure your database has the following tables with the correct structure:

### `rooms` table
- `id` (uuid, primary key)
- `code` (text, unique)
- `host_id` (uuid, references auth.users)
- `game_mode` (text)
- `impostor_count` (integer)
- `has_jester` (boolean)
- `is_randomize_mode` (boolean)
- `selected_pack` (text, nullable)
- `is_active` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `room_players` table
- `id` (uuid, primary key)
- `room_id` (uuid, references rooms.id)
- `player_id` (uuid, references auth.users)
- `username` (text)
- `avatar` (text, nullable)
- `is_host` (boolean)
- `is_bot` (boolean)
- `is_connected` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `game_states` table
- `id` (uuid, primary key)
- `room_id` (uuid, references rooms.id, unique)
- `state` (jsonb) - Stores the full GameState object
- `created_at` (timestamp)
- `updated_at` (timestamp)

## 6. Enable Row Level Security (RLS)

The SQL code you provided already includes RLS policies. Make sure:
- RLS is enabled on all three tables
- The policies match the ones in your SQL code

## 7. Test the Integration

1. Start the development server: `npm run dev`
2. Create a room and verify it appears in Supabase
3. Join a room and verify players are added
4. Check that game state updates are synced in real-time

## Troubleshooting

### "Supabase URL and Anon Key must be set"
- Make sure your `.env` file exists and contains the correct values
- Restart the development server after creating/updating `.env`

### "Error creating room" or permission errors
- Verify RLS policies are correctly set up
- Check that anonymous authentication is enabled in Supabase
- Verify the user is authenticated (check browser console for auth errors)

### Real-time updates not working
- Check that Realtime is enabled in Supabase project settings
- Verify the subscriptions are set up correctly in `useSupabaseRoom.ts`
- Check browser console for WebSocket connection errors

## Current Integration Status

✅ Supabase client configured (`src/lib/supabase.ts`)
✅ Authentication service (`src/services/authService.ts`)
✅ Room service with CRUD operations (`src/services/roomService.ts`)
✅ Real-time subscriptions hook (`src/hooks/useSupabaseRoom.ts`)
✅ Game state syncing in App.tsx
✅ Player management integration

The app is ready to use Supabase once you configure the environment variables!

## Important Notes

### Bot Handling
The current implementation creates bots with generated string IDs. Your SQL policies allow hosts to insert bots, which is correct. However, if your database schema has a foreign key constraint on `player_id` referencing `auth.users`, you may need to either:
1. Create anonymous auth users for bots, OR
2. Modify the database schema to allow nullable `player_id` for bots

The RLS policies you provided already handle bot insertion correctly - hosts can insert bots as long as `is_bot = true`.

### Anonymous Authentication
Make sure anonymous authentication is enabled in your Supabase project:
1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Enable **Anonymous** authentication
3. This allows users to sign in without email/password

