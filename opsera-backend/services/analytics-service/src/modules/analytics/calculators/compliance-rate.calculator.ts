/**
 * WO-024: Compliance rate calculator
 * WO-073: Compliance trend by framework
 */
import { Injectable } from '@nestjs/common';

type Framework = 'SOX' | 'SOC2' | 'PCI-DSS' | 'GDPR' | 'HIPAA';

interface ComplianceRate {
  framework: Framework;
  rate: number;
  passing: number;
  total: number;
}

@Injectable()
export class ComplianceRateCalculator {
  calculate(
    records: Array<{ compliance_frameworks: string[]; outcome: 'success' | 'failure' | 'partial' }>,
    frameworks: Framework[] = ['SOX', 'SOC2', 'PCI-DSS', 'GDPR'],
  ): ComplianceRate[] {
    return frameworks.map((fw) => {
      const relevant = records.filter((r) => r.compliance_frameworks.includes(fw));
      const passing = relevant.filter((r) => r.outcome === 'success').length;
      return {
        framework: fw,
        rate: relevant.length > 0 ? passing / relevant.length : 1,
        passing,
        total: relevant.length,
      };
    });
  }
}
