/**
 * Knowledge Base Compliance Validator
 * 
 * Validates hooks and edge functions against KB patterns
 * Run: npx ts-node scripts/validate-kb-compliance.ts
 * 
 * @version 2.0.0
 * @date 2025-06-24
 */

import * as fs from 'fs';
import * as path from 'path';

// === INTERFACES ===
interface ComplianceCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface ComplianceResult {
  file: string;
  type: 'hook' | 'edge-function' | 'component';
  passed: boolean;
  score: number;
  checks: ComplianceCheck[];
}

interface ComplianceReport {
  timestamp: Date;
  version: string;
  summary: {
    totalFiles: number;
    compliant: number;
    nonCompliant: number;
    complianceRate: number;
    byType: {
      hooks: { total: number; compliant: number };
      edgeFunctions: { total: number; compliant: number };
      components: { total: number; compliant: number };
    };
  };
  results: ComplianceResult[];
  recommendations: string[];
}

// === HOOK COMPLIANCE RULES ===
const HOOK_RULES: Array<{
  name: string;
  pattern: RegExp;
  message: string;
  severity: 'error' | 'warning' | 'info';
  weight: number;
}> = [
  {
    name: 'lastRefresh',
    pattern: /useState<Date\s*\|\s*null>\s*\(\s*null\s*\)|lastRefresh.*Date.*null/,
    message: 'Hook debe tener estado lastRefresh: Date | null',
    severity: 'error',
    weight: 15,
  },
  {
    name: 'typedError',
    pattern: /error.*:\s*\w+Error\s*\|\s*null|useState<\w+Error\s*\|\s*null>/,
    message: 'Hook debe usar error tipado (interface *Error), no string | null',
    severity: 'error',
    weight: 20,
  },
  {
    name: 'clearError',
    pattern: /clearError.*=.*useCallback\s*\(\s*\(\s*\)\s*=>\s*set(Error|State)/,
    message: 'Hook debe implementar clearError con useCallback',
    severity: 'error',
    weight: 15,
  },
  {
    name: 'errorInterface',
    pattern: /interface\s+\w+Error\s*\{[\s\S]*?code:\s*string[\s\S]*?message:\s*string/,
    message: 'Hook debe definir interfaz de error con code y message',
    severity: 'error',
    weight: 15,
  },
  {
    name: 'cleanupEffect',
    pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?return\s*\(\s*\)\s*=>/,
    message: 'Hook debe tener cleanup en useEffect para evitar memory leaks',
    severity: 'warning',
    weight: 10,
  },
  {
    name: 'autoRefreshPattern',
    pattern: /startAutoRefresh|autoRefreshInterval|setInterval.*fetchData/,
    message: 'Hook debería implementar patrón de auto-refresh si maneja datos remotos',
    severity: 'info',
    weight: 5,
  },
  {
    name: 'supabaseImport',
    pattern: /import\s*\{\s*supabase\s*\}\s*from\s*['"]@\/integrations\/supabase\/client['"]/,
    message: 'Hook debe importar supabase client correctamente',
    severity: 'warning',
    weight: 5,
  },
  {
    name: 'toastImport',
    pattern: /import\s*\{\s*toast\s*\}\s*from\s*['"]sonner['"]/,
    message: 'Hook debería usar toast para notificaciones',
    severity: 'info',
    weight: 5,
  },
  {
    name: 'consoleError',
    pattern: /console\.error\s*\(\s*`?\[/,
    message: 'Hook debe loggear errores con contexto [NombreHook]',
    severity: 'warning',
    weight: 5,
  },
  {
    name: 'returnObject',
    pattern: /return\s*\{[\s\S]*?isLoading[\s\S]*?error[\s\S]*?clearError/,
    message: 'Hook debe retornar isLoading, error y clearError',
    severity: 'error',
    weight: 5,
  },
];

// === EDGE FUNCTION COMPLIANCE RULES ===
const EDGE_FUNCTION_RULES: Array<{
  name: string;
  pattern: RegExp;
  message: string;
  severity: 'error' | 'warning' | 'info';
  weight: number;
}> = [
  {
    name: 'corsHeaders',
    pattern: /const\s+corsHeaders\s*=\s*\{[\s\S]*?Access-Control-Allow-Origin/,
    message: 'Edge function debe definir corsHeaders',
    severity: 'error',
    weight: 20,
  },
  {
    name: 'optionsHandler',
    pattern: /if\s*\(\s*req\.method\s*===?\s*['"]OPTIONS['"]\s*\)/,
    message: 'Edge function debe manejar OPTIONS para CORS preflight',
    severity: 'error',
    weight: 20,
  },
  {
    name: 'errorHandling',
    pattern: /catch\s*\(\s*\w+\s*\)\s*\{[\s\S]*?console\.error/,
    message: 'Edge function debe tener try/catch con logging',
    severity: 'error',
    weight: 15,
  },
  {
    name: 'rateLimitHandling',
    pattern: /response\.status\s*===?\s*429|status:\s*429|rate.*limit/i,
    message: 'Edge function debe manejar rate limits (429)',
    severity: 'warning',
    weight: 10,
  },
  {
    name: 'paymentRequiredHandling',
    pattern: /response\.status\s*===?\s*402|status:\s*402|payment.*required/i,
    message: 'Edge function debe manejar payment required (402)',
    severity: 'warning',
    weight: 10,
  },
  {
    name: 'lovableApiKey',
    pattern: /Deno\.env\.get\s*\(\s*['"]LOVABLE_API_KEY['"]\s*\)/,
    message: 'Edge function con IA debe usar LOVABLE_API_KEY',
    severity: 'info',
    weight: 5,
  },
  {
    name: 'jsonResponse',
    pattern: /new\s+Response\s*\(\s*JSON\.stringify/,
    message: 'Edge function debe retornar JSON responses',
    severity: 'error',
    weight: 10,
  },
  {
    name: 'successFlag',
    pattern: /success:\s*(true|false)/,
    message: 'Edge function debe incluir flag success en respuesta',
    severity: 'warning',
    weight: 5,
  },
  {
    name: 'logging',
    pattern: /console\.log\s*\(\s*`?\[.*?\]/,
    message: 'Edge function debe tener logging con contexto',
    severity: 'info',
    weight: 5,
  },
];

// === HELPER FUNCTIONS ===
function findFiles(dir: string, pattern: RegExp, exclude: string[] = []): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) return files;
  
  function walk(currentDir: string) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (exclude.some(ex => entry.name.includes(ex))) continue;
        
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      console.warn(`Warning: Could not read directory ${currentDir}`);
    }
  }
  
  walk(dir);
  return files;
}

function validateFile(
  filePath: string,
  rules: typeof HOOK_RULES,
  type: 'hook' | 'edge-function' | 'component'
): ComplianceResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const checks: ComplianceCheck[] = rules.map(rule => ({
    name: rule.name,
    passed: rule.pattern.test(content),
    message: rule.message,
    severity: rule.severity,
  }));
  
  const totalWeight = rules.reduce((sum, r) => sum + r.weight, 0);
  const passedWeight = rules
    .filter((r, i) => checks[i].passed)
    .reduce((sum, r) => sum + r.weight, 0);
  
  const score = Math.round((passedWeight / totalWeight) * 100);
  const passed = checks.filter(c => c.severity === 'error').every(c => c.passed);
  
  return {
    file: filePath,
    type,
    passed,
    score,
    checks,
  };
}

