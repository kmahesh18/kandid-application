import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leads, campaigns, accountInteractions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, eq, desc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const updateLeadSchema = z.object({
  name: z.string().min(1, 'Lead name is required').max(255).optional(),
  email: z.string().email('Invalid email address').max(255).optional(),
  company: z.string().max(255).optional(),
  jobTitle: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'contacted', 'responded', 'converted']).optional(),
  campaignId: z.string().uuid('Invalid campaign ID').optional(),
});

const createInteractionSchema = z.object({
  type: z.string().min(1, 'Interaction type is required').max(100),
  subject: z.string().max(255).optional(),
  content: z.string().optional(),
  contactedAt: z.string().optional(),
});

// GET /api/leads/[id] - Get single lead with campaign and interactions
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

    const leadId = id;

    // Get lead with campaign info
    const [leadWithCampaign] = await db
      .select({
        id: leads.id,
        firstName: leads.firstName,
        lastName: leads.lastName,
        email: leads.email,
        company: leads.company,
        jobTitle: leads.title,
        notes: leads.notes,
        status: leads.status,
        campaignId: leads.campaignId,
        userId: leads.userId,
        lastContactedAt: leads.lastContactedAt,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
        campaign: {
          id: campaigns.id,
          name: campaigns.name,
          status: campaigns.status,
        },
      })
      .from(leads)
      .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
      .where(
        and(
          eq(leads.id, leadId),
          eq(leads.userId, session.user.id)
        )
      );

    if (!leadWithCampaign) {
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

    return NextResponse.json({
      ...leadWithCampaign,
      interactions,
    });
  } catch (error) {
    console.error('Failed to fetch lead:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

// PUT /api/leads/[id] - Update single lead
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

    const leadId = id;
    const body = await request.json();
    const validatedData = updateLeadSchema.parse(body);

    // Check if lead exists and belongs to user
    const [existingLead] = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.id, leadId),
          eq(leads.userId, session.user.id)
        )
      );

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // If email is being updated, check for uniqueness
    if (validatedData.email && validatedData.email !== existingLead.email) {
      const [duplicateEmailLead] = await db
        .select()
        .from(leads)
        .where(eq(leads.email, validatedData.email))
        .limit(1);

      if (duplicateEmailLead) {
        return NextResponse.json(
          { error: 'A lead with this email address already exists' },
          { status: 409 }
        );
      }
    }

    // If campaignId is being updated, verify the new campaign exists and belongs to user
    if (validatedData.campaignId) {
      const [campaign] = await db
        .select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.id, validatedData.campaignId),
            eq(campaigns.userId, session.user.id)
          )
        );

      if (!campaign) {
        return NextResponse.json(
          { error: 'Campaign not found' },
          { status: 404 }
        );
      }
    }

    const [updatedLead] = await db
      .update(leads)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId))
      .returning();

    return NextResponse.json(updatedLead);
  } catch (error: unknown) {
    console.error('Failed to update lead:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    // Handle specific database constraint violations
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code?: string; constraint?: string };
      if (dbError.code === '23505') {
        if (dbError.constraint === 'leads_email_unique') {
          return NextResponse.json(
            { error: 'A lead with this email address already exists in the system' },
            { status: 409 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id] - Delete single lead
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

    const leadId = id;

    // Check if lead exists and belongs to user
    const [existingLead] = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.id, leadId),
          eq(leads.userId, session.user.id)
        )
      );

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // First delete associated interactions
    await db
      .delete(accountInteractions)
      .where(eq(accountInteractions.leadId, leadId));

    // Then delete the lead
    await db
      .delete(leads)
      .where(eq(leads.id, leadId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
