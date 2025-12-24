import { describe, it, expect, vi } from 'vitest';

describe('MRR Waterfall Chart Calculations', () => {
  it('calculates net MRR correctly', () => {
    const startingMRR = 100000;
    const newMRR = 15000;
    const expansionMRR = 8000;
    const contractionMRR = 3000;
    const churnMRR = 5000;
    
    const netMRR = startingMRR + newMRR + expansionMRR - contractionMRR - churnMRR;
    expect(netMRR).toBe(115000);
  });

  it('calculates MRR growth rate', () => {
    const startingMRR = 100000;
    const endingMRR = 115000;
    const growthRate = ((endingMRR - startingMRR) / startingMRR) * 100;
    
    expect(growthRate).toBe(15);
  });

  it('calculates net revenue retention (NRR)', () => {
    const startingMRR = 100000;
    const expansionMRR = 8000;
    const contractionMRR = 3000;
    const churnMRR = 5000;
    
    const nrr = ((startingMRR + expansionMRR - contractionMRR - churnMRR) / startingMRR) * 100;
    expect(nrr).toBe(100);
  });

  it('calculates gross revenue retention (GRR)', () => {
    const startingMRR = 100000;
    const contractionMRR = 3000;
    const churnMRR = 5000;
    
    const grr = ((startingMRR - contractionMRR - churnMRR) / startingMRR) * 100;
    expect(grr).toBe(92);
  });
});

describe('Cohort Heatmap Calculations', () => {
  it('calculates cohort retention rate', () => {
    const initialCohortSize = 100;
    const currentActiveUsers = 75;
    const retentionRate = (currentActiveUsers / initialCohortSize) * 100;
    
    expect(retentionRate).toBe(75);
  });

  it('calculates cohort churn rate', () => {
    const initialCohortSize = 100;
    const churnedUsers = 25;
    const churnRate = (churnedUsers / initialCohortSize) * 100;
    
    expect(churnRate).toBe(25);
  });

  it('calculates month-over-month retention', () => {
    const cohortData = [
      { month: 0, activeUsers: 100, retentionRate: 100 },
      { month: 1, activeUsers: 80, retentionRate: 80 },
      { month: 2, activeUsers: 65, retentionRate: 65 },
      { month: 3, activeUsers: 55, retentionRate: 55 },
    ];
    
    expect(cohortData[0].retentionRate).toBe(100);
    expect(cohortData[3].retentionRate).toBe(55);
  });

  it('calculates average retention across cohorts', () => {
    const cohortRetentions = [80, 75, 78, 82, 77];
    const avgRetention = cohortRetentions.reduce((a, b) => a + b, 0) / cohortRetentions.length;
    
    expect(avgRetention).toBe(78.4);
  });

  it('identifies high-risk cohorts', () => {
    const cohortData = [
      { name: 'Jan 2024', retention: 80, isHighRisk: false },
      { name: 'Feb 2024', retention: 45, isHighRisk: true },
      { name: 'Mar 2024', retention: 75, isHighRisk: false },
    ];
    
    const highRiskThreshold = 50;
    const highRiskCohorts = cohortData.filter(c => c.retention < highRiskThreshold);
    
    expect(highRiskCohorts.length).toBe(1);
    expect(highRiskCohorts[0].name).toBe('Feb 2024');
  });
});

describe('Revenue Waterfall Data Transformation', () => {
  it('transforms data for waterfall visualization', () => {
    const rawData = {
      starting: 100000,
      newBusiness: 15000,
      expansion: 8000,
      contraction: -3000,
      churn: -5000,
    };
    
    const waterfallData = [
      { name: 'MRR Inicial', value: rawData.starting, type: 'start' },
      { name: 'Nuevos', value: rawData.newBusiness, type: 'positive' },
      { name: 'Expansión', value: rawData.expansion, type: 'positive' },
      { name: 'Contracción', value: rawData.contraction, type: 'negative' },
      { name: 'Churn', value: rawData.churn, type: 'negative' },
      { 
        name: 'MRR Final', 
        value: rawData.starting + rawData.newBusiness + rawData.expansion + rawData.contraction + rawData.churn,
        type: 'total'
      },
    ];
    
    expect(waterfallData[0].value).toBe(100000);
    expect(waterfallData[5].value).toBe(115000);
  });

  it('calculates cumulative values for waterfall', () => {
    const changes = [100000, 15000, 8000, -3000, -5000];
    const cumulative: number[] = [];
    
    changes.forEach((value, index) => {
      if (index === 0) {
        cumulative.push(value);
      } else {
        cumulative.push(cumulative[index - 1] + value);
      }
    });
    
    expect(cumulative).toEqual([100000, 115000, 123000, 120000, 115000]);
  });
});

describe('Revenue Metrics', () => {
  it('calculates ARPU (Average Revenue Per User)', () => {
    const totalMRR = 100000;
    const activeUsers = 500;
    const arpu = totalMRR / activeUsers;
    
    expect(arpu).toBe(200);
  });

  it('calculates LTV based on ARPU and churn', () => {
    const arpu = 200;
    const monthlyChurnRate = 0.05; // 5%
    const ltv = arpu / monthlyChurnRate;
    
    expect(ltv).toBe(4000);
  });

  it('calculates CAC to LTV ratio', () => {
    const cac = 1000;
    const ltv = 4000;
    const ratio = ltv / cac;
    
    expect(ratio).toBe(4);
    expect(ratio).toBeGreaterThan(3); // Healthy ratio is typically > 3
  });

  it('calculates expansion revenue percentage', () => {
    const newMRR = 15000;
    const expansionMRR = 8000;
    const totalNewRevenue = newMRR + expansionMRR;
    const expansionPercentage = (expansionMRR / totalNewRevenue) * 100;
    
    expect(expansionPercentage.toFixed(2)).toBe('34.78');
  });
});
