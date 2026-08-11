/**
 * WO-049: Policy Rule CRUD Endpoints with Automatic Versioning
 * Every mutation creates an immutable version snapshot (SOX compliance).
 */
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient, PolicySeverity } from '../../generated/prisma/index.js';

export interface CreatePolicyDto {
  name: string;
  description?: string;
  condition_expression: string;
  severity_level: PolicySeverity;
  applicable_environments: string[];
  compliance_frameworks: string[];
  created_by: string;
  org_id: string;
}

export interface UpdatePolicyDto extends Partial<Omit<CreatePolicyDto, 'created_by' | 'org_id'>> {
  updated_by: string;
}

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);

  constructor(private readonly prisma: PrismaClient) {}

  async create(dto: CreatePolicyDto) {
    if (!dto.name || dto.name.length < 3 || dto.name.length > 200) {
      throw new BadRequestException('Policy name must be 3–200 characters');
    }
    if (!dto.condition_expression?.trim()) {
      throw new BadRequestException('condition_expression must not be empty');
    }
    if (!dto.applicable_environments?.length) {
      throw new BadRequestException('At least one applicable_environments entry required');
    }

    return this.prisma.$transaction(async (tx) => {
      const rule = await tx.policyRule.create({
        data: {
          name: dto.name,
          description: dto.description,
          version: 1,
          condition_expression: dto.condition_expression,
          severity_level: dto.severity_level,
          applicable_environments: dto.applicable_environments,
          compliance_frameworks: dto.compliance_frameworks,
          is_active: true,
          created_by: dto.created_by,
          org_id: dto.org_id,
        },
      });

      await tx.policyRuleVersion.create({
        data: {
          rule_id: rule.id,
          version: 1,
          name: rule.name,
          condition_expression: rule.condition_expression,
          severity_level: rule.severity_level,
          applicable_environments: rule.applicable_environments,
          compliance_frameworks: rule.compliance_frameworks,
          created_by: dto.created_by,
        },
      });

      return rule;
    });
  }

  async update(id: string, dto: UpdatePolicyDto) {
    const existing = await this.prisma.policyRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Policy rule ${id} not found`);

    return this.prisma.$transaction(async (tx) => {
      const newVersion = existing.version + 1;
      const updated = await tx.policyRule.update({
        where: { id },
        data: {
          name: dto.name ?? existing.name,
          description: dto.description ?? existing.description,
          version: newVersion,
          condition_expression: dto.condition_expression ?? existing.condition_expression,
          severity_level: dto.severity_level ?? existing.severity_level,
          applicable_environments: dto.applicable_environments ?? existing.applicable_environments,
          compliance_frameworks: dto.compliance_frameworks ?? existing.compliance_frameworks,
        },
      });

      await tx.policyRuleVersion.create({
        data: {
          rule_id: id,
          version: newVersion,
          name: updated.name,
          condition_expression: updated.condition_expression,
          severity_level: updated.severity_level,
          applicable_environments: updated.applicable_environments as string[],
          compliance_frameworks: updated.compliance_frameworks as string[],
          created_by: dto.updated_by,
        },
      });

      return updated;
    });
  }

  async deactivate(id: string, actorId: string) {
    const existing = await this.prisma.policyRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Policy rule ${id} not found`);

    return this.prisma.$transaction(async (tx) => {
      const deactivated = await tx.policyRule.update({
        where: { id },
        data: { is_active: false },
      });

      // Create version snapshot recording deactivation
      await tx.policyRuleVersion.create({
        data: {
          rule_id: id,
          version: existing.version + 1,
          name: `[DEACTIVATED] ${existing.name}`,
          condition_expression: existing.condition_expression,
          severity_level: existing.severity_level,
          applicable_environments: existing.applicable_environments as string[],
          compliance_frameworks: existing.compliance_frameworks as string[],
          created_by: actorId,
        },
      });

      return deactivated;
    });
  }

  async findById(id: string) {
    const rule = await this.prisma.policyRule.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { version: 'desc' } },
      },
    });
    if (!rule) throw new NotFoundException(`Policy rule ${id} not found`);
    return rule;
  }

  async findMany(opts: {
    environment?: string;
    framework?: string;
    cursor?: string;
    limit?: number;
    org_id?: string;
  }) {
    const limit = Math.min(opts.limit ?? 20, 100);
    const rules = await this.prisma.policyRule.findMany({
      where: {
        is_active: true,
        ...(opts.org_id && { org_id: opts.org_id }),
        ...(opts.environment && {
          applicable_environments: { array_contains: [opts.environment] },
        }),
        ...(opts.framework && {
          compliance_frameworks: { array_contains: [opts.framework] },
        }),
        ...(opts.cursor && { id: { gt: opts.cursor } }),
      },
      orderBy: { name: 'asc' },
      take: limit + 1,
    });

    const hasMore = rules.length > limit;
    const items = hasMore ? rules.slice(0, limit) : rules;
    return {
      data: items,
      pagination: {
        has_more: hasMore,
        next_cursor: hasMore ? items[items.length - 1]?.id : undefined,
        limit,
      },
    };
  }
}
