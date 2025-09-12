import { formatMAD, calculateVAT } from '../utils/currency.js';
import { adminJournalService } from './adminJournalService.js';
import apiService from './apiService.js';

/**
 * Service de génération de rapports comptables
 */
export class ReportService {
  /**
   * Génère un bilan comptable
   */
  static async generateBilan() {
    try {
      const currentDate = new Date().toLocaleDateString('fr-FR');
      
      // Récupérer les données depuis l'API
      const [statisticsResponse, unpaidResponse] = await Promise.all([
        apiService.dashboard.getStats(),
        apiService.invoices.getAll({ status: 'unpaid' })
      ]);
      
      const statisticsData = statisticsResponse.data;
      const unpaidData = unpaidResponse.data;
      
      const totalRevenue = statisticsData.totalRevenue || 0;
      const totalUnpaid = unpaidData.reduce((sum, item) => sum + (item.amount || 0), 0);
      const netRevenue = totalRevenue - totalUnpaid;
    
    const bilanData = {
      title: 'BILAN COMPTABLE',
      date: currentDate,
      period: 'Exercice 2024',
      actif: {
        immobilisations: 450000,
        stocks: 125000,
        creances: totalUnpaid,
        tresorerie: 89000,
        total: 450000 + 125000 + totalUnpaid + 89000
      },
      passif: {
        capital: 300000,
        reserves: 150000,
        resultat: netRevenue,
        dettes: 45000,
        total: 300000 + 150000 + netRevenue + 45000
      }
    };
    
      // Logger la génération du bilan
      adminJournalService.logReportGeneration({
        reportType: 'Bilan comptable',
        period: bilanData.period,
        generatedBy: 'Système',
        format: 'HTML',
        data: {
          totalActif: bilanData.actif.total,
          totalPassif: bilanData.passif.total,
          netRevenue: bilanData.passif.resultat
        },
        timestamp: new Date().toISOString()
      });
      
      return this.formatBilanReport(bilanData);
     } catch (error) {
       throw new Error('Impossible de générer le bilan comptable');
     }
  }
  
  /**
   * Génère un compte de résultat
   */
  static async generateCompteResultat() {
    try {
      const currentDate = new Date().toLocaleDateString('fr-FR');
      
      // Récupérer les données depuis l'API
      const statisticsResponse = await apiService.dashboard.getStats();
      const statisticsData = statisticsResponse.data;
      
      const totalRevenue = statisticsData.totalRevenue || 0;
      const charges = {
        achats: totalRevenue * 0.6,
        personnel: 45000,
        externes: 25000,
        financieres: 3000,
        exceptionnelles: 2000
      };
      
      const totalCharges = Object.values(charges).reduce((sum, charge) => sum + charge, 0);
      const resultat = totalRevenue - totalCharges;
      
      const compteResultatData = {
         title: 'COMPTE DE RÉSULTAT',
         date: currentDate,
         period: 'Exercice 2024',
         produits: {
           ventes: totalRevenue,
           autres: 15000,
           total: totalRevenue + 15000
         },
         charges: {
           ...charges,
           total: totalCharges
         },
         resultat: resultat
       };
       
       // Logger la génération du compte de résultat
       adminJournalService.logReportGeneration({
         reportType: 'Compte de résultat',
         period: compteResultatData.period,
         generatedBy: 'Système',
         format: 'HTML',
         data: {
           totalProduits: compteResultatData.produits.total,
           totalCharges: compteResultatData.charges.total,
           resultat: compteResultatData.resultat
         },
         timestamp: new Date().toISOString()
       });
       
       return this.formatCompteResultatReport(compteResultatData);
    } catch (error) {
      throw new Error('Impossible de générer le compte de résultat');
    }
  }
  
