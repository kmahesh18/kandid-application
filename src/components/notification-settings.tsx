'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Bell, Mail, MessageSquare, TrendingUp, UserPlus, Calendar } from 'lucide-react';

interface NotificationSettingsProps {
  user: {
    id: string;
    email: string;
  };
}

interface NotificationPreferences {
  email: {
    newLeads: boolean;
    campaignUpdates: boolean;
    weeklyReports: boolean;
    systemUpdates: boolean;
  };
  push: {
    newLeads: boolean;
    campaignMilestones: boolean;
    deadlines: boolean;
  };
  inApp: {
    allNotifications: boolean;
    mentions: boolean;
    assignments: boolean;
  };
}

export function NotificationSettings({ user }: NotificationSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      newLeads: true,
      campaignUpdates: true,
      weeklyReports: true,
      systemUpdates: false,
    },
    push: {
      newLeads: true,
      campaignMilestones: true,
      deadlines: true,
    },
    inApp: {
      allNotifications: true,
      mentions: true,
      assignments: true,
    },
  });

  const updatePreference = (
    category: keyof NotificationPreferences,
    key: string,
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }

      toast.success('Notification preferences updated successfully');
    } catch (error) {
      console.error('Failed to update notifications:', error);
      toast.error('Failed to update notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      const response = await fetch('/api/user/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to send test email');
      }

      toast.success('Test email sent successfully');
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast.error('Failed to send test email');
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Email Notifications</span>
          </CardTitle>
          <CardDescription>
            Configure which emails you&apos;d like to receive at {user.email}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">New Leads</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new leads are added to your campaigns
              </p>
            </div>
            <Switch
              checked={preferences.email.newLeads}
              onCheckedChange={(checked: boolean) => updatePreference('email', 'newLeads', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Campaign Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about campaign performance and status changes
              </p>
            </div>
            <Switch
              checked={preferences.email.campaignUpdates}
              onCheckedChange={(checked: boolean) => updatePreference('email', 'campaignUpdates', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Get a weekly summary of your lead generation and campaign performance
              </p>
            </div>
            <Switch
              checked={preferences.email.weeklyReports}
              onCheckedChange={(checked: boolean) => updatePreference('email', 'weeklyReports', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">System Updates</Label>
              <p className="text-sm text-muted-foreground">
                Notifications about system maintenance, new features, and updates
              </p>
            </div>
            <Switch
              checked={preferences.email.systemUpdates}
              onCheckedChange={(checked: boolean) => updatePreference('email', 'systemUpdates', checked)}
            />
          </div>

          <div className="pt-4">
            <Button variant="outline" onClick={handleTestEmail} size="sm">
              Send Test Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Push Notifications</span>
          </CardTitle>
          <CardDescription>
            Control browser push notifications for real-time updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center space-x-3">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-base">New Leads</Label>
                <p className="text-sm text-muted-foreground">
                  Instant notifications for new lead acquisitions
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.push.newLeads}
              onCheckedChange={(checked: boolean) => updatePreference('push', 'newLeads', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center space-x-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-base">Campaign Milestones</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications when campaigns reach important milestones
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.push.campaignMilestones}
              onCheckedChange={(checked: boolean) => updatePreference('push', 'campaignMilestones', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-base">Deadlines & Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Alerts for upcoming deadlines and scheduled follow-ups
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.push.deadlines}
              onCheckedChange={(checked: boolean) => updatePreference('push', 'deadlines', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>In-App Notifications</span>
          </CardTitle>
          <CardDescription>
            Manage notifications that appear within the application interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">All Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Enable all in-app notifications and alerts
              </p>
            </div>
            <Switch
              checked={preferences.inApp.allNotifications}
              onCheckedChange={(checked: boolean) => updatePreference('inApp', 'allNotifications', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Mentions</Label>
              <p className="text-sm text-muted-foreground">
                Notifications when you&apos;re mentioned in comments or discussions
              </p>
            </div>
            <Switch
              checked={preferences.inApp.mentions}
              onCheckedChange={(checked: boolean) => updatePreference('inApp', 'mentions', checked)}
              disabled={!preferences.inApp.allNotifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Assignments</Label>
              <p className="text-sm text-muted-foreground">
                Notifications when leads or campaigns are assigned to you
              </p>
            </div>
            <Switch
              checked={preferences.inApp.assignments}
              onCheckedChange={(checked: boolean) => updatePreference('inApp', 'assignments', checked)}
              disabled={!preferences.inApp.allNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading} className="min-w-[120px]">
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
