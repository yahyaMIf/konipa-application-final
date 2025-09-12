#!/bin/bash

# Script de démarrage pour l'application Konipa
# Ce script gère l'initialisation, la configuration et le démarrage de l'application

set -e  # Arrêter en cas d'erreur

# ============================================================================
# Configuration et variables
# ============================================================================

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration par défaut
APP_NAME="Konipa B2B Application"
APP_VERSION="1.0.0"
NODE_ENV=${NODE_ENV:-production}
PORT=${PORT:-3000}
LOG_LEVEL=${LOG_LEVEL:-info}

# Répertoires
APP_DIR="/app"
LOG_DIR="${APP_DIR}/logs"
CONFIG_DIR="${APP_DIR}/config"
CERTS_DIR="${APP_DIR}/certs"

# Fichiers de log
APP_LOG="${LOG_DIR}/application.log"
ERROR_LOG="${LOG_DIR}/error.log"

# ============================================================================
# Fonctions utilitaires
# ============================================================================

# Fonction de logging
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[${timestamp}] [INFO]${NC} $message" | tee -a "$APP_LOG"
            ;;
        "WARN")
            echo -e "${YELLOW}[${timestamp}] [WARN]${NC} $message" | tee -a "$APP_LOG"
            ;;
        "ERROR")
            echo -e "${RED}[${timestamp}] [ERROR]${NC} $message" | tee -a "$APP_LOG" | tee -a "$ERROR_LOG"
            ;;
        "DEBUG")
            if [[ "$LOG_LEVEL" == "debug" ]]; then
                echo -e "${BLUE}[${timestamp}] [DEBUG]${NC} $message" | tee -a "$APP_LOG"
            fi
            ;;
    esac
}

# Fonction de vérification des prérequis
check_prerequisites() {
    log "INFO" "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log "ERROR" "Node.js n'est pas installé"
        exit 1
    fi
    
    local node_version=$(node --version)
    log "INFO" "Version Node.js: $node_version"
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        log "ERROR" "npm n'est pas installé"
        exit 1
    fi
    
    # Vérifier les répertoires
    for dir in "$LOG_DIR" "$CONFIG_DIR" "$CERTS_DIR"; do
        if [[ ! -d "$dir" ]]; then
            log "WARN" "Création du répertoire manquant: $dir"
            mkdir -p "$dir"
        fi
    done
    
    # Vérifier les permissions
    if [[ ! -w "$LOG_DIR" ]]; then
        log "ERROR" "Permissions insuffisantes pour écrire dans $LOG_DIR"
        exit 1
    fi
    
    log "INFO" "Prérequis vérifiés avec succès"
}

# Fonction de validation de la configuration
validate_config() {
    log "INFO" "Validation de la configuration..."
    
    # Variables obligatoires
    local required_vars=(
        "NODE_ENV"
        "PORT"
    )
    
    # Variables optionnelles en production peuvent être ajoutées ici
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log "ERROR" "Variables d'environnement manquantes: ${missing_vars[*]}"
        exit 1
    fi
    
    # Validation du port
    if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [[ "$PORT" -lt 1 ]] || [[ "$PORT" -gt 65535 ]]; then
        log "ERROR" "Port invalide: $PORT"
        exit 1
    fi
    
    log "INFO" "Configuration validée avec succès"
}

# Fonction de test de connectivité (peut être étendue pour d'autres services)
test_external_connections() {
    log "INFO" "Test des connexions externes..."
    log "INFO" "Aucune connexion externe configurée"
}

# Fonction de migration de base de données
run_migrations() {
    if [[ -f "$APP_DIR/migrations/migrate.js" ]]; then
        log "INFO" "Exécution des migrations de base de données..."
        
        if node "$APP_DIR/migrations/migrate.js"; then
            log "INFO" "Migrations exécutées avec succès"
        else
            log "ERROR" "Échec des migrations de base de données"
            exit 1
        fi
    else
        log "DEBUG" "Aucun script de migration trouvé"
    fi
}

# Fonction de nettoyage des logs anciens
cleanup_logs() {
    log "INFO" "Nettoyage des anciens logs..."
    
    # Garder les logs des 30 derniers jours
    find "$LOG_DIR" -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true
    
    # Rotation des logs volumineux (> 100MB)
    for logfile in "$APP_LOG" "$ERROR_LOG"; do
        if [[ -f "$logfile" ]] && [[ $(stat -f%z "$logfile" 2>/dev/null || stat -c%s "$logfile" 2>/dev/null) -gt 104857600 ]]; then
            log "INFO" "Rotation du fichier de log volumineux: $logfile"
            mv "$logfile" "${logfile}.$(date +%Y%m%d_%H%M%S)"
            touch "$logfile"
        fi
    done
}

