/**
 * Delete User from Supabase Auth
 *
 * Usage: npx tsx scripts/delete-supabase-user.ts <email>
 * Example: npx tsx scripts/delete-supabase-user.ts alexandrf539@gmail.com
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function deleteUser(email: string) {
  console.log(`\nSearching for user with email: ${email}`);

  // List users to find the one with matching email
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError.message);
    process.exit(1);
  }

  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.log(`\nUser with email "${email}" not found in Supabase Auth.`);
    console.log('\nExisting users:');
    users.users.forEach(u => {
      console.log(`  - ${u.email} (id: ${u.id})`);
    });
    process.exit(0);
  }

  console.log(`\nFound user:`);
  console.log(`  ID: ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Created: ${user.created_at}`);

  // Delete the user
  console.log(`\nDeleting user...`);
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error('Error deleting user:', deleteError.message);
    process.exit(1);
  }

  console.log(`\n✅ User "${email}" deleted successfully from Supabase Auth.`);
  console.log('\nYou can now register again with this email.');
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.log('Usage: npx tsx scripts/delete-supabase-user.ts <email>');
  console.log('Example: npx tsx scripts/delete-supabase-user.ts alexandrf539@gmail.com');
  process.exit(1);
}

deleteUser(email);
