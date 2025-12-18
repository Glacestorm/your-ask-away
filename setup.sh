#!/bin/bash

# ========================================
# ObelixIA Security Setup Script
# ========================================
# Este script configura el entorno de desarrollo
# con todas las herramientas de seguridad necesarias
# ========================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║     ObelixIA Security Setup Script         ║"
echo "║     Banking-Grade Security Configuration   ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# ========================================
# 1. Verificar dependencias del sistema
# ========================================
echo -e "\n${YELLOW}[1/5] Verificando dependencias del sistema...${NC}"

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} $1 instalado"
        return 0
    else
        echo -e "  ${RED}✗${NC} $1 NO instalado"
        return 1
    fi
}

MISSING_DEPS=0

# Git
if ! check_command "git"; then
    echo -e "    ${YELLOW}→ Instalar: https://git-scm.com/downloads${NC}"
    MISSING_DEPS=1
fi

# Node.js
if ! check_command "node"; then
    echo -e "    ${YELLOW}→ Instalar: https://nodejs.org/${NC}"
    MISSING_DEPS=1
fi

# npm o bun
if check_command "bun"; then
    PKG_MANAGER="bun"
elif check_command "npm"; then
    PKG_MANAGER="npm"
else
    echo -e "  ${RED}✗${NC} npm/bun NO instalado"
    MISSING_DEPS=1
fi

# Gitleaks (secret scanning)
if ! check_command "gitleaks"; then
    echo -e "    ${YELLOW}→ Instalar gitleaks:${NC}"
    echo -e "    ${YELLOW}  macOS: brew install gitleaks${NC}"
    echo -e "    ${YELLOW}  Linux: https://github.com/gitleaks/gitleaks#installing${NC}"
    MISSING_DEPS=1
fi

# Semgrep (SAST)
if ! check_command "semgrep"; then
    echo -e "    ${YELLOW}→ Instalar semgrep:${NC}"
    echo -e "    ${YELLOW}  pip install semgrep${NC}"
    echo -e "    ${YELLOW}  o: brew install semgrep${NC}"
    MISSING_DEPS=1
fi

# Pre-commit
if ! check_command "pre-commit"; then
    echo -e "    ${YELLOW}→ Instalar pre-commit:${NC}"
    echo -e "    ${YELLOW}  pip install pre-commit${NC}"
    echo -e "    ${YELLOW}  o: brew install pre-commit${NC}"
    MISSING_DEPS=1
fi

if [ $MISSING_DEPS -eq 1 ]; then
    echo -e "\n${RED}⚠ Algunas dependencias faltan. Instálalas antes de continuar.${NC}"
    echo -e "${YELLOW}¿Deseas continuar de todos modos? (y/n)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo -e "${RED}Setup cancelado.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Verificación de dependencias completada${NC}"

# ========================================
# 2. Configurar archivo .env
# ========================================
echo -e "\n${YELLOW}[2/5] Configurando archivo .env...${NC}"

if [ -f ".env" ]; then
    echo -e "  ${YELLOW}⚠${NC} .env ya existe"
    echo -e "  ${YELLOW}¿Deseas sobrescribirlo con .env.example? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        cp .env.example .env
        echo -e "  ${GREEN}✓${NC} .env sobrescrito desde .env.example"
    else
        echo -e "  ${BLUE}→${NC} .env mantenido sin cambios"
    fi
else
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "  ${GREEN}✓${NC} .env creado desde .env.example"
    else
        echo -e "  ${RED}✗${NC} .env.example no encontrado"
    fi
fi

echo -e "  ${YELLOW}⚠ IMPORTANTE: Configura las variables en .env con tus valores reales${NC}"

# ========================================
# 3. Instalar dependencias del proyecto
# ========================================
echo -e "\n${YELLOW}[3/5] Instalando dependencias del proyecto...${NC}"

if [ "$PKG_MANAGER" = "bun" ]; then
    bun install
elif [ "$PKG_MANAGER" = "npm" ]; then
    npm install
fi

echo -e "${GREEN}✓ Dependencias instaladas${NC}"

# ========================================
# 4. Configurar pre-commit hooks
# ========================================
echo -e "\n${YELLOW}[4/5] Configurando pre-commit hooks...${NC}"

