import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { campaigns } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const updateCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
});

// GET /api/campaigns/[id] - Get single campaign with lead count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const campaign = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        description: campaigns.description,
        status: campaigns.status,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        userId: campaigns.userId,
        leads: sql`
          COALESCE(
            json_agg(
              json_build_object(
                'id', l.id,
                'email', l.email,
                'firstName', l.first_name,
                'lastName', l.last_name,
                'company', l.company,
                'title', l.title,
                'status', l.status,
                'score', l.score,
                'lastContactedAt', l.last_contacted_at,
                'createdAt', l.created_at,
                'updatedAt', l.updated_at
              )
            ) FILTER (WHERE l.id IS NOT NULL),
            '[]'::json
          )
        `,
      })
      .from(campaigns)
      .leftJoin(sql`leads l`, sql`l.campaign_id = ${campaigns.id}`)
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, session.user.id)))
      .groupBy(campaigns.id);

    if (!campaign || campaign.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign[0]);
  } catch (error) {
    console.error('Failed to fetch campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

// PUT /api/campaigns/[id] - Update single campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const campaignId = id;
    const body = await request.json();
    const validatedData = updateCampaignSchema.parse(body);

    // Check if campaign exists and belongs to user
    const [existingCampaign] = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.userId, session.user.id)
        )
      );

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const [updatedCampaign] = await db
      .update(campaigns)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId))
      .returning();

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error('Failed to update campaign:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// DELETE /api/campaigns/[id] - Soft delete single campaign (set status to 'deleted')
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const campaignId = id;

    // Check if campaign exists and belongs to user
    const [existingCampaign] = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.userId, session.user.id),
          // Only allow deletion of non-deleted campaigns
          sql`${campaigns.status} != 'deleted'`
        )
      );

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found or already deleted' },
        { status: 404 }
      );
    }

    // Soft delete the campaign by updating status to 'deleted'
    await db
      .update(campaigns)
      .set({
        status: 'deleted',
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));

    return NextResponse.json({ 
      success: true,
      message: 'Campaign soft deleted successfully'
    });
  } catch (error) {
    console.error('Failed to soft delete campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
