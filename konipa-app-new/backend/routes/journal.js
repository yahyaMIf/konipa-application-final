const express = require('express');
const router = express.Router();
const {
  getAllJournalEntries: getAllJournalEntriesDB,
  getJournalEntryById: getJournalEntryByIdDB,
  getJournalStats: getJournalStatsDB,
  cleanupOldEntries: cleanupOldEntriesDB,
  exportJournalEntries: exportJournalEntriesDB,
  saveActivities: saveActivitiesDB,
  getDailySummary: getDailySummaryDB
} = require('../controllers/journalController');

const {
  getAllJournalEntries,
  getJournalEntryById,
  getJournalStats,
  cleanupOldEntries,
  exportJournalEntries,
  saveActivities,
  getDailySummary,
  getActivities,
  exportJournalToExcel,
  exportJournalToCSV
} = require('../controllers/journalController');

// Fonction pour récupérer les activités par date
const getActivitiesByDate = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date requise'
      });
    }
    
    // Utiliser la fonction getDailySummary existante
    return getDailySummary(req, res);
  } catch (error) {
    console.error('Erreur lors de la récupération des activités par date:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des activités par date'
    });
  }
};
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * @route GET /api/journal/activities
 * @desc Récupérer les activités du journal CEO
 * @access Private
 */
router.get('/activities', authenticateToken, getActivities);

/**
 * @route POST /api/journal/activities
 * @desc Sauvegarder les activités du journal CEO
 * @access Private
 */
router.post('/activities', authenticateToken, saveActivities);

/**
 * @route POST /api/journal/events
 * @desc Enregistrer un événement dans le journal
 * @access Private
 */
router.post('/events', authenticateToken, saveActivities);

router.post('/cleanup', authenticateToken, requireRole(['admin']), cleanupOldEntries);
router.get('/', authenticateToken, getAllJournalEntries);
router.get('/stats', authenticateToken, getJournalStats);
router.get('/statistics', authenticateToken, getJournalStats);
router.get('/daily-summary', authenticateToken, getDailySummary);
router.get('/export', authenticateToken, exportJournalEntries);
router.get('/export/excel', authenticateToken, requireRole(['admin', 'comptabilite']), exportJournalToExcel);
router.get('/export/csv', authenticateToken, requireRole(['admin', 'comptabilite']), exportJournalToCSV);
router.get('/activities/by-date', authenticateToken, getActivitiesByDate);
router.get('/:id', authenticateToken, getJournalEntryById);

module.exports = router;