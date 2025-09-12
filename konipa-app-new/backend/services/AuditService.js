const { sequelize } = require('../models');

class AuditService {
  /**
   * Enregistrer une action dans les logs d'audit
   * @param {Object} logData - Données du log
   * @param {string} logData.entity_type - Type d'entité (client, product, order, etc.)
   * @param {string} logData.entity_id - ID de l'entité
   * @param {string} logData.action - Action effectuée
   * @param {string} logData.user_id - ID de l'utilisateur
   * @param {string} [logData.user_email] - Email de l'utilisateur
   * @param {Object} [logData.old_values] - Anciennes valeurs
   * @param {Object} [logData.new_values] - Nouvelles valeurs
   * @param {string} [logData.ip_address] - Adresse IP
   * @param {string} [logData.user_agent] - User agent
   * @param {string} [logData.session_id] - ID de session
   * @param {string} [logData.notes] - Notes additionnelles
   */
  static async log(logData) {
    try {
      const query = `
        INSERT INTO audit_logs (
          entity_type, entity_id, action, user_id, user_email,
          old_values, new_values, ip_address, user_agent,
          session_id, notes, timestamp
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, CURRENT_TIMESTAMP
        )
      `;
      
      const values = [
        logData.entity_type,
        logData.entity_id,
        logData.action,
        logData.user_id,
        logData.user_email || null,
        logData.old_values ? JSON.stringify(logData.old_values) : null,
        logData.new_values ? JSON.stringify(logData.new_values) : null,
        logData.ip_address || null,
        logData.user_agent || null,
        logData.session_id || null,
        logData.notes || null
      ];
      
      await sequelize.query(query, {
        replacements: values,
        type: sequelize.QueryTypes.INSERT
      });
      
      console.log(`📝 Audit log créé: ${logData.action} sur ${logData.entity_type} ${logData.entity_id}`);
    } catch (error) {
      console.error('Erreur lors de la création du log d\'audit:', error);
      // Ne pas faire échouer l'opération principale si le log échoue
    }
  }
  
