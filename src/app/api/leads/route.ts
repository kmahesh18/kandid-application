import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leads, campaigns, accountInteractions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, eq, desc, asc, count, like, or, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const createLeadSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  company: z.string().max(255).optional(),
  title: z.string().max(255).optional(),
  notes: z.string().optional(),
  tags: z.string().optional(), // JSON string
  status: z.enum(['pending', 'contacted', 'responded', 'converted']).default('pending'),
  campaignId: z.string().uuid('Invalid campaign ID').optional(),
});

const updateLeadSchema = createLeadSchema.partial();

const filterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['pending', 'contacted', 'responded', 'converted']).optional(),
  campaignId: z.string().optional(), // Allow any string including "none"
  sortBy: z.enum(['email', 'firstName', 'lastName', 'company', 'status', 'createdAt', 'updatedAt', 'lastContactedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// GET /api/leads - Get all leads with filtering and pagination
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      campaignId: searchParams.get('campaignId') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    const validatedFilters = filterSchema.parse(filters);
    const offset = (validatedFilters.page - 1) * validatedFilters.limit;

    // Build where conditions
    const whereConditions = [eq(leads.userId, session.user.id)];
    
    if (validatedFilters.search) {
      whereConditions.push(
        or(
          like(leads.email, `%${validatedFilters.search}%`),
          validatedFilters.search ? like(leads.firstName, `%${validatedFilters.search}%`) : undefined,
          validatedFilters.search ? like(leads.lastName, `%${validatedFilters.search}%`) : undefined,
          validatedFilters.search ? like(leads.company, `%${validatedFilters.search}%`) : undefined
        )!
      );
    }

    if (validatedFilters.status) {
      whereConditions.push(eq(leads.status, validatedFilters.status));
    }

    if (validatedFilters.campaignId) {
      if (validatedFilters.campaignId === 'none') {
        whereConditions.push(sql`${leads.campaignId} IS NULL`);
      } else {
        whereConditions.push(eq(leads.campaignId, validatedFilters.campaignId));
      }
    }

    // Get leads with campaign information
    const leadsQuery = db
      .select({
        id: leads.id,
        email: leads.email,
        firstName: leads.firstName,
        lastName: leads.lastName,
        company: leads.company,
        title: leads.title,
        status: leads.status,
        tags: leads.tags,
        notes: leads.notes,
        score: leads.score,
        lastContactedAt: leads.lastContactedAt,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
        campaignId: leads.campaignId,
        campaignName: campaigns.name,
      })
      .from(leads)
      .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
      .where(and(...whereConditions))
      .orderBy(
        validatedFilters.sortOrder === 'asc'
          ? asc(leads[validatedFilters.sortBy])
          : desc(leads[validatedFilters.sortBy])
      )
      .limit(validatedFilters.limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(and(...whereConditions));

    const allLeads = await leadsQuery;
    const total = totalResult.count;

    return NextResponse.json({
      data: allLeads,
      pagination: {
        page: validatedFilters.page,
        limit: validatedFilters.limit,
        total,
        totalPages: Math.ceil(total / validatedFilters.limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

// POST /api/leads - Create a new lead
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

    const body = await request.json();
    const validatedData = createLeadSchema.parse(body);

    // Check if campaign exists and belongs to user (if provided)
    if (validatedData.campaignId) {
      const campaign = await db
        .select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.id, validatedData.campaignId),
            eq(campaigns.userId, session.user.id)
          )
        )
        .limit(1);

      if (campaign.length === 0) {
        return NextResponse.json(
          { error: 'Campaign not found' },
          { status: 404 }
        );
      }
    }

    // Check if lead with this email already exists globally (due to unique constraint)
    const existingLead = await db
      .select()
      .from(leads)
      .where(eq(leads.email, validatedData.email))
      .limit(1);

    if (existingLead.length > 0) {
      return NextResponse.json(
        { error: 'A lead with this email address already exists' },
        { status: 409 }
      );
    }

    const [newLead] = await db
      .insert(leads)
      .values({
        ...validatedData,
        userId: session.user.id,
      })
      .returning();

    return NextResponse.json(newLead, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create lead:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    // Handle duplicate email constraint
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code?: string; constraint?: string };
      if (dbError.code === '23505') {
        if (dbError.constraint === 'leads_email_unique') {
          return NextResponse.json(
            { error: 'A lead with this email already exists' },
            { status: 409 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

// PATCH /api/leads - Bulk update leads
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
    const { ids, data: updates } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid lead IDs' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Updates object is required' },
        { status: 400 }
      );
    }

    const validatedUpdates = updateLeadSchema.parse(updates);

    // Verify all leads belong to the user
    const userLeads = await db
      .select({ id: leads.id })
      .from(leads)
      .where(
        and(
          inArray(leads.id, ids),
          eq(leads.userId, session.user.id)
        )
      );

    if (userLeads.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some leads not found' },
        { status: 404 }
      );
    }

    // Perform bulk update
    const updatedLeads = await db
      .update(leads)
      .set({
        ...validatedUpdates,
        updatedAt: new Date(),
      })
      .where(inArray(leads.id, ids))
      .returning();

    return NextResponse.json({
      message: `Updated ${updatedLeads.length} leads`,
      data: updatedLeads,
    });
  } catch (error: unknown) {
    console.error('Failed to update leads:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
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
      { error: 'Failed to update leads' },
      { status: 500 }
    );
  }
}

// DELETE /api/leads - Bulk delete leads
export async function DELETE(request: NextRequest) {
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
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid lead IDs' },
        { status: 400 }
      );
    }

    // Verify all leads belong to the user
    const userLeads = await db
      .select({ id: leads.id })
      .from(leads)
      .where(
        and(
          inArray(leads.id, ids),
          eq(leads.userId, session.user.id)
        )
      );

    if (userLeads.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some leads not found' },
        { status: 404 }
      );
    }

    // First delete associated interactions
    await db
      .delete(accountInteractions)
      .where(
        inArray(accountInteractions.leadId, ids)
      );

    // Then delete leads
    const result = await db
      .delete(leads)
      .where(
        inArray(leads.id, ids)
      );

    return NextResponse.json({
      message: `Deleted ${userLeads.length} leads and their interactions`,
    });
  } catch (error) {
    console.error('Failed to delete leads:', error);
    return NextResponse.json(
      { error: 'Failed to delete leads' },
      { status: 500 }
    );
  }
}
