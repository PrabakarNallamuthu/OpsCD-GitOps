/**
 * WO-072: Notification service — Slack, email, PagerDuty webhooks
 * WO-074: Notification templates
 */
import { Injectable, Logger } from '@nestjs/common';

type Channel = 'slack' | 'email' | 'pagerduty' | 'webhook';
type Severity = 'info' | 'warning' | 'critical';

interface NotificationPayload {
  channel: Channel;
  recipients: string[];
  severity: Severity;
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
}

interface NotificationTemplate {
  id: string;
  eventType: string;
  channel: Channel;
  subject: string;
  bodyTemplate: string;  // {{variable}} syntax
}

const TEMPLATES: NotificationTemplate[] = [
  {
    id: 'release-approved',
    eventType: 'release.approved',
    channel: 'slack',
    subject: 'Release {{releaseName}} Approved',
    bodyTemplate: ':white_check_mark: Release *{{releaseName}}* ({{version}}) has been approved by {{approver}} for *{{environment}}*.',
  },
  {
    id: 'release-failed',
    eventType: 'release.failed',
    channel: 'slack',
    subject: 'Release {{releaseName}} FAILED',
    bodyTemplate: ':x: Release *{{releaseName}}* failed in *{{environment}}*. Risk score: {{riskScore}}. Review rollback options.',
  },
  {
    id: 'risk-critical',
    eventType: 'risk.critical',
    channel: 'pagerduty',
    subject: 'CRITICAL: Release Risk Alert',
    bodyTemplate: 'Release {{releaseId}} has exceeded critical risk threshold ({{riskScore}}). Immediate review required.',
  },
  {
    id: 'policy-violation',
    eventType: 'policy.violated',
    channel: 'slack',
    subject: 'Policy Violation: {{policyName}}',
    bodyTemplate: ':warning: Policy *{{policyName}}* violated by release *{{releaseName}}*. Action: {{action}}.',
  },
];

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async send(payload: NotificationPayload): Promise<void> {
    const rendered = this.renderBody(payload.body, {});
    this.logger.log(`[${payload.channel}] ${payload.severity.toUpperCase()}: ${payload.subject} → ${payload.recipients.join(',')}`);
    // In production: dispatch to Slack API, SendGrid, PagerDuty, generic webhook
  }

  async sendFromTemplate(eventType: string, variables: Record<string, string>, recipients: string[]): Promise<void> {
    const template = TEMPLATES.find((t) => t.eventType === eventType);
    if (!template) {
      this.logger.warn(`No template found for event: ${eventType}`);
      return;
    }

    await this.send({
      channel: template.channel,
      recipients,
      severity: eventType.includes('critical') || eventType.includes('fail') ? 'critical' : 'info',
      subject: this.renderBody(template.subject, variables),
      body: this.renderBody(template.bodyTemplate, variables),
      metadata: { eventType, templateId: template.id },
    });
  }

  private renderBody(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
  }

  getTemplates(): NotificationTemplate[] {
    return TEMPLATES;
  }
}