// === MAIN VALIDATION ===
function runValidation(): ComplianceReport {
  console.log('\n🔍 Starting Knowledge Base Compliance Validation...\n');
  
  const results: ComplianceResult[] = [];
  
  // Validate hooks
  console.log('📂 Scanning hooks...');
  const hookFiles = findFiles('src/hooks', /^use.*\.ts$/, ['node_modules', '__tests__', '.test.']);
  console.log(`   Found ${hookFiles.length} hook files`);
  
  for (const file of hookFiles) {
    results.push(validateFile(file, HOOK_RULES, 'hook'));
  }
  
  // Validate edge functions
  console.log('📂 Scanning edge functions...');
  const edgeFunctionFiles = findFiles('supabase/functions', /^index\.ts$/, ['_shared']);
  console.log(`   Found ${edgeFunctionFiles.length} edge function files`);
  
  for (const file of edgeFunctionFiles) {
    results.push(validateFile(file, EDGE_FUNCTION_RULES, 'edge-function'));
  }
  
  // Calculate summary
  const hookResults = results.filter(r => r.type === 'hook');
  const edgeFunctionResults = results.filter(r => r.type === 'edge-function');
  const componentResults = results.filter(r => r.type === 'component');
  
  const compliant = results.filter(r => r.passed).length;
  const nonCompliant = results.length - compliant;
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  const failedHooks = hookResults.filter(r => !r.passed);
  if (failedHooks.length > 0) {
    recommendations.push(`Migrar ${failedHooks.length} hooks al patrón KB (ver lista detallada)`);
  }
  
  const lowScoreHooks = hookResults.filter(r => r.score < 70);
  if (lowScoreHooks.length > 0) {
    recommendations.push(`Mejorar ${lowScoreHooks.length} hooks con score < 70%`);
  }
  
  const failedEdgeFns = edgeFunctionResults.filter(r => !r.passed);
  if (failedEdgeFns.length > 0) {
    recommendations.push(`Corregir ${failedEdgeFns.length} edge functions (CORS, error handling)`);
  }
  
  const missingRateLimit = edgeFunctionResults.filter(r => 
    !r.checks.find(c => c.name === 'rateLimitHandling')?.passed
  );
  if (missingRateLimit.length > 0) {
    recommendations.push(`Añadir manejo de rate limits a ${missingRateLimit.length} edge functions`);
  }
  
  return {
    timestamp: new Date(),
    version: '2.0.0',
    summary: {
      totalFiles: results.length,
      compliant,
      nonCompliant,
      complianceRate: results.length > 0 ? Math.round((compliant / results.length) * 100) : 0,
      byType: {
        hooks: {
          total: hookResults.length,
          compliant: hookResults.filter(r => r.passed).length,
        },
        edgeFunctions: {
          total: edgeFunctionResults.length,
          compliant: edgeFunctionResults.filter(r => r.passed).length,
        },
        components: {
          total: componentResults.length,
          compliant: componentResults.filter(r => r.passed).length,
        },
      },
    },
    results,
    recommendations,
  };
}

