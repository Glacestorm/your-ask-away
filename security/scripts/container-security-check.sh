#!/bin/sh

# ===========================================
# Container Security Check Script
# Supports DORA and NIS2 compliance
# ===========================================

echo "🔒 Container Security Check"
echo "=========================="
echo ""

RESULT_FILE="/tmp/container-security-results.json"
PASSED=0
FAILED=0
WARNINGS=0

# Initialize results
echo '{
  "timestamp": "'$(date -Iseconds)'",
  "checks": []
}' > $RESULT_FILE

add_result() {
    local check_name="$1"
    local status="$2"
    local details="$3"
    
    if [ "$status" = "PASS" ]; then
        PASSED=$((PASSED + 1))
        echo "✅ $check_name"
    elif [ "$status" = "FAIL" ]; then
        FAILED=$((FAILED + 1))
        echo "❌ $check_name: $details"
    else
        WARNINGS=$((WARNINGS + 1))
        echo "⚠️  $check_name: $details"
    fi
}

# Check 1: Running as non-root
echo ""
echo "📋 User Privilege Checks"
echo "------------------------"

CURRENT_USER=$(id -u 2>/dev/null || echo "unknown")
if [ "$CURRENT_USER" != "0" ]; then
    add_result "Non-root user" "PASS" ""
else
    add_result "Non-root user" "FAIL" "Container running as root"
fi

# Check 2: Writable directories
echo ""
echo "📋 File System Checks"
echo "---------------------"

WRITABLE_DIRS=$(find /app -type d -writable 2>/dev/null | wc -l)
if [ "$WRITABLE_DIRS" -lt 5 ]; then
    add_result "Limited writable directories" "PASS" ""
else
    add_result "Limited writable directories" "WARN" "Found $WRITABLE_DIRS writable directories"
fi

# Check 3: No SUID/SGID binaries
SUID_FILES=$(find / -type f \( -perm -4000 -o -perm -2000 \) 2>/dev/null | wc -l)
if [ "$SUID_FILES" -eq 0 ]; then
    add_result "No SUID/SGID binaries" "PASS" ""
else
    add_result "No SUID/SGID binaries" "WARN" "Found $SUID_FILES SUID/SGID files"
fi

# Check 4: No sensitive files
echo ""
echo "📋 Sensitive Data Checks"
echo "------------------------"

SENSITIVE_FILES=0
for pattern in "*.pem" "*.key" "*.p12" ".env" "*.pfx" "id_rsa*"; do
    COUNT=$(find /app -name "$pattern" 2>/dev/null | wc -l)
    SENSITIVE_FILES=$((SENSITIVE_FILES + COUNT))
done

if [ "$SENSITIVE_FILES" -eq 0 ]; then
    add_result "No sensitive files in image" "PASS" ""
else
    add_result "No sensitive files in image" "FAIL" "Found $SENSITIVE_FILES potentially sensitive files"
fi

# Check 5: No hardcoded secrets in environment
SECRET_PATTERNS="password|secret|api_key|apikey|token|credential"
ENV_SECRETS=$(env 2>/dev/null | grep -iE "$SECRET_PATTERNS" | wc -l)
if [ "$ENV_SECRETS" -eq 0 ]; then
    add_result "No secrets in environment" "PASS" ""
else
    add_result "No secrets in environment" "WARN" "Found $ENV_SECRETS potential secrets in environment"
fi

# Check 6: Package vulnerabilities (if safety is installed)
echo ""
echo "📋 Dependency Checks"
echo "--------------------"

if command -v safety >/dev/null 2>&1; then
    VULN_COUNT=$(safety check --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")
    if [ "$VULN_COUNT" = "0" ]; then
        add_result "Python dependencies secure" "PASS" ""
    else
        add_result "Python dependencies secure" "WARN" "Found $VULN_COUNT vulnerabilities"
    fi
else
    add_result "Python dependencies secure" "SKIP" "safety not installed"
fi

# Check 7: Node.js package audit
if [ -f /app/package.json ]; then
    cd /app
    NPM_VULNS=$(npm audit --json 2>/dev/null | jq '.metadata.vulnerabilities.total // 0' 2>/dev/null || echo "0")
    if [ "$NPM_VULNS" = "0" ]; then
        add_result "Node.js dependencies secure" "PASS" ""
    else
        add_result "Node.js dependencies secure" "WARN" "Found $NPM_VULNS vulnerabilities"
    fi
fi

# Check 8: Network exposure
echo ""
echo "📋 Network Checks"
echo "-----------------"

LISTENING_PORTS=$(netstat -tlnp 2>/dev/null | grep LISTEN | wc -l || ss -tlnp 2>/dev/null | grep LISTEN | wc -l || echo "0")
if [ "$LISTENING_PORTS" -le 2 ]; then
    add_result "Limited network exposure" "PASS" ""
else
    add_result "Limited network exposure" "WARN" "Found $LISTENING_PORTS listening ports"
fi

# Check 9: Security headers in app (if curl available)
if command -v curl >/dev/null 2>&1 && [ -n "$APP_URL" ]; then
    HEADERS=$(curl -sI "$APP_URL" 2>/dev/null)
    
    if echo "$HEADERS" | grep -qi "x-frame-options"; then
        add_result "X-Frame-Options header" "PASS" ""
    else
        add_result "X-Frame-Options header" "WARN" "Missing"
    fi
    
    if echo "$HEADERS" | grep -qi "x-content-type-options"; then
        add_result "X-Content-Type-Options header" "PASS" ""
    else
        add_result "X-Content-Type-Options header" "WARN" "Missing"
    fi
    
    if echo "$HEADERS" | grep -qi "strict-transport-security"; then
        add_result "HSTS header" "PASS" ""
    else
        add_result "HSTS header" "WARN" "Missing"
    fi
fi

# Check 10: Container resource limits
echo ""
echo "📋 Resource Limit Checks"
echo "------------------------"

if [ -f /sys/fs/cgroup/memory/memory.limit_in_bytes ]; then
    MEM_LIMIT=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null)
    if [ "$MEM_LIMIT" != "9223372036854771712" ]; then
        add_result "Memory limit configured" "PASS" ""
    else
        add_result "Memory limit configured" "WARN" "No memory limit set"
    fi
else
    add_result "Memory limit configured" "SKIP" "cgroup not available"
fi

# Summary
echo ""
echo "=========================="
echo "📊 Security Check Summary"
echo "=========================="
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "⚠️  Warnings: $WARNINGS"
echo ""

# Exit with error if critical failures
if [ "$FAILED" -gt 0 ]; then
    echo "❌ Security check failed with $FAILED critical issues"
    exit 1
fi

if [ "$WARNINGS" -gt 5 ]; then
    echo "⚠️  Security check passed with $WARNINGS warnings"
    exit 0
fi

echo "✅ Security check passed"
exit 0