  /**
   * Génère un grand livre
   */
  static async generateGrandLivre() {
    try {
      const currentDate = new Date().toLocaleDateString('fr-FR');
      
      // Récupérer les données depuis l'API
      const [statisticsResponse, unpaidResponse] = await Promise.all([
        apiService.dashboard.getStats(),
        apiService.invoices.getAll({ status: 'unpaid' })
      ]);
      
      const statisticsData = statisticsResponse.data;
      const unpaidData = unpaidResponse.data;
      
      const comptes = [
        {
          numero: '411000',
          nom: 'Clients',
          soldeDebiteur: unpaidData.reduce((sum, item) => sum + item.amount, 0),
          soldeCrediteur: 0
        },
        {
          numero: '701000',
          nom: 'Ventes de marchandises',
          soldeDebiteur: 0,
          soldeCrediteur: statisticsData.totalRevenue
        },
        {
          numero: '607000',
          nom: 'Achats de marchandises',
          soldeDebiteur: statisticsData.totalRevenue * 0.6,
          soldeCrediteur: 0
        },
        {
          numero: '512000',
          nom: 'Banque',
          soldeDebiteur: 89000,
          soldeCrediteur: 0
        },
        {
          numero: '445660',
          nom: 'TVA déductible',
          soldeDebiteur: calculateVAT(statisticsData.totalRevenue * 0.6),
          soldeCrediteur: 0
        },
        {
          numero: '445710',
          nom: 'TVA collectée',
          soldeDebiteur: 0,
          soldeCrediteur: calculateVAT(statisticsData.totalRevenue)
        }
      ];
    
      const grandLivreData = {
        title: 'GRAND LIVRE',
        date: currentDate,
        period: 'Exercice 2024',
        comptes: comptes,
        totalDebit: comptes.reduce((sum, compte) => sum + compte.soldeDebiteur, 0),
        totalCredit: comptes.reduce((sum, compte) => sum + compte.soldeCrediteur, 0)
      };
      
      // Logger la génération du grand livre
      adminJournalService.logReportGeneration({
        reportType: 'Grand livre',
        period: grandLivreData.period,
        generatedBy: 'Système',
        format: 'HTML',
        data: {
          totalDebit: grandLivreData.totalDebit,
          totalCredit: grandLivreData.totalCredit,
          nombreComptes: grandLivreData.comptes.length
        },
        timestamp: new Date().toISOString()
      });
      
      return this.formatGrandLivreReport(grandLivreData);
    } catch (error) {
      throw new Error('Impossible de générer le grand livre');
    }
  }
  
  /**
   * Génère une balance générale
   */
  static async generateBalance() {
    try {
      const currentDate = new Date().toLocaleDateString('fr-FR');
      
      // Récupérer les données depuis l'API
      const [statisticsResponse, unpaidResponse] = await Promise.all([
        apiService.dashboard.getStats(),
        apiService.invoices.getAll({ status: 'unpaid' })
      ]);
      
      const statisticsData = statisticsResponse.data;
      const unpaidData = unpaidResponse.data;
      
      const comptes = [
        { numero: '101000', nom: 'Capital', debit: 0, credit: 300000, soldeDebit: 0, soldeCredit: 300000 },
        { numero: '106000', nom: 'Réserves', debit: 0, credit: 150000, soldeDebit: 0, soldeCredit: 150000 },
        { numero: '213000', nom: 'Installations', debit: 450000, credit: 0, soldeDebit: 450000, soldeCredit: 0 },
        { numero: '411000', nom: 'Clients', debit: unpaidData.reduce((sum, item) => sum + item.amount, 0), credit: 0, soldeDebit: unpaidData.reduce((sum, item) => sum + item.amount, 0), soldeCredit: 0 },
        { numero: '512000', nom: 'Banque', debit: 89000, credit: 0, soldeDebit: 89000, soldeCredit: 0 },
        { numero: '607000', nom: 'Achats', debit: statisticsData.totalRevenue * 0.6, credit: 0, soldeDebit: statisticsData.totalRevenue * 0.6, soldeCredit: 0 },
        { numero: '701000', nom: 'Ventes', debit: 0, credit: statisticsData.totalRevenue, soldeDebit: 0, soldeCredit: statisticsData.totalRevenue }
      ];
    
      const balanceData = {
        title: 'BALANCE GÉNÉRALE',
        date: currentDate,
        period: 'Exercice 2024',
        comptes: comptes,
        totaux: {
          debit: comptes.reduce((sum, compte) => sum + compte.debit, 0),
          credit: comptes.reduce((sum, compte) => sum + compte.credit, 0),
          soldeDebit: comptes.reduce((sum, compte) => sum + compte.soldeDebit, 0),
          soldeCredit: comptes.reduce((sum, compte) => sum + compte.soldeCredit, 0)
        }
      };
      
      // Logger la génération de la balance
      adminJournalService.logReportGeneration({
        reportType: 'Balance générale',
        period: balanceData.period,
        generatedBy: 'Système',
        format: 'HTML',
        data: {
          totalDebit: balanceData.totaux.debit,
          totalCredit: balanceData.totaux.credit,
          nombreComptes: balanceData.comptes.length
        },
        timestamp: new Date().toISOString()
      });
      
      return this.formatBalanceReport(balanceData);
    } catch (error) {
      throw new Error('Impossible de générer la balance générale');
    }
  }
  
