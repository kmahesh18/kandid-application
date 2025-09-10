import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { campaigns, leads, accountInteractions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, eq, count, sql, gte, desc } from 'drizzle-orm';

// GET /api/analytics/dashboard - Get dashboard analytics
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

    const userId = session.user.id;

    // Get basic counts
    const [totalCampaigns] = await db
      .select({ count: count() })
      .from(campaigns)
      .where(and(eq(campaigns.userId, userId), sql`${campaigns.status} != 'deleted'`));

    const [totalLeads] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.userId, userId));

    const [activeCampaigns] = await db
      .select({ count: count() })
      .from(campaigns)
      .where(and(eq(campaigns.userId, userId), eq(campaigns.status, 'active')));

    const [convertedLeads] = await db
      .select({ count: count() })
      .from(leads)
      .where(and(eq(leads.userId, userId), eq(leads.status, 'converted')));

    // Get lead status distribution
    const leadStatusDistribution = await db
      .select({
        status: leads.status,
        count: count(),
      })
      .from(leads)
      .where(eq(leads.userId, userId))
      .groupBy(leads.status);

    // Get campaign status distribution
    const campaignStatusDistribution = await db
      .select({
        status: campaigns.status,
        count: count(),
      })
      .from(campaigns)
      .where(and(eq(campaigns.userId, userId), sql`${campaigns.status} != 'deleted'`))
      .groupBy(campaigns.status);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLeads = await db
      .select({ count: count() })
      .from(leads)
      .where(and(eq(leads.userId, userId), gte(leads.createdAt, sevenDaysAgo)));

    const recentCampaigns = await db
      .select({ count: count() })
      .from(campaigns)
      .where(and(eq(campaigns.userId, userId), gte(campaigns.createdAt, sevenDaysAgo)));

    // Get top performing campaigns (by conversion rate)
    const topCampaigns = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        totalLeads: count(leads.id),
        convertedLeads: sql<number>`COUNT(CASE WHEN ${leads.status} = 'converted' THEN 1 END)`,
      })
      .from(campaigns)
      .leftJoin(leads, eq(campaigns.id, leads.campaignId))
      .where(and(eq(campaigns.userId, userId), sql`${campaigns.status} != 'deleted'`))
      .groupBy(campaigns.id, campaigns.name, campaigns.status)
      .orderBy(desc(sql<number>`COUNT(CASE WHEN ${leads.status} = 'converted' THEN 1 END)`))
      .limit(5);

    // Get recent interactions
    const recentInteractions = await db
      .select({
        id: accountInteractions.id,
        type: accountInteractions.type,
        content: accountInteractions.content,
        timestamp: accountInteractions.timestamp,
        leadId: accountInteractions.leadId,
        leadName: sql<string>`${leads.firstName} || ' ' || ${leads.lastName}`,
        leadEmail: leads.email,
      })
      .from(accountInteractions)
      .innerJoin(leads, eq(accountInteractions.leadId, leads.id))
      .where(eq(leads.userId, userId))
      .orderBy(desc(accountInteractions.timestamp))
      .limit(10);

    // Calculate metrics
    const conversionRate = totalLeads.count > 0 ? (convertedLeads.count / totalLeads.count) * 100 : 0;

    // Get daily lead creation for the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyLeads = await db
      .select({
        date: sql<string>`DATE(${leads.createdAt})`,
        count: count(),
      })
      .from(leads)
      .where(and(eq(leads.userId, userId), gte(leads.createdAt, thirtyDaysAgo)))
      .groupBy(sql`DATE(${leads.createdAt})`)
      .orderBy(sql`DATE(${leads.createdAt})`);

    // Get average lead score
    const [avgLeadScore] = await db
      .select({
        avgScore: sql<number>`COALESCE(AVG(${leads.score}), 0)`,
      })
      .from(leads)
      .where(eq(leads.userId, userId));

    const dashboardData = {
      overview: {
        totalCampaigns: totalCampaigns.count,
        totalLeads: totalLeads.count,
        activeCampaigns: activeCampaigns.count,
        convertedLeads: convertedLeads.count,
        conversionRate: Math.round(conversionRate * 10) / 10,
        avgLeadScore: Math.round(avgLeadScore.avgScore * 10) / 10,
      },
      recentActivity: {
        newLeadsThisWeek: recentLeads[0].count,
        newCampaignsThisWeek: recentCampaigns[0].count,
      },
      distributions: {
        leadStatus: leadStatusDistribution,
        campaignStatus: campaignStatusDistribution,
      },
      topCampaigns: topCampaigns.map(campaign => ({
        ...campaign,
        conversionRate: campaign.totalLeads > 0 
          ? Math.round((campaign.convertedLeads / campaign.totalLeads) * 1000) / 10 
          : 0,
      })),
      recentInteractions,
      dailyLeads: dailyLeads.map(day => ({
        date: day.date,
        leads: day.count,
      })),
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Failed to fetch dashboard analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
