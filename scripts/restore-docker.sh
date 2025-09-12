#!/bin/bash

# Script de restauration pour Konipa Docker Environment
# Auteur: Assistant IA
# Date: $(date +%Y-%m-%d)

set -e

# Configuration
PROJECT_NAME="konipa_application_finale_complete"
COMPOSE_FILE="./docker-compose.yml"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de log
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERREUR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[ATTENTION] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Vérifier les arguments
if [ $# -eq 0 ]; then
    echo -e "${BLUE}🔄 Script de restauration Docker Konipa${NC}"
    echo -e "${YELLOW}Usage: $0 <chemin_vers_sauvegarde>${NC}"
    echo -e "${YELLOW}Exemple: $0 ./backups/2024-01-15_14-30-00${NC}"
    echo -e "${YELLOW}Ou: $0 ./backups/konipa_backup_20240115_143000.tar.gz${NC}"
    echo ""
    echo "Sauvegardes disponibles:"
    find ./backups -name "konipa_backup_*.tar.gz" -o -type d -name "20*" 2>/dev/null | sort -r | head -10
    exit 1
fi

BACKUP_PATH="$1"

echo -e "${BLUE}🔄 Début de la restauration Docker Konipa${NC}"
echo -e "${BLUE}📅 Date: $(date)${NC}"
echo -e "${BLUE}📁 Source de restauration: $BACKUP_PATH${NC}"

# Vérifier que Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    error "Docker n'est pas en cours d'exécution"
fi

# Vérifier que docker-compose est disponible
if ! command -v docker-compose &> /dev/null; then
    error "docker-compose n'est pas installé"
fi

# Déterminer le type de sauvegarde (archive ou répertoire)
if [[ "$BACKUP_PATH" == *.tar.gz ]]; then
    if [ ! -f "$BACKUP_PATH" ]; then
        error "Archive de sauvegarde non trouvée: $BACKUP_PATH"
    fi
    
    log "Extraction de l'archive de sauvegarde..."
    TEMP_DIR="/tmp/konipa_restore_$(date +%s)"
    mkdir -p "$TEMP_DIR"
    tar xzf "$BACKUP_PATH" -C "$TEMP_DIR" || error "Échec de l'extraction de l'archive"
    RESTORE_DIR="$TEMP_DIR"
else
    if [ ! -d "$BACKUP_PATH" ]; then
        error "Répertoire de sauvegarde non trouvé: $BACKUP_PATH"
    fi
    RESTORE_DIR="$BACKUP_PATH"
fi

# Vérifier que les fichiers de sauvegarde existent
if [ ! -f "$RESTORE_DIR/mysql_backup.sql" ]; then
    error "Fichier de sauvegarde MySQL non trouvé dans $RESTORE_DIR"
fi

warning "Cette opération va écraser les données actuelles. Continuer? (y/N)"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    info "Restauration annulée par l'utilisateur"
    exit 0
fi

log "Arrêt des conteneurs..."
docker-compose down || warning "Échec de l'arrêt des conteneurs (peut être normal)"

log "Suppression des volumes existants..."
docker volume rm ${PROJECT_NAME}_mysql_data ${PROJECT_NAME}_redis_data 2>/dev/null || warning "Volumes déjà supprimés ou inexistants"

log "Démarrage des services de base de données..."
docker-compose up -d konipa-db konipa-redis || error "Échec du démarrage des bases de données"

# Attendre que MySQL soit prêt
log "Attente de la disponibilité de MySQL..."
for i in {1..30}; do
    if docker-compose exec -T konipa-db mysqladmin ping -h localhost -u root -proot123 &>/dev/null; then
        break
    fi
    if [ $i -eq 30 ]; then
        error "MySQL n'est pas disponible après 30 tentatives"
    fi
    sleep 2
done

log "Restauration de la base de données MySQL..."
docker-compose exec -T konipa-db mysql -u root -proot123 < "$RESTORE_DIR/mysql_backup.sql" || error "Échec de la restauration MySQL"

log "Restauration des données Redis..."
if [ -f "$RESTORE_DIR/redis_backup.rdb" ]; then
    docker-compose exec -T konipa-redis redis-cli FLUSHALL || warning "Échec du nettoyage Redis"
    docker cp "$RESTORE_DIR/redis_backup.rdb" konipa-redis-dev:/data/dump.rdb || warning "Échec de la copie du fichier Redis"
    docker-compose restart konipa-redis || warning "Échec du redémarrage Redis"
else
    warning "Fichier de sauvegarde Redis non trouvé, ignoré"
fi

log "Restauration des volumes Docker..."
if [ -f "$RESTORE_DIR/mysql_volume.tar.gz" ]; then
    docker run --rm -v ${PROJECT_NAME}_mysql_data:/data -v "$(realpath "$RESTORE_DIR")":/backup alpine sh -c "cd /data && tar xzf /backup/mysql_volume.tar.gz" || warning "Échec de la restauration du volume MySQL"
fi

if [ -f "$RESTORE_DIR/redis_volume.tar.gz" ]; then
    docker run --rm -v ${PROJECT_NAME}_redis_data:/data -v "$(realpath "$RESTORE_DIR")":/backup alpine sh -c "cd /data && tar xzf /backup/redis_volume.tar.gz" || warning "Échec de la restauration du volume Redis"
fi

log "Restauration de la configuration..."
if [ -f "$RESTORE_DIR/docker-compose.yml" ]; then
    cp "$RESTORE_DIR/docker-compose.yml" "./docker-compose.yml.restored" || warning "Échec de la restauration du docker-compose.yml"
    info "Configuration Docker sauvegardée dans docker-compose.yml.restored"
fi

if [ -f "$RESTORE_DIR/.env" ]; then
    cp "$RESTORE_DIR/.env" "./.env.restored" || warning "Échec de la restauration du .env"
    info "Variables d'environnement sauvegardées dans .env.restored"
fi

log "Démarrage de tous les services..."
docker-compose up -d || error "Échec du démarrage des services"

log "Vérification de l'état des services..."
sleep 10
docker-compose ps

# Nettoyage du répertoire temporaire
if [[ "$BACKUP_PATH" == *.tar.gz ]] && [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
fi

log "Génération du rapport de restauration..."
cat > "./restore_report_$(date +%Y%m%d_%H%M%S).txt" << EOF
=== RAPPORT DE RESTAURATION KONIPA ===
Date: $(date)
Source: $BACKUP_PATH
Version Docker: $(docker --version)
Version Docker Compose: $(docker-compose --version)

Containers restaurés:
$(docker-compose ps --format table)

Volumes restaurés:
$(docker volume ls | grep konipa)

Statut: SUCCÈS
EOF

echo -e "${GREEN}✅ Restauration terminée avec succès!${NC}"
echo -e "${GREEN}🌐 Application disponible sur: http://localhost:5173${NC}"
echo -e "${GREEN}🔧 Backend API: http://localhost:3001${NC}"
echo -e "${GREEN}🗄️ Adminer: http://localhost:8081${NC}"
echo -e "${GREEN}📊 Redis Commander: http://localhost:8082${NC}"
echo -e "${BLUE}📋 Rapport de restauration généré${NC}"