  /**
   * Génère un tableau de trésorerie
   */
  static async generateTresorerie() {
    try {
      const currentDate = new Date().toLocaleDateString('fr-FR');
      
      // Récupérer les données depuis l'API
      const [statisticsResponse, unpaidResponse] = await Promise.all([
        apiService.dashboard.getStats(),
        apiService.invoices.getAll({ status: 'unpaid' })
      ]);
      
      const statisticsData = statisticsResponse.data;
      const unpaidData = unpaidResponse.data;
      
      const encaissements = {
        ventes: statisticsData.totalRevenue - unpaidData.reduce((sum, item) => sum + item.amount, 0),
        autres: 15000
      };
      
      const decaissements = {
        achats: statisticsData.totalRevenue * 0.5,
        salaires: 45000,
        charges: 25000,
        impots: 12000
      };
    
      const tresorerieData = {
        title: 'TABLEAU DE TRÉSORERIE',
        date: currentDate,
        period: 'Exercice 2024',
        encaissements: {
          ...encaissements,
          total: Object.values(encaissements).reduce((sum, enc) => sum + enc, 0)
        },
        decaissements: {
          ...decaissements,
          total: Object.values(decaissements).reduce((sum, dec) => sum + dec, 0)
        },
        variation: Object.values(encaissements).reduce((sum, enc) => sum + enc, 0) - Object.values(decaissements).reduce((sum, dec) => sum + dec, 0),
        tresorerieDebut: 45000,
        tresorerieFin: 45000 + (Object.values(encaissements).reduce((sum, enc) => sum + enc, 0) - Object.values(decaissements).reduce((sum, dec) => sum + dec, 0))
      };
      
      // Logger la génération du tableau de trésorerie
      adminJournalService.logReportGeneration({
        reportType: 'Tableau de trésorerie',
        period: tresorerieData.period,
        generatedBy: 'Système',
        format: 'HTML',
        data: {
          totalEncaissements: tresorerieData.encaissements.total,
          totalDecaissements: tresorerieData.decaissements.total,
          variation: tresorerieData.variation,
          tresorerieFin: tresorerieData.tresorerieFin
        },
        timestamp: new Date().toISOString()
      });
      
      return this.formatTresorerieReport(tresorerieData);
    } catch (error) {
      throw new Error('Impossible de générer le tableau de trésorerie');
    }
  }
  
  /**
   * Formate le rapport de bilan
   */
  static formatBilanReport(data) {
    return `
═══════════════════════════════════════════════════════════════
                        ${data.title}
═══════════════════════════════════════════════════════════════
Date d'édition: ${data.date}
Période: ${data.period}

▓▓▓ ACTIF ▓▓▓

┌─────────────────────────────────────────────────────────────┐
│ IMMOBILISATIONS                     ${formatMAD(data.actif.immobilisations).padStart(15)} │
│ STOCKS                              ${formatMAD(data.actif.stocks).padStart(15)} │
│ CRÉANCES CLIENTS                    ${formatMAD(data.actif.creances).padStart(15)} │
│ TRÉSORERIE                          ${formatMAD(data.actif.tresorerie).padStart(15)} │
├─────────────────────────────────────────────────────────────┤
│ TOTAL ACTIF                         ${formatMAD(data.actif.total).padStart(15)} │
└─────────────────────────────────────────────────────────────┘

▓▓▓ PASSIF ▓▓▓

┌─────────────────────────────────────────────────────────────┐
│ CAPITAL SOCIAL                      ${formatMAD(data.passif.capital).padStart(15)} │
│ RÉSERVES                            ${formatMAD(data.passif.reserves).padStart(15)} │
│ RÉSULTAT DE L'EXERCICE              ${formatMAD(data.passif.resultat).padStart(15)} │
│ DETTES                              ${formatMAD(data.passif.dettes).padStart(15)} │
├─────────────────────────────────────────────────────────────┤
│ TOTAL PASSIF                        ${formatMAD(data.passif.total).padStart(15)} │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
                    Rapport généré automatiquement
                         par Konipa ERP
═══════════════════════════════════════════════════════════════
    `;
  }
  
