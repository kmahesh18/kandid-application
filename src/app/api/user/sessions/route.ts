import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

// DELETE /api/user/sessions - Sign out from all devices
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !session.session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete all sessions except the current one
    await db
      .delete(sessions)
      .where(
        eq(sessions.userId, session.user.id)
      );

    return NextResponse.json({
      message: 'Signed out from all devices successfully',
    });
  } catch (error) {
    console.error('Failed to sign out all devices:', error);
    return NextResponse.json(
      { error: 'Failed to sign out all devices' },
      { status: 500 }
    );
  }
}
