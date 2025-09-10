import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const notificationPreferencesSchema = z.object({
  email: z.object({
    newLeads: z.boolean(),
    campaignUpdates: z.boolean(),
    weeklyReports: z.boolean(),
    systemUpdates: z.boolean(),
  }),
  push: z.object({
    newLeads: z.boolean(),
    campaignMilestones: z.boolean(),
    deadlines: z.boolean(),
  }),
  inApp: z.object({
    allNotifications: z.boolean(),
    mentions: z.boolean(),
    assignments: z.boolean(),
  }),
});

// PATCH /api/user/notifications - Update notification preferences
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = notificationPreferencesSchema.parse(body);

    // In a real application, you would store these preferences in the database
    // For now, we'll just return a success response
    // TODO: Add notification_preferences table and store the preferences
    
    console.log('Notification preferences updated for user:', session.user.id, validatedData);

    return NextResponse.json({
      message: 'Notification preferences updated successfully',
      preferences: validatedData,
    });
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
