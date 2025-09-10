import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
});

// PATCH /api/user/password - Update user password
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
    const validatedData = updatePasswordSchema.parse(body);

    // Use Better Auth's changePassword method
    try {
      await auth.api.changePassword({
        body: {
          newPassword: validatedData.newPassword,
          currentPassword: validatedData.currentPassword,
        },
        headers: request.headers,
      });

      return NextResponse.json({
        message: 'Password updated successfully',
      });
    } catch (authError: unknown) {
      // Handle Better Auth specific errors
      if (authError instanceof Error && authError.message?.includes('Invalid password')) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
      throw authError;
    }
  } catch (error) {
    console.error('Failed to update password:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
}
