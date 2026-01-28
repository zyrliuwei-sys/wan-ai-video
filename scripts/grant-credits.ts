/**
 * Grant Credits to User Script
 *
 * This script grants credits to a user.
 *
 * Usage:
 *   npx tsx scripts/grant-credits.ts --email=zyrliuwei@gmail.com --credits=100
 *   npx tsx scripts/grant-credits.ts --user-id=user-id-here --credits=50
 *   npx tsx scripts/grant-credits.ts --email=user@example.com --credits=100 --valid-days=365
 */

import { eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { envConfigs } from '@/config';
import { getSnowId, getUuid } from '@/shared/lib/hash';

async function loadSchemaTables(): Promise<any> {
  if (envConfigs.database_provider === 'mysql') {
    return (await import('@/config/db/schema.mysql')) as any;
  }

  if (['sqlite', 'turso'].includes(envConfigs.database_provider)) {
    return (await import('@/config/db/schema.sqlite')) as any;
  }

  return (await import('@/config/db/schema')) as any;
}

async function grantCredits() {
  const args = process.argv.slice(2);
  const emailArg = args.find((arg) => arg.startsWith('--email='));
  const userIdArg = args.find((arg) => arg.startsWith('--user-id='));
  const creditsArg = args.find((arg) => arg.startsWith('--credits='));
  const validDaysArg = args.find((arg) => arg.startsWith('--valid-days='));

  if ((!emailArg && !userIdArg) || !creditsArg) {
    console.error('❌ Error: Please provide user identifier and credits amount');
    console.log('\nUsage:');
    console.log(
      '  npx tsx scripts/grant-credits.ts --email=user@example.com --credits=100'
    );
    console.log(
      '  npx tsx scripts/grant-credits.ts --user-id=user-id-here --credits=50'
    );
    console.log(
      '  npx tsx scripts/grant-credits.ts --email=user@example.com --credits=100 --valid-days=365'
    );
    console.log('\nOptions:');
    console.log('  --email=EMAIL       User email address');
    console.log('  --user-id=ID        User ID');
    console.log('  --credits=AMOUNT    Amount of credits to grant');
    console.log('  --valid-days=DAYS   Optional: Credits validity period (default: never expires)');
    process.exit(1);
  }

  try {
    const { user, credit } = (await loadSchemaTables()) as any;
    const sqlEq: any = eq;

    // Find user
    let targetUser;

    if (emailArg) {
      const email = emailArg.split('=')[1];
      console.log(`🔍 Looking up user by email: ${email}`);

      const [foundUser] = await db()
        .select()
        .from(user)
        .where(sqlEq(user.email, email));

      targetUser = foundUser;
    } else if (userIdArg) {
      const userId = userIdArg.split('=')[1];
      console.log(`🔍 Looking up user by ID: ${userId}`);

      const [foundUser] = await db()
        .select()
        .from(user)
        .where(sqlEq(user.id, userId));

      targetUser = foundUser;
    }

    if (!targetUser) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log(`✓ Found user: ${targetUser.name || targetUser.email} (${targetUser.email})\n`);

    // Parse credits amount
    const credits = parseInt(creditsArg.split('=')[1]);
    if (isNaN(credits) || credits <= 0) {
      console.error('❌ Error: Credits amount must be a positive number');
      process.exit(1);
    }

    console.log(`💰 Amount to grant: ${credits} credits`);

    // Parse validity days
    let expiresAt: Date | undefined;
    if (validDaysArg) {
      const days = parseInt(validDaysArg.split('=')[1]);
      if (!isNaN(days) && days > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
        console.log(`⏰ Credits will expire on: ${expiresAt.toISOString()}`);
      }
    } else {
      console.log(`⏰ Credits will never expire`);
    }

    // Calculate expiration time
    const currentTime = new Date();
    let finalExpiresAt: Date | null = null;
    if (expiresAt) {
      finalExpiresAt = expiresAt;
    }

    // Grant credits
    console.log(`\n🔄 Granting credits to user...`);

    const newCredit = {
      id: getUuid(),
      userId: targetUser.id,
      userEmail: targetUser.email,
      orderNo: '',
      subscriptionNo: '',
      transactionNo: getSnowId(),
      transactionType: 'grant',
      transactionScene: 'gift',
      credits: credits,
      remainingCredits: credits,
      description: 'Admin granted credits',
      expiresAt: finalExpiresAt,
      status: 'active',
    };

    await db().insert(credit).values(newCredit);

    console.log(`\n✅ Successfully granted credits!`);
    console.log(`\n📊 Summary:`);
    console.log(`   User: ${targetUser.name || targetUser.email} (${targetUser.email})`);
    console.log(`   Credits: ${credits}`);
    console.log(`   Expires: ${finalExpiresAt ? finalExpiresAt.toISOString() : 'Never'}`);
    console.log('');
  } catch (error) {
    console.error('\n❌ Error granting credits:', error);
    process.exit(1);
  }
}

// Run the script
grantCredits()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