if [ -f ".pre-commit-config.yaml" ]; then
    if command -v pre-commit &> /dev/null; then
        pre-commit install
        echo -e "  ${GREEN}✓${NC} Pre-commit hooks instalados"
        
        # Verificar que los hooks funcionan
        echo -e "  ${BLUE}→${NC} Verificando hooks..."
        if pre-commit run --all-files &> /dev/null; then
            echo -e "  ${GREEN}✓${NC} Todos los hooks pasaron"
        else
            echo -e "  ${YELLOW}⚠${NC} Algunos hooks reportaron advertencias (revisar manualmente)"
        fi
    else
        echo -e "  ${YELLOW}⚠${NC} pre-commit no instalado, configuración manual requerida"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} .pre-commit-config.yaml no encontrado"
fi

# ========================================
# 5. Verificar configuración de seguridad
# ========================================
echo -e "\n${YELLOW}[5/5] Verificando configuración de seguridad...${NC}"

SECURITY_SCORE=0
TOTAL_CHECKS=8

# Check 1: .env.example exists
if [ -f ".env.example" ]; then
    echo -e "  ${GREEN}✓${NC} .env.example presente"
    ((SECURITY_SCORE++))
else
    echo -e "  ${RED}✗${NC} .env.example faltante"
fi

# Check 2: .pre-commit-config.yaml exists
if [ -f ".pre-commit-config.yaml" ]; then
    echo -e "  ${GREEN}✓${NC} Pre-commit configurado"
    ((SECURITY_SCORE++))
else
    echo -e "  ${RED}✗${NC} Pre-commit no configurado"
fi

# Check 3: Gitleaks config
if [ -f "security/.gitleaks.toml" ]; then
    echo -e "  ${GREEN}✓${NC} Gitleaks configurado"
    ((SECURITY_SCORE++))
else
    echo -e "  ${RED}✗${NC} Gitleaks no configurado"
fi

# Check 4: Semgrep rules
if [ -f "security/semgrep-rules.yaml" ]; then
    echo -e "  ${GREEN}✓${NC} Semgrep rules presentes"
    ((SECURITY_SCORE++))
else
    echo -e "  ${RED}✗${NC} Semgrep rules faltantes"
fi

# Check 5: Snyk policy
if [ -f "security/snyk-policy.json" ]; then
    echo -e "  ${GREEN}✓${NC} Snyk policy configurado"
    ((SECURITY_SCORE++))
else
    echo -e "  ${RED}✗${NC} Snyk policy faltante"
fi

# Check 6: .env not tracked
if [ -f ".gitignore" ] && grep -q "\.env" .gitignore; then
    echo -e "  ${GREEN}✓${NC} .env en .gitignore"
    ((SECURITY_SCORE++))
else
    echo -e "  ${YELLOW}⚠${NC} .env debería estar en .gitignore"
fi

# Check 7: No secrets in .env.example
if [ -f ".env.example" ]; then
    if ! grep -qE '=["\x27]?[a-zA-Z0-9]{20,}' .env.example; then
        echo -e "  ${GREEN}✓${NC} .env.example sin secretos"
        ((SECURITY_SCORE++))
    else
        echo -e "  ${RED}✗${NC} Posibles secretos en .env.example"
    fi
else
    ((SECURITY_SCORE++))
fi

# Check 8: Security folder structure
if [ -d "security" ]; then
    echo -e "  ${GREEN}✓${NC} Carpeta security/ presente"
    ((SECURITY_SCORE++))
else
    echo -e "  ${RED}✗${NC} Carpeta security/ faltante"
fi

# Calculate percentage
PERCENTAGE=$((SECURITY_SCORE * 100 / TOTAL_CHECKS))

echo -e "\n${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}       Security Compliance Score: ${PERCENTAGE}%${NC}"
echo -e "${BLUE}       (${SECURITY_SCORE}/${TOTAL_CHECKS} checks passed)${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"

if [ $PERCENTAGE -ge 80 ]; then
    echo -e "${GREEN}✓ Configuración de seguridad EXCELENTE${NC}"
elif [ $PERCENTAGE -ge 60 ]; then
    echo -e "${YELLOW}⚠ Configuración de seguridad ACEPTABLE${NC}"
else
    echo -e "${RED}✗ Configuración de seguridad INSUFICIENTE${NC}"
fi

# ========================================
# Resumen final
# ========================================
echo -e "\n${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║           Setup Completado                 ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}Próximos pasos:${NC}"
echo -e "  1. Edita ${BLUE}.env${NC} con tus credenciales reales"
echo -e "  2. Configura GitHub Secrets para CI/CD"
echo -e "  3. Ejecuta ${BLUE}bun run dev${NC} para iniciar el proyecto"
echo -e "  4. Visita ${BLUE}/obelixia-admin${NC} > Seguridad para más info"

echo -e "\n${GREEN}¡Listo para desarrollar de forma segura! 🔐${NC}\n"
