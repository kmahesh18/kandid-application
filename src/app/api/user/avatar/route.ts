import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

// POST /api/user/avatar - Upload user avatar
export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image must be less than 5MB' },
        { status: 400 }
      );
    }

    // In a real application, you would upload the image to a storage service
    // For now, we'll create a placeholder URL
    // TODO: Implement actual image upload to cloud storage (AWS S3, Cloudinary, etc.)
    
    const imageUrl = `https://via.placeholder.com/400x400/2563eb/ffffff?text=${encodeURIComponent(session.user.name.charAt(0).toUpperCase())}`;
    
    // Update user image in database
    const [updatedUser] = await db
      .update(users)
      .set({
        image: imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    return NextResponse.json({
      message: 'Profile image updated successfully',
      imageUrl: updatedUser.image,
    });
  } catch (error) {
    console.error('Failed to upload avatar:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}
