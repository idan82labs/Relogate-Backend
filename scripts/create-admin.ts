/**
 * Script to create an admin user in development
 *
 * Usage: npx tsx scripts/create-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { userProfiles } from '../src/db/schema/users.js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const DATABASE_URL = process.env.DATABASE_URL!;

// Admin user credentials
const ADMIN_EMAIL = 'admin@relogate.dev';
const ADMIN_PASSWORD = 'Admin123!';
const ADMIN_FIRST_NAME = 'Admin';
const ADMIN_LAST_NAME = 'User';

async function createAdminUser() {
  console.log('Creating admin user...');
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log('');

  // Initialize Supabase Admin client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Initialize database connection
  const client = postgres(DATABASE_URL, { prepare: false });
  const db = drizzle(client);

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(u => u.email === ADMIN_EMAIL);

    if (userExists) {
      console.log('User already exists in Supabase Auth');

      // Get user ID
      const user = existingUser?.users?.find(u => u.email === ADMIN_EMAIL);
      if (user) {
        // Update profile to admin
        await db
          .update(userProfiles)
          .set({ role: 'admin' })
          .where(eq(userProfiles.id, user.id));
        console.log('Updated existing user to admin role');
      }
    } else {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          firstName: ADMIN_FIRST_NAME,
          lastName: ADMIN_LAST_NAME,
        },
      });

      if (authError) {
        console.error('Failed to create user in Supabase Auth:', authError.message);
        process.exit(1);
      }

      console.log('Created user in Supabase Auth');
      console.log(`User ID: ${authData.user.id}`);

      // Create profile in database
      await db.insert(userProfiles).values({
        id: authData.user.id,
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
        role: 'admin',
        onboardingStatus: 'completed',
        emailVerified: true,
        isActive: true,
      });

      console.log('Created user profile with admin role');
    }

    console.log('');
    console.log('✓ Admin user created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log(`  Email: ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log('');
    console.log('Access admin panel at: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdminUser();