  /**
   * Récupérer les logs d'audit pour une entité
   * @param {string} entityType - Type d'entité
   * @param {string} entityId - ID de l'entité
   * @param {number} [limit=50] - Limite de résultats
   */
  static async getLogsForEntity(entityType, entityId, limit = 50) {
    try {
      const query = `
        SELECT * FROM audit_logs 
        WHERE entity_type = ? AND entity_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `;
      
      const [results] = await sequelize.query(query, {
        replacements: [entityType, entityId, limit],
        type: sequelize.QueryTypes.SELECT
      });
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la récupération des logs d\'audit:', error);
      return [];
    }
  }
  
  /**
   * Récupérer les logs d'audit par utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {number} [limit=100] - Limite de résultats
   */
  static async getLogsByUser(userId, limit = 100) {
    try {
      const query = `
        SELECT * FROM audit_logs 
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `;
      
      const [results] = await sequelize.query(query, {
        replacements: [userId, limit],
        type: sequelize.QueryTypes.SELECT
      });
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la récupération des logs d\'audit par utilisateur:', error);
      return [];
    }
  }
  
  /**
   * Récupérer les logs d'audit récents
   * @param {number} [limit=100] - Limite de résultats
   * @param {string} [action] - Filtrer par action
   */
  static async getRecentLogs(limit = 100, action = null) {
    try {
      let query = `
        SELECT al.*, u.email as user_email_from_users
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
      `;
      
      const replacements = [];
      
      if (action) {
        query += ' WHERE al.action = ?';
        replacements.push(action);
      }
      
      query += ' ORDER BY al.timestamp DESC LIMIT ?';
      replacements.push(limit);
      
      const [results] = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la récupération des logs d\'audit récents:', error);
      return [];
    }
  }

  /**
   * Récupérer les logs d'audit avec pagination
   * @param {Object} whereClause - Conditions de filtrage
   * @param {number} limit - Limite de résultats
   * @param {number} offset - Décalage
   */
  static async getAuditLogs(whereClause = {}, limit = 50, offset = 0) {
    try {
      let query = `
        SELECT al.*, u.email as user_email_from_users
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
      `;
      
      const replacements = [];
      const conditions = [];
      
      if (whereClause.entity_type) {
        conditions.push('al.entity_type = ?');
        replacements.push(whereClause.entity_type);
      }
      
      if (whereClause.action) {
        conditions.push('al.action = ?');
        replacements.push(whereClause.action);
      }
      
      if (whereClause.user_id) {
        conditions.push('al.user_id = ?');
        replacements.push(whereClause.user_id);
      }
      
      if (whereClause.created_at) {
        if (whereClause.created_at.gte) {
          conditions.push('al.timestamp >= ?');
          replacements.push(whereClause.created_at.gte);
        }
        if (whereClause.created_at.lte) {
          conditions.push('al.timestamp <= ?');
          replacements.push(whereClause.created_at.lte);
        }
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY al.timestamp DESC LIMIT ? OFFSET ?';
      replacements.push(limit, offset);
      
      const [results] = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la récupération des logs d\'audit:', error);
      return [];
    }
  }

  /**
   * Compter les logs d'audit
   * @param {Object} whereClause - Conditions de filtrage
   */
  static async countAuditLogs(whereClause = {}) {
    try {
      let query = 'SELECT COUNT(*) as count FROM audit_logs al';
      
      const replacements = [];
      const conditions = [];
      
      if (whereClause.entity_type) {
        conditions.push('al.entity_type = ?');
        replacements.push(whereClause.entity_type);
      }
      
      if (whereClause.action) {
        conditions.push('al.action = ?');
        replacements.push(whereClause.action);
      }
      
      if (whereClause.user_id) {
        conditions.push('al.user_id = ?');
        replacements.push(whereClause.user_id);
      }
      
      if (whereClause.created_at) {
        if (whereClause.created_at.gte) {
          conditions.push('al.timestamp >= ?');
          replacements.push(whereClause.created_at.gte);
        }
        if (whereClause.created_at.lte) {
          conditions.push('al.timestamp <= ?');
          replacements.push(whereClause.created_at.lte);
        }
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      const [results] = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });
      
      return results[0]?.count || 0;
    } catch (error) {
      console.error('Erreur lors du comptage des logs d\'audit:', error);
      return 0;
    }
  }

  /**
   * Rechercher dans les logs d'audit
   * @param {string} searchTerm - Terme de recherche
   * @param {number} limit - Limite de résultats
   * @param {number} offset - Décalage
   */
  static async searchLogs(searchTerm, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT al.*, u.email as user_email_from_users
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.entity_type LIKE ? OR al.action LIKE ? OR al.old_values LIKE ? OR al.new_values LIKE ?
        ORDER BY al.timestamp DESC
        LIMIT ? OFFSET ?
      `;
      
      const searchPattern = `%${searchTerm}%`;
      const replacements = [searchPattern, searchPattern, searchPattern, searchPattern, limit, offset];
      
      const [results] = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche dans les logs:', error);
      return [];
    }
  }

  /**
   * Récupérer un log d'audit par ID
   * @param {string} id - ID du log
   */
  static async getLogById(id) {
    try {
      const query = `
        SELECT al.*, u.email as user_email_from_users
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.id = ?
      `;
      
      const [results] = await sequelize.query(query, {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      });
      
      return results[0] || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du log par ID:', error);
      return null;
    }
  }

  /**
   * Méthodes simplifiées pour compatibilité avec le contrôleur
   */
  static async getLogsByAction(action, limit = 50, offset = 0) {
    return this.getAuditLogs({ action }, limit, offset);
  }

  static async getLogsByEntityType(entityType, limit = 50, offset = 0) {
    return this.getAuditLogs({ entity_type: entityType }, limit, offset);
  }

  static async getLogsByDateRange(startDate, endDate, limit = 50, offset = 0) {
    return this.getAuditLogs({ 
      created_at: { 
        gte: new Date(startDate), 
        lte: new Date(endDate) 
      } 
    }, limit, offset);
  }

  /**
   * Méthodes de statistiques et rapports (implémentation basique)
   */
  static async getAuditStats(period = '7d') {
    try {
      const days = parseInt(period.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const query = `
        SELECT 
          action,
          entity_type,
          COUNT(*) as count,
          DATE(timestamp) as date
        FROM audit_logs 
        WHERE timestamp >= ?
        GROUP BY action, entity_type, DATE(timestamp)
        ORDER BY timestamp DESC
      `;
      
      const [results] = await sequelize.query(query, {
        replacements: [startDate],
        type: sequelize.QueryTypes.SELECT
      });
      
      return {
        period,
        stats: results,
        total: results.reduce((sum, item) => sum + item.count, 0)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return { period, stats: [], total: 0 };
    }
  }

  static async getUserAuditStats(userId, period = '30d') {
    try {
      const days = parseInt(period.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const query = `
        SELECT 
          action,
          entity_type,
          COUNT(*) as count
        FROM audit_logs 
        WHERE user_id = ? AND timestamp >= ?
        GROUP BY action, entity_type
        ORDER BY count DESC
      `;
      
      const [results] = await sequelize.query(query, {
        replacements: [userId, startDate],
        type: sequelize.QueryTypes.SELECT
      });
      
      return {
        userId,
        period,
        stats: results,
        total: results.reduce((sum, item) => sum + item.count, 0)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques utilisateur:', error);
      return { userId, period, stats: [], total: 0 };
    }
  }

  static async getEntityAuditStats(entityType, period = '30d') {
    try {
      const days = parseInt(period.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const query = `
        SELECT 
          action,
          COUNT(*) as count,
          DATE(timestamp) as date
        FROM audit_logs 
        WHERE entity_type = ? AND timestamp >= ?
        GROUP BY action, DATE(timestamp)
        ORDER BY timestamp DESC
      `;
      
      const [results] = await sequelize.query(query, {
        replacements: [entityType, startDate],
        type: sequelize.QueryTypes.SELECT
      });
      
      return {
        entityType,
        period,
        stats: results,
        total: results.reduce((sum, item) => sum + item.count, 0)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques d\'entité:', error);
      return { entityType, period, stats: [], total: 0 };
    }
  }

  /**
   * Méthodes de maintenance et configuration (implémentation basique)
   */
  static async generateActivityReport(startDate, endDate) {
    try {
      const logs = await this.getLogsByDateRange(startDate, endDate, 1000, 0);
      return {
        period: { startDate, endDate },
        totalActions: logs.length,
        logs: logs.slice(0, 100) // Limiter pour la performance
      };
    } catch (error) {
      console.error('Erreur lors de la génération du rapport d\'activité:', error);
      return { period: { startDate, endDate }, totalActions: 0, logs: [] };
    }
  }

  static async generateChangesReport(startDate, endDate, entityType) {
    try {
      const whereClause = {
        created_at: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
      
      if (entityType) {
        whereClause.entity_type = entityType;
      }
      
      const logs = await this.getAuditLogs(whereClause, 1000, 0);
      return {
        period: { startDate, endDate },
        entityType,
        totalChanges: logs.length,
        changes: logs.slice(0, 100)
      };
    } catch (error) {
      console.error('Erreur lors de la génération du rapport de changements:', error);
      return { period: { startDate, endDate }, entityType, totalChanges: 0, changes: [] };
    }
  }

  static async cleanupOldLogs(olderThanDays) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const query = 'DELETE FROM audit_logs WHERE timestamp < ?';
      const [result] = await sequelize.query(query, {
        replacements: [cutoffDate],
        type: sequelize.QueryTypes.DELETE
      });
      
      return { deletedCount: result.affectedRows || 0 };
    } catch (error) {
      console.error('Erreur lors du nettoyage des logs:', error);
      return { deletedCount: 0, error: error.message };
    }
  }

  static async getSystemHealth() {
    try {
      const totalLogs = await this.countAuditLogs();
      const recentLogs = await this.getRecentLogs(10);
      
      return {
        status: 'healthy',
        totalLogs,
        recentActivity: recentLogs.length,
        lastActivity: recentLogs[0]?.timestamp || null
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de la santé du système:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  static async getConfig() {
    return {
      retentionDays: 365,
      enabledActions: ['create', 'update', 'delete'],
      enabledEntities: ['user', 'client', 'product', 'order']
    };
  }

  static async updateConfig(newConfig) {
    // Implémentation basique - dans un vrai système, ceci serait stocké en base
    console.log('Configuration d\'audit mise à jour:', newConfig);
    return newConfig;
  }

  /**
   * Méthodes d'export (implémentation basique)
   */
  static async exportToCsv(filters) {
    try {
      const logs = await this.getAuditLogs(filters, 1000, 0);
      
      let csv = 'ID,Timestamp,User,Entity Type,Entity ID,Action,Old Values,New Values\n';
      
      logs.forEach(log => {
        csv += `${log.id},${log.timestamp},${log.user_email_from_users || log.user_id},${log.entity_type},${log.entity_id},${log.action},"${log.old_values || ''}","${log.new_values || ''}"\n`;
      });
      
      return csv;
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      return 'Error generating CSV';
    }
  }

  static async exportToExcel(filters) {
    // Implémentation basique - nécessiterait ExcelJS
    try {
      const logs = await this.getAuditLogs(filters, 1000, 0);
      return Buffer.from('Excel export not implemented yet');
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      return Buffer.from('Error generating Excel');
    }
  }

  static async exportToPdf(filters) {
    // Implémentation basique - nécessiterait PDFKit
    try {
      const logs = await this.getAuditLogs(filters, 1000, 0);
      return Buffer.from('PDF export not implemented yet');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      return Buffer.from('Error generating PDF');
    }
  }
}

module.exports = { AuditService };