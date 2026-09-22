// utils/supabase.js
// Supabase client: single instance shared across the whole app.
// Install: npx expo install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xneqyrgpnqyczlklunzz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZXF5cmdwbnF5Y3psa2x1bnp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDYxNjUsImV4cCI6MjA5NDUyMjE2NX0.allrDdBP7a-Cdj1hQjEdCWkPOd_304A9VxNs5JIDSvw';

// NOTE: Replace SUPABASE_PUBLISHABLE_KEY with your full publishable key.
// It is safe to commit this key, since it only allows reading public data.
// NEVER use your secret key here.

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
