"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useDashboardAnalytics } from "@/hooks/queries/analytics";
import { 
  TrendingUp, 
  Users, 
  Target, 
  Activity,
  AlertCircle,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  Phone,
  MessageCircle
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function AnalyticsPage() {
	const { data, isLoading, error, refetch } = useDashboardAnalytics();

	if (isLoading) {
		return (
			<div className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Comprehensive insights into your lead generation performance
						</p>
					</div>
					<Button variant="outline" disabled>
						<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
						Loading...
					</Button>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<Card key={i} className="animate-pulse">
							<CardHeader className="space-y-0 pb-2">
								<div className="h-4 bg-muted rounded w-1/2"></div>
								<div className="h-8 bg-muted rounded w-1/4"></div>
							</CardHeader>
						</Card>
					))}
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Comprehensive insights into your lead generation performance
						</p>
					</div>
					<Button variant="outline" onClick={() => refetch()}>
						<RefreshCw className="h-4 w-4 mr-2" />
						Retry
					</Button>
				</div>
				<Card className="border-destructive">
					<CardContent className="pt-6">
						<div className="flex items-center gap-2 text-destructive">
							<AlertCircle className="h-5 w-5" />
							<span>Failed to load analytics. Please try refreshing or check your connection.</span>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const { overview, recentActivity, distributions, topCampaigns, recentInteractions, dailyLeads } = data;

	// Calculate performance metrics
	const conversionRate = overview.conversionRate || 0;
	const isGoodConversion = conversionRate > 15;
	const weeklyGrowth = recentActivity.newLeadsThisWeek > 10 ? 12 : -5; // Mock calculation
	const campaignEfficiency = topCampaigns.length > 0 ? topCampaigns[0].conversionRate : 0;

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Comprehensive insights into your lead generation performance
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => refetch()}>
						<RefreshCw className="h-4 w-4 mr-2" />
						Refresh
					</Button>
					<Button variant="outline">
						<Download className="h-4 w-4 mr-2" />
						Export
					</Button>
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
						<Target className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{overview.totalCampaigns}</div>
						<div className="flex items-center text-xs text-muted-foreground">
							<span className="text-green-600">{overview.activeCampaigns} active</span>
							<span className="mx-1">•</span>
							<span>{overview.totalCampaigns - overview.activeCampaigns} inactive</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Leads</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{overview.totalLeads}</div>
						<div className="flex items-center text-xs">
							{weeklyGrowth > 0 ? (
								<ArrowUpRight className="h-3 w-3 text-green-600" />
							) : (
								<ArrowDownRight className="h-3 w-3 text-red-600" />
							)}
							<span className={`ml-1 ${weeklyGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
								{Math.abs(weeklyGrowth)}% this week
							</span>
						</div>
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
						<div className="text-xs text-muted-foreground mt-1">
							{overview.convertedLeads} of {overview.totalLeads} leads
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Avg Lead Score</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{overview.avgLeadScore}</div>
						<div className="text-xs text-muted-foreground">Out of 100</div>
						<Progress value={overview.avgLeadScore} className="mt-2" />
					</CardContent>
				</Card>
			</div>

			{/* Performance Overview */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Weekly Performance
						</CardTitle>
						<CardDescription>Your activity and conversion metrics this week</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4 text-blue-600" />
								<span className="text-sm">New Leads</span>
							</div>
							<div className="text-right">
								<div className="font-medium">{recentActivity.newLeadsThisWeek}</div>
								<div className="text-xs text-muted-foreground">This week</div>
							</div>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Target className="h-4 w-4 text-green-600" />
								<span className="text-sm">New Campaigns</span>
							</div>
							<div className="text-right">
								<div className="font-medium">{recentActivity.newCampaignsThisWeek}</div>
								<div className="text-xs text-muted-foreground">This week</div>
							</div>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<TrendingUp className="h-4 w-4 text-purple-600" />
								<span className="text-sm">Conversion Rate</span>
							</div>
							<div className="text-right">
								<div className="font-medium">{conversionRate}%</div>
								<div className="text-xs text-muted-foreground">
									{isGoodConversion ? 'Above average' : 'Needs improvement'}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<PieChart className="h-5 w-5" />
							Lead Status Distribution
						</CardTitle>
						<CardDescription>Breakdown of leads by current status</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{distributions.leadStatus.map((item, index) => {
								const percentage = overview.totalLeads > 0 ? Math.round((item.count / overview.totalLeads) * 100) : 0;
								const statusColors = {
									pending: 'bg-yellow-500',
									contacted: 'bg-blue-500',
									responded: 'bg-purple-500',
									converted: 'bg-green-500'
								};
								
								return (
									<div key={index} className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div className={`w-3 h-3 rounded-full ${statusColors[item.status as keyof typeof statusColors] || 'bg-gray-500'}`}></div>
											<span className="text-sm capitalize">{item.status}</span>
										</div>
										<div className="text-right">
											<div className="font-medium">{item.count}</div>
											<div className="text-xs text-muted-foreground">{percentage}%</div>
										</div>
									</div>
								);
							})}
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
						<CardDescription>Your most successful campaigns ranked by conversion rate</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{topCampaigns.slice(0, 5).map((campaign, index) => (
								<div key={campaign.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
									<div className="flex items-center gap-4">
										<div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
											#{index + 1}
										</div>
										<div>
											<p className="font-medium">{campaign.name}</p>
											<p className="text-sm text-muted-foreground">
												{campaign.totalLeads} leads • {campaign.convertedLeads} converted
											</p>
										</div>
									</div>
									<div className="text-right">
										<div className="text-lg font-bold text-green-600">{campaign.conversionRate}%</div>
										<Badge variant="outline" className="text-xs">{campaign.status}</Badge>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Recent Interactions Timeline */}
			{recentInteractions && recentInteractions.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="h-5 w-5" />
							Recent Lead Interactions
						</CardTitle>
						<CardDescription>Latest communication and engagement with your leads</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{recentInteractions.slice(0, 8).map((interaction) => {
								const iconMap = {
									email: Mail,
									call: Phone,
									message: MessageCircle,
									meeting: Calendar
								};
								const IconComponent = iconMap[interaction.type as keyof typeof iconMap] || Activity;
								
								return (
									<div key={interaction.id} className="flex items-start gap-3 p-3 rounded-lg border">
										<div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
											<IconComponent className="h-4 w-4" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between">
												<p className="font-medium text-sm">{interaction.leadName}</p>
												<span className="text-xs text-muted-foreground">
													{formatDistanceToNow(new Date(interaction.timestamp), { addSuffix: true })}
												</span>
											</div>
											<p className="text-xs text-muted-foreground">{interaction.leadEmail}</p>
											<p className="text-sm mt-1">{interaction.content || `${interaction.type} interaction`}</p>
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Campaign Status Distribution */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						Campaign Status Overview
					</CardTitle>
					<CardDescription>Distribution of campaigns by current status</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
						{distributions.campaignStatus.map((item, index) => {
							const statusColors = {
								draft: 'border-yellow-200 bg-yellow-50',
								active: 'border-green-200 bg-green-50',
								paused: 'border-orange-200 bg-orange-50',
								completed: 'border-blue-200 bg-blue-50',
								deleted: 'border-red-200 bg-red-50'
							};
							
							return (
								<div key={index} className={`p-4 rounded-lg border ${statusColors[item.status as keyof typeof statusColors] || 'border-gray-200 bg-gray-50'}`}>
									<div className="text-center">
										<div className="text-2xl font-bold">{item.count}</div>
										<div className="text-sm text-muted-foreground capitalize">{item.status}</div>
									</div>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
