/**
 * Script to create an admin user using raw SQL
 *
 * Usage: npx tsx scripts/create-admin-sql.ts
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL!;

async function createAdminUser() {
  console.log('Setting up admin user...\n');

  const sql = postgres(DATABASE_URL, { prepare: false });

  try {
    // Step 1: Check if role enum exists, create if not
    console.log('1. Checking for user_role enum...');
    const enumExists = await sql`
      SELECT 1 FROM pg_type WHERE typname = 'user_role'
    `;

    if (enumExists.length === 0) {
      console.log('   Creating user_role enum...');
      await sql`CREATE TYPE user_role AS ENUM ('user', 'admin')`;
      console.log('   ✓ Created user_role enum');
    } else {
      console.log('   ✓ user_role enum already exists');
    }

    // Step 2: Check if role column exists, add if not
    console.log('2. Checking for role column...');
    const columnExists = await sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'user_profiles' AND column_name = 'role'
    `;

    if (columnExists.length === 0) {
      console.log('   Adding role column...');
      await sql`
        ALTER TABLE user_profiles
        ADD COLUMN role user_role NOT NULL DEFAULT 'user'
      `;
      console.log('   ✓ Added role column');
    } else {
      console.log('   ✓ role column already exists');
    }

    // Step 3: Check if admin user profile exists
    const adminUserId = '44ca24f1-60ab-48ed-ab9a-44f92bf7ac79';
    console.log('3. Setting up admin user profile...');

    const profileExists = await sql`
      SELECT 1 FROM user_profiles WHERE id = ${adminUserId}
    `;

    if (profileExists.length === 0) {
      console.log('   Creating admin user profile...');
      await sql`
        INSERT INTO user_profiles (id, first_name, last_name, role, onboarding_status, email_verified, is_active)
        VALUES (${adminUserId}, 'Admin', 'User', 'admin', 'completed', true, true)
      `;
      console.log('   ✓ Created admin user profile');
    } else {
      console.log('   Updating existing profile to admin...');
      await sql`
        UPDATE user_profiles
        SET role = 'admin', onboarding_status = 'completed'
        WHERE id = ${adminUserId}
      `;
      console.log('   ✓ Updated profile to admin');
    }

    console.log('\n✓ Admin user setup complete!\n');
    console.log('Login credentials:');
    console.log('  Email: admin@relogate.dev');
    console.log('  Password: Admin123!');
    console.log('\nAccess admin panel at: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createAdminUser();