  /**
   * Formate le rapport de compte de résultat
   */
  static formatCompteResultatReport(data) {
    return `
═══════════════════════════════════════════════════════════════
                     ${data.title}
═══════════════════════════════════════════════════════════════
Date d'édition: ${data.date}
Période: ${data.period}

▓▓▓ PRODUITS ▓▓▓

┌─────────────────────────────────────────────────────────────┐
│ VENTES DE MARCHANDISES              ${formatMAD(data.produits.ventes).padStart(15)} │
│ AUTRES PRODUITS                     ${formatMAD(data.produits.autres).padStart(15)} │
├─────────────────────────────────────────────────────────────┤
│ TOTAL PRODUITS                      ${formatMAD(data.produits.total).padStart(15)} │
└─────────────────────────────────────────────────────────────┘

▓▓▓ CHARGES ▓▓▓

┌─────────────────────────────────────────────────────────────┐
│ ACHATS DE MARCHANDISES              ${formatMAD(data.charges.achats).padStart(15)} │
│ CHARGES DE PERSONNEL                ${formatMAD(data.charges.personnel).padStart(15)} │
│ CHARGES EXTERNES                    ${formatMAD(data.charges.externes).padStart(15)} │
│ CHARGES FINANCIÈRES                 ${formatMAD(data.charges.financieres).padStart(15)} │
│ CHARGES EXCEPTIONNELLES             ${formatMAD(data.charges.exceptionnelles).padStart(15)} │
├─────────────────────────────────────────────────────────────┤
│ TOTAL CHARGES                       ${formatMAD(data.charges.total).padStart(15)} │
└─────────────────────────────────────────────────────────────┘

▓▓▓ RÉSULTAT ▓▓▓

┌─────────────────────────────────────────────────────────────┐
│ RÉSULTAT NET                        ${formatMAD(data.resultat).padStart(15)} │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
                    Rapport généré automatiquement
                         par Konipa ERP
═══════════════════════════════════════════════════════════════
    `;
  }
  
  /**
   * Formate le rapport de grand livre
   */
  static formatGrandLivreReport(data) {
    let report = `
═══════════════════════════════════════════════════════════════
                        ${data.title}
═══════════════════════════════════════════════════════════════
Date d'édition: ${data.date}
Période: ${data.period}

`;
    
    data.comptes.forEach(compte => {
      report += `
▓▓▓ COMPTE ${compte.numero} - ${compte.nom} ▓▓▓

`;
      report += `┌─────────────────────────────────────────────────────────────┐\n`;
      report += `│ Solde Débiteur                      ${formatMAD(compte.soldeDebiteur).padStart(15)} │\n`;
      report += `│ Solde Créditeur                     ${formatMAD(compte.soldeCrediteur).padStart(15)} │\n`;
      report += `└─────────────────────────────────────────────────────────────┘\n`;
    });
    
    report += `
▓▓▓ TOTAUX GÉNÉRAUX ▓▓▓

`;
    report += `┌─────────────────────────────────────────────────────────────┐\n`;
    report += `│ TOTAL DÉBIT                         ${formatMAD(data.totalDebit).padStart(15)} │\n`;
    report += `│ TOTAL CRÉDIT                        ${formatMAD(data.totalCredit).padStart(15)} │\n`;
    report += `└─────────────────────────────────────────────────────────────┘\n`;
    
    report += `
═══════════════════════════════════════════════════════════════
                    Rapport généré automatiquement
                         par Konipa ERP
═══════════════════════════════════════════════════════════════
`;
    
    return report;
  }
  