// === REPORT OUTPUT ===
function printReport(report: ComplianceReport): void {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         KNOWLEDGE BASE COMPLIANCE REPORT v2.0                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📅 Timestamp: ${report.timestamp.toISOString()}`);
  console.log('');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│                        SUMMARY                              │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log(`│  Total files scanned:    ${report.summary.totalFiles.toString().padStart(4)}                              │`);
  console.log(`│  ✅ Compliant:           ${report.summary.compliant.toString().padStart(4)}                              │`);
  console.log(`│  ❌ Non-compliant:       ${report.summary.nonCompliant.toString().padStart(4)}                              │`);
  console.log(`│  📊 Compliance rate:     ${report.summary.complianceRate.toString().padStart(3)}%                              │`);
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│  By Type:                                                   │');
  console.log(`│    Hooks:          ${report.summary.byType.hooks.compliant}/${report.summary.byType.hooks.total} compliant                         │`);
  console.log(`│    Edge Functions: ${report.summary.byType.edgeFunctions.compliant}/${report.summary.byType.edgeFunctions.total} compliant                         │`);
  console.log('└─────────────────────────────────────────────────────────────┘');
  
  // Non-compliant files
  const nonCompliant = report.results.filter(r => !r.passed);
  if (nonCompliant.length > 0) {
    console.log('\n');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│                  NON-COMPLIANT FILES                        │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    for (const result of nonCompliant) {
      console.log(`\n📁 ${result.file}`);
      console.log(`   Type: ${result.type} | Score: ${result.score}%`);
      
      const failedChecks = result.checks.filter(c => !c.passed);
      for (const check of failedChecks) {
        const icon = check.severity === 'error' ? '❌' : check.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} [${check.severity.toUpperCase()}] ${check.name}: ${check.message}`);
      }
    }
  }
  
  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('\n');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│                    RECOMMENDATIONS                          │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    for (const rec of report.recommendations) {
      console.log(`   💡 ${rec}`);
    }
  }
  
  // Top performers
  const topScores = report.results
    .filter(r => r.passed && r.score >= 90)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  
  if (topScores.length > 0) {
    console.log('\n');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│                   TOP PERFORMERS (90%+)                     │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    for (const result of topScores) {
      console.log(`   ⭐ ${path.basename(result.file)} - ${result.score}%`);
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

// === MAIN EXECUTION ===
try {
  const report = runValidation();
  printReport(report);
  
  // Save JSON report
  const reportPath = 'compliance-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Full report saved to: ${reportPath}\n`);
  
  // Exit with error code if non-compliant
  if (report.summary.nonCompliant > 0) {
    console.log('⚠️  Exiting with code 1 due to non-compliant files\n');
    process.exit(1);
  }
  
  console.log('✅ All files are compliant!\n');
  process.exit(0);
} catch (error) {
  console.error('❌ Validation failed:', error);
  process.exit(1);
}
