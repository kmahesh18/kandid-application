"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useDashboardAnalytics } from "@/hooks/queries/analytics";
import { useUIStore } from "@/store/ui-store";
import { 
  TrendingUp, 
  Users, 
  Target, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Calendar
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
	const { data, isLoading, error } = useDashboardAnalytics();
	const { setCreateCampaignOpen, setCreateLeadOpen } = useUIStore();

	if (isLoading) {
		return (
			<div className="flex flex-col gap-6">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Card key={i} className="animate-pulse">
							<CardHeader className="space-y-0 pb-2">
								<div className="h-4 bg-muted rounded w-1/2"></div>
								<div className="h-8 bg-muted rounded w-1/4"></div>
							</CardHeader>
						</Card>
					))}
				</div>
				<div className="text-center text-muted-foreground">Loading dashboard analytics...</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex flex-col gap-6">
				<Card className="border-destructive">
					<CardContent className="pt-6">
						<div className="flex items-center gap-2 text-destructive">
							<AlertCircle className="h-5 w-5" />
							<span>Failed to load analytics. Please try refreshing the page.</span>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const { overview, recentActivity, distributions, topCampaigns, recentInteractions } = data;

	// Calculate insights
	const conversionRate = overview.conversionRate || 0;
	const isGoodConversion = conversionRate > 10;
	const hasLowActivity = recentActivity.newLeadsThisWeek < 5;

	return (
		<div className="flex flex-col gap-6">
			{/* Quick Actions */}
			<div className="flex flex-wrap gap-2 mb-4">
				<Button onClick={() => setCreateCampaignOpen(true)} className="gap-2">
					<Plus className="h-4 w-4" />
					New Campaign
				</Button>
				<Button variant="outline" onClick={() => setCreateLeadOpen(true)} className="gap-2">
					<Plus className="h-4 w-4" />
					Add Lead
				</Button>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
						<Target className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{overview.totalCampaigns}</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-green-600">{overview.activeCampaigns} active</span>
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Leads</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{overview.totalLeads}</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-blue-600">{overview.convertedLeads} converted</span>
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
						<TrendingUp className={`h-4 w-4 ${isGoodConversion ? 'text-green-600' : 'text-yellow-600'}`} />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{conversionRate}%</div>
						<Progress value={conversionRate} className="mt-2" />
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Avg Lead Score</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{overview.avgLeadScore}</div>
						<p className="text-xs text-muted-foreground">Out of 100</p>
					</CardContent>
				</Card>
			</div>

			{/* Insights & Alerts */}
			{(hasLowActivity || !isGoodConversion) && (
				<Card className="border-yellow-200 bg-yellow-50/50">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-yellow-800">
							<AlertCircle className="h-5 w-5" />
							Insights & Recommendations
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{hasLowActivity && (
							<div className="flex items-start gap-2">
								<Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
								<div>
									<p className="text-sm font-medium text-yellow-800">Low activity this week</p>
									<p className="text-xs text-yellow-700">You&apos;ve only added {recentActivity.newLeadsThisWeek} leads this week. Consider increasing your outreach efforts.</p>
								</div>
							</div>
						)}
						{!isGoodConversion && conversionRate > 0 && (
							<div className="flex items-start gap-2">
								<TrendingUp className="h-4 w-4 text-yellow-600 mt-0.5" />
								<div>
									<p className="text-sm font-medium text-yellow-800">Conversion rate could be improved</p>
									<p className="text-xs text-yellow-700">Your {conversionRate}% conversion rate has room for improvement. Try refining your targeting or follow-up strategy.</p>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Recent Activity */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							This Week&apos;s Activity
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted-foreground">New Leads</span>
							<Badge variant="secondary">{recentActivity.newLeadsThisWeek}</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted-foreground">New Campaigns</span>
							<Badge variant="secondary">{recentActivity.newCampaignsThisWeek}</Badge>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<PieChart className="h-5 w-5" />
							Lead Status Distribution
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{distributions.leadStatus.map((item, index) => (
								<div key={index} className="flex items-center justify-between">
									<span className="text-sm capitalize text-muted-foreground">{item.status}</span>
									<Badge variant="outline">{item.count}</Badge>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Top Performing Campaigns */}
			{topCampaigns && topCampaigns.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Target className="h-5 w-5" />
							Top Performing Campaigns
						</CardTitle>
						<CardDescription>Based on conversion rate and lead count</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{topCampaigns.slice(0, 3).map((campaign, index) => (
								<div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg border">
									<div className="flex items-center gap-3">
										<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
											{index + 1}
										</div>
										<div>
											<p className="font-medium">{campaign.name}</p>
											<p className="text-sm text-muted-foreground">
												{campaign.totalLeads} leads • {campaign.convertedLeads} converted
											</p>
										</div>
									</div>
									<div className="text-right">
										<div className="font-medium text-green-600">{campaign.conversionRate}%</div>
										<Badge variant="outline" className="text-xs">{campaign.status}</Badge>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Recent Interactions */}
			{recentInteractions && recentInteractions.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="h-5 w-5" />
							Recent Interactions
						</CardTitle>
						<CardDescription>Latest communication with your leads</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{recentInteractions.slice(0, 5).map((interaction) => (
								<div key={interaction.id} className="flex items-start gap-3 p-3 rounded-lg border">
									<div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
										<Activity className="h-4 w-4" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-medium text-sm">{interaction.leadName}</p>
										<p className="text-xs text-muted-foreground">{interaction.leadEmail}</p>
										<p className="text-sm mt-1">{interaction.content || `${interaction.type} interaction`}</p>
									</div>
									<div className="text-xs text-muted-foreground">
										{formatDistanceToNow(new Date(interaction.timestamp), { addSuffix: true })}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