  /**
   * Formate le rapport de balance
   */
  static formatBalanceReport(data) {
    let report = `
═══════════════════════════════════════════════════════════════
                       ${data.title}
═══════════════════════════════════════════════════════════════
Date d'édition: ${data.date}
Période: ${data.period}

`;
    
    report += `┌─────────┬─────────────────────┬─────────────┬─────────────┬─────────────┬─────────────┐\n`;
    report += `│ COMPTE  │        NOM          │    DÉBIT    │   CRÉDIT    │ SOLDE DÉBIT │SOLDE CRÉDIT │\n`;
    report += `├─────────┼─────────────────────┼─────────────┼─────────────┼─────────────┼─────────────┤\n`;
    
    data.comptes.forEach(compte => {
      report += `│ ${compte.numero.padEnd(7)} │ ${compte.nom.padEnd(19)} │ ${formatMAD(compte.debit).padStart(11)} │ ${formatMAD(compte.credit).padStart(11)} │ ${formatMAD(compte.soldeDebit).padStart(11)} │ ${formatMAD(compte.soldeCredit).padStart(11)} │\n`;
    });
    
    report += `├─────────┼─────────────────────┼─────────────┼─────────────┼─────────────┼─────────────┤\n`;
    report += `│ TOTAUX  │                     │ ${formatMAD(data.totaux.debit).padStart(11)} │ ${formatMAD(data.totaux.credit).padStart(11)} │ ${formatMAD(data.totaux.soldeDebit).padStart(11)} │ ${formatMAD(data.totaux.soldeCredit).padStart(11)} │\n`;
    report += `└─────────┴─────────────────────┴─────────────┴─────────────┴─────────────┴─────────────┘\n`;
    
    report += `
═══════════════════════════════════════════════════════════════
                    Rapport généré automatiquement
                         par Konipa ERP
═══════════════════════════════════════════════════════════════
`;
    
    return report;
  }
  
  /**
   * Formate le rapport de trésorerie
   */
  static formatTresorerieReport(data) {
    return `
═══════════════════════════════════════════════════════════════
                     ${data.title}
═══════════════════════════════════════════════════════════════
Date d'édition: ${data.date}
Période: ${data.period}

▓▓▓ ENCAISSEMENTS ▓▓▓

┌─────────────────────────────────────────────────────────────┐
│ VENTES ENCAISSÉES                   ${formatMAD(data.encaissements.ventes).padStart(15)} │
│ AUTRES ENCAISSEMENTS                ${formatMAD(data.encaissements.autres).padStart(15)} │
├─────────────────────────────────────────────────────────────┤
│ TOTAL ENCAISSEMENTS                 ${formatMAD(data.encaissements.total).padStart(15)} │
└─────────────────────────────────────────────────────────────┘

▓▓▓ DÉCAISSEMENTS ▓▓▓

┌─────────────────────────────────────────────────────────────┐
│ ACHATS DÉCAISSÉS                    ${formatMAD(data.decaissements.achats).padStart(15)} │
│ SALAIRES                            ${formatMAD(data.decaissements.salaires).padStart(15)} │
│ CHARGES DIVERSES                    ${formatMAD(data.decaissements.charges).padStart(15)} │
│ IMPÔTS ET TAXES                     ${formatMAD(data.decaissements.impots).padStart(15)} │
├─────────────────────────────────────────────────────────────┤
│ TOTAL DÉCAISSEMENTS                 ${formatMAD(data.decaissements.total).padStart(15)} │
└─────────────────────────────────────────────────────────────┘

▓▓▓ VARIATION DE TRÉSORERIE ▓▓▓

┌─────────────────────────────────────────────────────────────┐
│ TRÉSORERIE DÉBUT PÉRIODE            ${formatMAD(data.tresorerieDebut).padStart(15)} │
│ VARIATION DE LA PÉRIODE             ${formatMAD(data.variation).padStart(15)} │
├─────────────────────────────────────────────────────────────┤
│ TRÉSORERIE FIN PÉRIODE              ${formatMAD(data.tresorerieFin).padStart(15)} │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
                    Rapport généré automatiquement
                         par Konipa ERP
═══════════════════════════════════════════════════════════════
    `;
  }
  
  /**
   * Télécharge un rapport en tant que fichier texte
   */
  static downloadReport(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
  
  /**
   * Génère et télécharge un rapport selon le type
   */
  static async generateAndDownload(reportType) {
    let content, filename;
    
    switch(reportType) {
      case 'bilan':
        content = await this.generateBilan();
        filename = 'bilan_comptable';
        break;
      case 'compte-resultat':
        content = await this.generateCompteResultat();
        filename = 'compte_resultat';
        break;
      case 'grand-livre':
        content = await this.generateGrandLivre();
        filename = 'grand_livre';
        break;
      case 'balance':
        content = await this.generateBalance();
        filename = 'balance_generale';
        break;
      case 'tresorerie':
        content = await this.generateTresorerie();
        filename = 'tableau_tresorerie';
        break;
      default:
        throw new Error(`Type de rapport non supporté: ${reportType}`);
    }
    
    this.downloadReport(content, filename);
    return content;
  }
}

export default ReportService;