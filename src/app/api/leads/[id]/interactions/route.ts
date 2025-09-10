import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leads, accountInteractions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, eq, desc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const createInteractionSchema = z.object({
  type: z.string().min(1, 'Interaction type is required').max(100),
  subject: z.string().max(255).optional(),
  content: z.string().optional(),
  contactedAt: z.string().optional(),
});

// GET /api/leads/[id]/interactions - Get lead interactions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const leadId = id;

    // Verify lead exists and belongs to user
    const [lead] = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.id, leadId),
          eq(leads.userId, session.user.id)
        )
      );

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Get interactions
    const interactions = await db
      .select()
      .from(accountInteractions)
      .where(eq(accountInteractions.leadId, leadId))
      .orderBy(desc(accountInteractions.timestamp));

    return NextResponse.json(interactions);
  } catch (error) {
    console.error('Failed to fetch lead interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead interactions' },
      { status: 500 }
    );
  }
}

// POST /api/leads/[id]/interactions - Add interaction to lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const leadId = id;
    const body = await request.json();
    const validatedData = createInteractionSchema.parse(body);

    // Verify lead exists and belongs to user
    const [lead] = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.id, leadId),
          eq(leads.userId, session.user.id)
        )
      );

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    const [newInteraction] = await db
      .insert(accountInteractions)
      .values({
        type: validatedData.type,
        content: validatedData.content,
        leadId,
        userId: session.user.id,
        timestamp: validatedData.contactedAt ? new Date(validatedData.contactedAt) : new Date(),
      })
      .returning();

    // Update lead's lastContactedAt
    await db
      .update(leads)
      .set({
        lastContactedAt: newInteraction.timestamp,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));

    return NextResponse.json(newInteraction, { status: 201 });
  } catch (error) {
    console.error('Failed to create lead interaction:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create lead interaction' },
      { status: 500 }
    );
  }
}
