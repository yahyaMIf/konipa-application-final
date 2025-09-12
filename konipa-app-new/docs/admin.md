Compte Administrateur (Directeur) - "Tour de Contrôle 360°"
Objectif : Être le centre de contrôle absolu et le tableau de bord stratégique de la plateforme. Le Directeur a un accès total à toutes les données et tous les outils.

Interface : MainLayout avec un menu de navigation latéral très complet ou une barre de navigation supérieure complexe, donnant accès à toutes les sections. Le design reste dans la charte Konipa (sombre, dégradés bleu/rouge pour les éléments d'action).

Page d'Accueil / Tableau de Bord Administrateur (/admin/dashboard)
Cette page est le "Pulse" de l'entreprise en ligne. Elle doit donner une vue d'ensemble immédiate et des indicateurs clés.

Message de bienvenue personnalisé : "Bonjour, Youssef/Boudali !"
Widgets Clés (en haut, disposés en grille ou en bandeau) :
Nombre total d'utilisateurs actifs (clients).
Nombre de commandes passées aujourd'hui/ce mois.
Chiffre d'Affaires (CA) généré aujourd'hui/ce mois.
Nombre de commandes en attente de validation (Comptabilité).
Nombre de commandes en cours de préparation (Comptoir).
Alertes :
Nombre de clients actuellement bloqués.
Nombre de demandes d'augmentation de plafond en attente.
Nombre de formulaires de "Demande de création de compte" soumis par des prospects.
Graphiques et Rapports Stratégiques (en dessous des widgets) :
Graphique d'évolution du CA (Journalier, Mensuel, Trimestriel).
Top produits vendus (globalement).
Top familles/catégories de produits vendues.
Performance des Représentants (graphique de classement par CA généré).
Carte de répartition géographique des commandes (si l'info est disponible/exploitable).
Dernières Activités :
Liste des derniers comptes créés.
Liste des dernières commandes passées sur la plateforme.
Liste des dernières actions importantes (validation commande, blocage client).
Section "Gestion des Utilisateurs" (/admin/users)
C'est ici que le Directeur gère la communauté du portail.

Tableau de bord des utilisateurs :
Liste complète de tous les utilisateurs (Clients, Représentants, Comptoir, Compta).
Colonnes clés : Nom, Email, Rôle, Date d'Inscription, Dernière Connexion, Statut (Actif/Inactif/Bloqué), CA Généré, Encours, Impayés.
Filtrage/Recherche : Très puissant. Recherche par nom, email, rôle. Filtres prédéfinis (Clients bloqués, Représentants, Actifs/inactifs).
Actions sur les Utilisateurs (via boutons/actions dans chaque ligne du tableau ou via un menu "Actions") :
Créer un nouvel utilisateur : Formulaire pour ajouter un Client, Représentant, Compta, ou Comptoir.
Modifier un utilisateur : Changer le rôle, les informations de contact, le statut (actif/inactif).
Bloquer/Débloquer un client : Action directe. Met à jour le statut dans le portail (et peut influencer le statut dans Sage via une logique spécifique si intégrée).
Supprimer un utilisateur : (Avec confirmation).
Lier manuellement un compte web à une fiche client Sage : Permet d'associer un email/portail à un code_client dans Sage.
Attribuer des clients à des Représentants : Interface pour gérer le portefeuille.
"Voir le Dashboard 360° Client" : En cliquant sur un utilisateur de type Client, accéder directement à sa vue détaillée.
Gestion des Demandes de Création de Compte :
Liste des formulaires de demande soumis par des prospects via le portail.
Actions : Valider (crée le compte), Refuser, Contacter le demandeur.
Section "Gestion des Produits & Catalogue" (/admin/products)
Le Directeur pilote l'offre.

Liste des produits :
Vue complète du catalogue (référence, désignation, prix de base HT, famille).
Recherche/Filtrage avancé.
Actions sur les Produits :
Ajouter un nouveau produit.
Modifier un produit existant.
Supprimer un produit.
Gestion des Substituts :
Interface pour associer manuellement jusqu'à 5 références de substitut à un produit de base. (Basé sur le fichier PDF que vous fournirez).
Gestion des Offres Spéciales :
Créer des promotions limitées dans le temps ou par stock/client.
Définir des plafonds de quantité maximum par client pour un produit spécifique.
Visualisation des Stocks :
Voir les niveaux de stock en temps réel, par entrepôt (Ibn Tachfine, Drb Omar, La Villette), provenant de Sage.
Section "Gestion des Commandes" (Vue Globale) (/admin/orders)
Vue panoramique de toute l'activité commande.

Liste de toutes les commandes de tous les clients.
Colonnes : Numéro de commande, Client, Date, Montant, Statut actuel.
Filtrage/Tri : Par client, par statut, par date, par représentant (si la commande a été passée par un rep).
Actions :
Voir le détail de n'importe quelle commande.
Suivre l'historique complet des statuts et des actions (qui a validé, qui a préparé).
Forcer un changement de statut (si nécessaire, bien que le workflow standard soit préférable).
Section "Vue Client 360°" (/admin/client/:id)
C'est ici que le Directeur a accès à la fiche complète d'un client, fusionnant données Sage et données Portail.

Onglets ou Sections :
Informations :
Données de l'entreprise (synchronisées depuis Sage : adresse, contact).
Données du compte portail (email, date inscription).
Données Financières (Sage) :
Encours Actuel.
Montant des Impayés.
Plus ancienne facture impayée.
Plafond de Crédit.
Historique des paiements (résumé).
Historique des Commandes (Portail) :
Liste de toutes les commandes passées par ce client.
CA total généré par ce client.
Historique des Documents (Sage/Portail) :
Liste des factures et Bons de Livraison.
Activité Web (Portail) :
Date de la dernière connexion.
Nombre de paniers abandonnés.
Produits les plus consultés/commandés.
Notes Internes :
Zone de texte pour ajouter des commentaires privés sur ce client.
Actions :
Bloquer/Débloquer le client.
Modifier le Plafond de Crédit.
Attribuer une Remise Personnalisée.
Définir un Plafond de Stock pour un Produit Spécifique.
Envoyer un Message Direct (via l'outil de marketing).
Section "Outils Marketing & Communication" (/admin/marketing)
Pour animer la plateforme et communiquer.

Envoi de Messages Ciblés :
Interface pour sélectionner un ou plusieurs groupes de clients (ou des clients individuels).
Rédaction d'un message (texte).
Choix du canal (WhatsApp, SMS, Email).
Envoi en masse ou ciblé.
Historique des campagnes envoyées.
Gestion des Bannières/Promotions :
(Optionnel) Interface pour gérer les visuels/bannières affichées sur les pages publiques ou dans le Dashboard Client.
Section "Paramètres & Configuration" (/admin/settings)
Pour gérer le fonctionnement interne du portail.

Gestion des Transporteurs :
Liste des transporteurs proposés (Ghazala, sh2t, Baha).
Ajouter/Modifier/Supprimer.
Configuration de la Synchro Sage :
Activer/Désactiver le mode Mock/Réel.
Voir l'état de la connexion.
(Avancé) Configurer l'URL de l'API Sage et la clé API.
Gestion des Rôles & Permissions :
(Très avancé) Définir finement les permissions si nécessaire (au-delà des rôles de base).
Gestion des Demandes de Mot de Passe :
Voir les demandes de réinitialisation et les traiter.
Section "Analyse & Rapports" (/admin/analytics)
Pour prendre des décisions basées sur les données.

Rapports détaillés :
CA par période, par famille, par client.
Performance des Représentants.
Taux de conversion (visites -> panier -> commande).
Produits les plus/moins vendus.
Clients dormants.
Recherches fréquentes sans résultat (pour adapter l'assortiment).
Export de données :
Possibilité d'exporter des rapports au format Excel/CSV.
Contrôle Absolu & Sécurité
Accès total à toutes les fonctionnalités et données de la plateforme.
Journal d'audit (Traçabilité) : (Fonctionnalité avancée) Voir un historique des actions importantes effectuées par tous les utilisateurs (création/modification/suppression de données critiques).
Gestion de son propre compte : Modifier ses informations personnelles et son mot de passe.