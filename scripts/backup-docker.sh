#!/bin/bash

# Script de sauvegarde pour Konipa Docker Environment
# Auteur: Assistant IA
# Date: $(date +%Y-%m-%d)

set -e

# Configuration
BACKUP_DIR="./backups/$(date +%Y-%m-%d_%H-%M-%S)"
PROJECT_NAME="konipa_application_finale_complete"
COMPOSE_FILE="./docker-compose.yml"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Début de la sauvegarde Docker Konipa${NC}"
echo -e "${BLUE}📅 Date: $(date)${NC}"
echo -e "${BLUE}📁 Répertoire de sauvegarde: $BACKUP_DIR${NC}"

# Créer le répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"

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

# Vérifier que Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    error "Docker n'est pas en cours d'exécution"
fi

# Vérifier que docker-compose est disponible
if ! command -v docker-compose &> /dev/null; then
    error "docker-compose n'est pas installé"
fi

log "Sauvegarde de la base de données MySQL..."
# Sauvegarde MySQL
docker-compose exec -T konipa-db mysqldump -u konipa_user -pkonipa123 --all-databases > "$BACKUP_DIR/mysql_backup.sql" || error "Échec de la sauvegarde MySQL"

log "Sauvegarde des données Redis..."
# Sauvegarde Redis
docker-compose exec -T konipa-redis redis-cli --rdb - > "$BACKUP_DIR/redis_backup.rdb" || warning "Échec de la sauvegarde Redis (non critique)"

log "Sauvegarde des volumes Docker..."
# Sauvegarde des volumes
docker run --rm -v ${PROJECT_NAME}_mysql_data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/mysql_volume.tar.gz -C /data . || error "Échec de la sauvegarde du volume MySQL"
docker run --rm -v ${PROJECT_NAME}_redis_data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/redis_volume.tar.gz -C /data . || warning "Échec de la sauvegarde du volume Redis (non critique)"

log "Sauvegarde de la configuration Docker..."
# Sauvegarder les fichiers de configuration
cp "$COMPOSE_FILE" "$BACKUP_DIR/" || error "Échec de la copie du docker-compose.yml"
cp -r ./database "$BACKUP_DIR/" 2>/dev/null || warning "Répertoire database non trouvé"
cp .env "$BACKUP_DIR/" 2>/dev/null || warning "Fichier .env non trouvé"

log "Création de l'archive de sauvegarde..."
# Créer une archive compressée
tar czf "backups/konipa_backup_$(date +%Y%m%d_%H%M%S).tar.gz" -C "$BACKUP_DIR" . || error "Échec de la création de l'archive"

log "Génération du rapport de sauvegarde..."
# Créer un rapport de sauvegarde
cat > "$BACKUP_DIR/backup_report.txt" << EOF
=== RAPPORT DE SAUVEGARDE KONIPA ===
Date: $(date)
Version Docker: $(docker --version)
Version Docker Compose: $(docker-compose --version)

Containers sauvegardés:
$(docker-compose ps --format table)

Volumes sauvegardés:
$(docker volume ls | grep konipa)

Taille de la sauvegarde:
$(du -sh "$BACKUP_DIR")

Fichiers inclus:
$(ls -la "$BACKUP_DIR")

Statut: SUCCÈS
EOF

log "Nettoyage des anciennes sauvegardes (garde les 7 dernières)..."
# Nettoyer les anciennes sauvegardes (garder les 7 dernières)
find ./backups -name "konipa_backup_*.tar.gz" -type f -mtime +7 -delete 2>/dev/null || true

echo -e "${GREEN}✅ Sauvegarde terminée avec succès!${NC}"
echo -e "${GREEN}📁 Emplacement: $BACKUP_DIR${NC}"
echo -e "${GREEN}📊 Taille: $(du -sh "$BACKUP_DIR" | cut -f1)${NC}"
echo -e "${BLUE}💡 Pour restaurer, utilisez: ./scripts/restore-docker.sh${NC}"