# Fonction de configuration des signaux
setup_signal_handlers() {
    log "INFO" "Configuration des gestionnaires de signaux..."
    
    # Fonction de nettoyage à l'arrêt
    cleanup() {
        log "INFO" "Réception du signal d'arrêt, nettoyage en cours..."
        
        if [[ -n "$APP_PID" ]]; then
            log "INFO" "Arrêt de l'application (PID: $APP_PID)..."
            kill -TERM "$APP_PID" 2>/dev/null || true
            
            # Attendre l'arrêt gracieux
            local count=0
            while kill -0 "$APP_PID" 2>/dev/null && [[ $count -lt 30 ]]; do
                sleep 1
                ((count++))
            done
            
            # Forcer l'arrêt si nécessaire
            if kill -0 "$APP_PID" 2>/dev/null; then
                log "WARN" "Arrêt forcé de l'application"
                kill -KILL "$APP_PID" 2>/dev/null || true
            fi
        fi
        
        log "INFO" "Nettoyage terminé"
        exit 0
    }
    
    # Associer les signaux à la fonction de nettoyage
    trap cleanup SIGTERM SIGINT SIGQUIT
}

# Fonction de monitoring de santé
health_check() {
    local max_attempts=30
    local attempt=1
    
    log "INFO" "Vérification de la santé de l'application..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
            log "INFO" "Application démarrée et opérationnelle"
            return 0
        fi
        
        log "DEBUG" "Tentative $attempt/$max_attempts - Application pas encore prête"
        sleep 2
        ((attempt++))
    done
    
    log "ERROR" "L'application n'a pas répondu après $max_attempts tentatives"
    return 1
}

# ============================================================================
# Fonction principale
# ============================================================================

main() {
    log "INFO" "Démarrage de $APP_NAME v$APP_VERSION"
    log "INFO" "Environnement: $NODE_ENV"
    log "INFO" "Port: $PORT"
    
    # Étapes d'initialisation
    check_prerequisites
    validate_config
    cleanup_logs
    test_external_connections
    run_migrations
    setup_signal_handlers
    
    # Démarrage de l'application
    log "INFO" "Démarrage de l'application Node.js..."
    
    # Définir le point d'entrée selon l'environnement
    local entry_point="src/app.js"
    if [[ -f "$APP_DIR/dist/app.js" ]]; then
        entry_point="dist/app.js"
    fi
    
    # Options Node.js selon l'environnement
    local node_options=""
    if [[ "$NODE_ENV" == "production" ]]; then
        node_options="--max-old-space-size=2048"
    elif [[ "$NODE_ENV" == "development" ]]; then
        node_options="--inspect=0.0.0.0:9229"
    fi
    
    # Démarrer l'application en arrière-plan
    cd "$APP_DIR"
    node $node_options "$entry_point" &
    APP_PID=$!
    
    log "INFO" "Application démarrée avec le PID: $APP_PID"
    
    # Vérification de santé
    if health_check; then
        log "INFO" "$APP_NAME démarré avec succès"
    else
        log "ERROR" "Échec du démarrage de $APP_NAME"
        exit 1
    fi
    
    # Attendre l'arrêt de l'application
    wait "$APP_PID"
    local exit_code=$?
    
    if [[ $exit_code -eq 0 ]]; then
        log "INFO" "Application arrêtée normalement"
    else
        log "ERROR" "Application arrêtée avec le code d'erreur: $exit_code"
    fi
    
    exit $exit_code
}

# ============================================================================
# Point d'entrée
# ============================================================================

# Vérifier si le script est exécuté directement
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi

# ============================================================================
# Aide et documentation
# ============================================================================

# Usage: ./start.sh
# 
# Variables d'environnement supportées:
# - NODE_ENV: environnement (development, production, test)
# - PORT: port d'écoute de l'application
# - LOG_LEVEL: niveau de log (debug, info, warn, error)
# 
# Exemples:
# NODE_ENV=production PORT=3000 ./start.sh
# NODE_ENV=development LOG_LEVEL=debug ./start.sh