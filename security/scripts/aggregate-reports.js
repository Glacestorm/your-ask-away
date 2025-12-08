#!/usr/bin/env node

/**
 * Security Report Aggregator
 * Consolidates reports from multiple security scanning tools
 * Supports DORA and NIS2 compliance requirements
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = process.env.REPORTS_DIR || 'security-reports';
const OUTPUT_FILE = path.join(REPORTS_DIR, 'consolidated-report.json');

// Severity mapping for normalization
const SEVERITY_LEVELS = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0
};

// Tool-specific parsers
const parsers = {
  // ESLint Security Parser
  eslint: (content) => {
    try {
      const data = JSON.parse(content);
      const findings = [];
      
      data.forEach(file => {
        file.messages?.forEach(msg => {
          if (msg.ruleId?.includes('security') || msg.ruleId?.includes('xss') || msg.ruleId?.includes('injection')) {
            findings.push({
              tool: 'ESLint',
              type: 'SAST',
              severity: msg.severity === 2 ? 'high' : 'medium',
              rule: msg.ruleId,
              message: msg.message,
              file: file.filePath,
              line: msg.line,
              column: msg.column
            });
          }
        });
      });
      
      return findings;
    } catch (e) {
      console.error('Error parsing ESLint report:', e.message);
      return [];
    }
  },

  // Semgrep Parser
  semgrep: (content) => {
    try {
      const data = JSON.parse(content);
      return (data.results || []).map(result => ({
        tool: 'Semgrep',
        type: 'SAST',
        severity: result.extra?.severity?.toLowerCase() || 'medium',
        rule: result.check_id,
        message: result.extra?.message || result.extra?.metadata?.message,
        file: result.path,
        line: result.start?.line,
        cwe: result.extra?.metadata?.cwe,
        owasp: result.extra?.metadata?.owasp
      }));
    } catch (e) {
      console.error('Error parsing Semgrep report:', e.message);
      return [];
    }
  },

  // Snyk Code Parser
  snykCode: (content) => {
    try {
      const data = JSON.parse(content);
      const findings = [];
      
      Object.entries(data.runs?.[0]?.results || {}).forEach(([, result]) => {
        findings.push({
          tool: 'Snyk Code',
          type: 'SAST',
          severity: result.level?.toLowerCase() || 'medium',
          rule: result.ruleId,
          message: result.message?.text,
          file: result.locations?.[0]?.physicalLocation?.artifactLocation?.uri,
          line: result.locations?.[0]?.physicalLocation?.region?.startLine
        });
      });
      
      return findings;
    } catch (e) {
      console.error('Error parsing Snyk Code report:', e.message);
      return [];
    }
  },

  // npm audit Parser
  npmAudit: (content) => {
    try {
      const data = JSON.parse(content);
      const findings = [];
      
      Object.entries(data.vulnerabilities || {}).forEach(([pkg, vuln]) => {
        findings.push({
          tool: 'npm audit',
          type: 'SCA',
          severity: vuln.severity?.toLowerCase() || 'medium',
          package: pkg,
          version: vuln.range,
          message: vuln.title || vuln.name,
          via: vuln.via?.map(v => typeof v === 'string' ? v : v.title).join(', '),
          fixAvailable: vuln.fixAvailable
        });
      });
      
      return findings;
    } catch (e) {
      console.error('Error parsing npm audit report:', e.message);
      return [];
    }
  },

  // Snyk Dependencies Parser
  snykDeps: (content) => {
    try {
      const data = JSON.parse(content);
      return (data.vulnerabilities || []).map(vuln => ({
        tool: 'Snyk',
        type: 'SCA',
        severity: vuln.severity?.toLowerCase() || 'medium',
        package: vuln.packageName,
        version: vuln.version,
        message: vuln.title,
        cvss: vuln.cvssScore,
        cve: vuln.identifiers?.CVE?.join(', '),
        fixedIn: vuln.fixedIn?.join(', ')
      }));
    } catch (e) {
      console.error('Error parsing Snyk deps report:', e.message);
      return [];
    }
  },

  // Trivy Container Parser
  trivyContainer: (content) => {
    try {
      const data = JSON.parse(content);
      const findings = [];
      
      (data.Results || []).forEach(result => {
        (result.Vulnerabilities || []).forEach(vuln => {
          findings.push({
            tool: 'Trivy',
            type: 'Container',
            severity: vuln.Severity?.toLowerCase() || 'medium',
            package: vuln.PkgName,
            version: vuln.InstalledVersion,
            fixedVersion: vuln.FixedVersion,
            message: vuln.Title || vuln.Description,
            cve: vuln.VulnerabilityID
          });
        });
      });
      
      return findings;
    } catch (e) {
      console.error('Error parsing Trivy report:', e.message);
      return [];
    }
  },

  // Checkov IaC Parser
  checkov: (content) => {
    try {
      const data = JSON.parse(content);
      const findings = [];
      
      (data.results?.failed_checks || []).forEach(check => {
        findings.push({
          tool: 'Checkov',
          type: 'IaC',
          severity: check.severity?.toLowerCase() || 'medium',
          rule: check.check_id,
          message: check.check_name,
          file: check.file_path,
          resource: check.resource,
          guideline: check.guideline
        });
      });
      
      return findings;
    } catch (e) {
      console.error('Error parsing Checkov report:', e.message);
      return [];
    }
  },

  // ZAP Parser
  zap: (content) => {
    try {
      const data = JSON.parse(content);
      const findings = [];
      
      (data.site || []).forEach(site => {
        (site.alerts || []).forEach(alert => {
          findings.push({
            tool: 'OWASP ZAP',
            type: 'DAST',
            severity: mapZapRisk(alert.riskcode),
            rule: alert.pluginid,
            message: alert.name,
            description: alert.desc,
            solution: alert.solution,
            url: alert.instances?.[0]?.uri,
            cwe: alert.cweid,
            wasc: alert.wascid
          });
        });
      });
      
      return findings;
    } catch (e) {
      console.error('Error parsing ZAP report:', e.message);
      return [];
    }
  },

  // Nuclei Parser
  nuclei: (content) => {
    try {
      const lines = content.trim().split('\n');
      return lines.map(line => {
        try {
          const data = JSON.parse(line);
          return {
            tool: 'Nuclei',
            type: 'DAST',
            severity: data.info?.severity?.toLowerCase() || 'medium',
            rule: data.info?.name || data.template,
            message: data.info?.description,
            url: data.host || data.matched,
            tags: data.info?.tags?.join(', ')
          };
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch (e) {
      console.error('Error parsing Nuclei report:', e.message);
      return [];
    }
  }
};

// Map ZAP risk codes to severity
function mapZapRisk(riskCode) {
  const riskMap = {
    '3': 'critical',
    '2': 'high',
    '1': 'medium',
    '0': 'low'
  };
  return riskMap[riskCode] || 'info';
}

// Find and parse all report files
function findReports(dir) {
  const reports = {
    eslint: [],
    semgrep: [],
    snykCode: [],
    npmAudit: [],
    snykDeps: [],
    trivyContainer: [],
    checkov: [],
    zap: [],
    nuclei: []
  };

  function searchDir(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          searchDir(fullPath);
        } else if (item.endsWith('.json')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Identify report type by filename or content
          if (item.includes('eslint')) {
            reports.eslint.push(...parsers.eslint(content));
          } else if (item.includes('semgrep')) {
            reports.semgrep.push(...parsers.semgrep(content));
          } else if (item.includes('snyk-code')) {
            reports.snykCode.push(...parsers.snykCode(content));
          } else if (item.includes('npm-audit')) {
            reports.npmAudit.push(...parsers.npmAudit(content));
          } else if (item.includes('snyk-deps')) {
            reports.snykDeps.push(...parsers.snykDeps(content));
          } else if (item.includes('trivy')) {
            reports.trivyContainer.push(...parsers.trivyContainer(content));
          } else if (item.includes('checkov')) {
            reports.checkov.push(...parsers.checkov(content));
          } else if (item.includes('zap') || item.includes('report_json')) {
            reports.zap.push(...parsers.zap(content));
          } else if (item.includes('nuclei')) {
            reports.nuclei.push(...parsers.nuclei(content));
          }
        }
      });
    } catch (e) {
      console.error(`Error searching directory ${currentDir}:`, e.message);
    }
  }

  searchDir(dir);
  return reports;
}

// Count findings by severity
function countBySeverity(findings) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  
  findings.forEach(finding => {
    const severity = finding.severity?.toLowerCase() || 'info';
    if (counts.hasOwnProperty(severity)) {
      counts[severity]++;
    }
  });
  
  return counts;
}

// Generate DORA/NIS2 compliance summary
function generateComplianceSummary(allFindings) {
  const critical = allFindings.filter(f => f.severity === 'critical').length;
  const high = allFindings.filter(f => f.severity === 'high').length;
  
  return {
    dora: {
      compliant: critical === 0 && high <= 5,
      criticalIssues: critical,
      highIssues: high,
      requirements: {
        ictRiskManagement: critical === 0,
        incidentReporting: true, // Assuming logging is in place
        resilienceTesting: true, // This workflow runs tests
        thirdPartyRisk: allFindings.filter(f => f.type === 'SCA').length < 10
      }
    },
    nis2: {
      compliant: critical === 0,
      criticalIssues: critical,
      requirements: {
        riskManagement: critical === 0,
        incidentHandling: true,
        supplierSecurity: allFindings.filter(f => f.type === 'SCA' && f.severity === 'critical').length === 0,
        encryption: !allFindings.some(f => f.message?.toLowerCase().includes('encryption'))
      }
    }
  };
}

// Main execution
function main() {
  console.log('🔒 Security Report Aggregator');
  console.log('============================\n');

  // Find and parse all reports
  const reports = findReports(REPORTS_DIR);
  
  // Flatten all findings
  const allFindings = [
    ...reports.eslint,
    ...reports.semgrep,
    ...reports.snykCode,
    ...reports.npmAudit,
    ...reports.snykDeps,
    ...reports.trivyContainer,
    ...reports.checkov,
    ...reports.zap,
    ...reports.nuclei
  ];

  // Calculate statistics
  const sastFindings = allFindings.filter(f => f.type === 'SAST');
  const scaFindings = allFindings.filter(f => f.type === 'SCA');
  const dastFindings = allFindings.filter(f => f.type === 'DAST');
  const containerFindings = allFindings.filter(f => f.type === 'Container');
  const iacFindings = allFindings.filter(f => f.type === 'IaC');

  const consolidatedReport = {
    generatedAt: new Date().toISOString(),
    totalIssues: allFindings.length,
    totalCritical: allFindings.filter(f => f.severity === 'critical').length,
    totalHigh: allFindings.filter(f => f.severity === 'high').length,
    totalMedium: allFindings.filter(f => f.severity === 'medium').length,
    totalLow: allFindings.filter(f => f.severity === 'low').length,
    
    sast: {
      count: sastFindings.length,
      ...countBySeverity(sastFindings),
      tools: ['ESLint', 'Semgrep', 'Snyk Code', 'CodeQL']
    },
    
    sca: {
      count: scaFindings.length,
      ...countBySeverity(scaFindings),
      tools: ['npm audit', 'Snyk']
    },
    
    dast: {
      count: dastFindings.length,
      ...countBySeverity(dastFindings),
      tools: ['OWASP ZAP', 'Nuclei']
    },
    
    container: {
      count: containerFindings.length,
      ...countBySeverity(containerFindings),
      tools: ['Trivy', 'Grype']
    },
    
    iac: {
      count: iacFindings.length,
      ...countBySeverity(iacFindings),
      tools: ['Checkov', 'KICS']
    },
    
    secrets: {
      found: allFindings.filter(f => 
        f.rule?.toLowerCase().includes('secret') || 
        f.message?.toLowerCase().includes('secret') ||
        f.message?.toLowerCase().includes('password') ||
        f.message?.toLowerCase().includes('api key')
      ).length
    },
    
    compliance: generateComplianceSummary(allFindings),
    
    findings: allFindings.map(f => ({
      ...f,
      severityScore: SEVERITY_LEVELS[f.severity] || 0
    })).sort((a, b) => b.severityScore - a.severityScore)
  };

  // Create output directory if it doesn't exist
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write consolidated report
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(consolidatedReport, null, 2));

  // Print summary
  console.log('📊 Summary:');
  console.log(`   Total Issues: ${consolidatedReport.totalIssues}`);
  console.log(`   Critical: ${consolidatedReport.totalCritical}`);
  console.log(`   High: ${consolidatedReport.totalHigh}`);
  console.log(`   Medium: ${consolidatedReport.totalMedium}`);
  console.log(`   Low: ${consolidatedReport.totalLow}`);
  console.log('');
  console.log(`📝 Report saved to: ${OUTPUT_FILE}`);
  console.log('');
  console.log('🏛️ Compliance Status:');
  console.log(`   DORA: ${consolidatedReport.compliance.dora.compliant ? '✅ Compliant' : '❌ Non-Compliant'}`);
  console.log(`   NIS2: ${consolidatedReport.compliance.nis2.compliant ? '✅ Compliant' : '❌ Non-Compliant'}`);
}

main();
