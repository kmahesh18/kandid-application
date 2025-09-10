import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { campaigns, leads } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, eq, desc, asc, count, like, or, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(255),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).default('draft'),
});

const updateCampaignSchema = createCampaignSchema.partial();

const campaignFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/campaigns - List campaigns with filtering and pagination
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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    // Parse filters from headers (sent by TanStack Query)
    const filtersHeader = request.headers.get('X-Filters');
    const pageHeader = request.headers.get('X-Page');
    const pageSizeHeader = request.headers.get('X-Page-Size');
    
    const finalPage = pageHeader ? parseInt(pageHeader) : page;
    const finalPageSize = pageSizeHeader ? parseInt(pageSizeHeader) : pageSize;
    
    let filters = {};
    if (filtersHeader) {
      try {
        filters = JSON.parse(filtersHeader);
      } catch {
        // Ignore invalid JSON
      }
    }

    const validatedFilters = campaignFiltersSchema.parse(filters);

    // Build where conditions
    const whereConditions = [
      eq(campaigns.userId, session.user.id),
      // Exclude deleted campaigns by default
      sql`${campaigns.status} != 'deleted'`
    ];

    if (validatedFilters.search) {
      whereConditions.push(
        like(campaigns.name, `%${validatedFilters.search}%`)
      );
    }

    if (validatedFilters.status) {
      whereConditions.push(eq(campaigns.status, validatedFilters.status));
    }

    // Calculate offset
    const offset = (finalPage - 1) * finalPageSize;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(campaigns)
      .where(and(...whereConditions));

    const total = totalResult.count;

    // Get campaigns with lead counts
    const campaignsWithCounts = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        description: campaigns.description,
        status: campaigns.status,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        userId: campaigns.userId,
        leadCount: count(leads.id),
      })
      .from(campaigns)
      .leftJoin(leads, eq(campaigns.id, leads.campaignId))
      .where(and(...whereConditions))
      .groupBy(campaigns.id)
      .orderBy(
        validatedFilters.sortOrder === 'asc'
          ? asc(campaigns[validatedFilters.sortBy])
          : desc(campaigns[validatedFilters.sortBy])
      )
      .limit(finalPageSize)
      .offset(offset);

    return NextResponse.json({
      data: campaignsWithCounts,
      page: finalPage,
      pageSize: finalPageSize,
      total,
      totalPages: Math.ceil(total / finalPageSize),
    });
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - Create new campaign
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
    const validatedData = createCampaignSchema.parse(body);

    const [newCampaign] = await db
      .insert(campaigns)
      .values({
        ...validatedData,
        userId: session.user.id,
      })
      .returning();

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    console.error('Failed to create campaign:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

// PATCH /api/campaigns/bulk - Bulk update campaigns
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
    const { ids, data } = z.object({
      ids: z.array(z.string()),
      data: updateCampaignSchema,
    }).parse(body);

    const result = await db
      .update(campaigns)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(campaigns.userId, session.user.id),
          inArray(campaigns.id, ids)
        )
      );

    return NextResponse.json({ count: result.rowCount || 0 });
  } catch (error) {
    console.error('Failed to bulk update campaigns:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update campaigns' },
      { status: 500 }
    );
  }
}

// DELETE /api/campaigns/bulk - Soft delete campaigns (set status to 'deleted')
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
    const { ids } = z.object({
      ids: z.array(z.string()),
    }).parse(body);

    // Soft delete campaigns by updating status to 'deleted'
    const result = await db
      .update(campaigns)
      .set({
        status: 'deleted',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(campaigns.userId, session.user.id),
          inArray(campaigns.id, ids),
          // Only delete campaigns that are not already deleted
          sql`${campaigns.status} != 'deleted'`
        )
      );

    return NextResponse.json({ 
      message: `Soft deleted ${result.rowCount || 0} campaigns`,
      count: result.rowCount || 0 
    });
  } catch (error) {
    console.error('Failed to soft delete campaigns:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete campaigns' },
      { status: 500 }
    );
  }
}
