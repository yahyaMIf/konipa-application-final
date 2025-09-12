# Guide de Tests Manuels - Application Konipa

## Vue d'ensemble
Ce guide fournit une liste de contrôles manuels pour vérifier que toutes les fonctionnalités de l'application Konipa fonctionnent correctement après l'intégration des nouveaux composants Documents et Substitutes.

## Prérequis
- Serveur backend démarré sur http://localhost:3001
- Serveur frontend démarré sur http://localhost:5173
- Base de données SQLite initialisée avec des données de test

## Tests d'Authentification

### ✅ Test 1: Connexion Utilisateur
1. Aller sur http://localhost:5173/login
2. Tenter une connexion avec des identifiants valides
3. Vérifier la redirection vers le tableau de bord approprié
4. Vérifier que le token d'authentification est stocké

**Résultat attendu:** Connexion réussie et redirection correcte

### ✅ Test 2: Déconnexion
1. Cliquer sur le bouton de déconnexion
2. Vérifier la redirection vers la page de connexion
3. Vérifier que le token est supprimé

**Résultat attendu:** Déconnexion complète et nettoyage de session

## Tests des Nouveaux Composants

### ✅ Test 3: Page Documents
1. Se connecter avec un utilisateur ayant les droits (admin, compta, commercial, ceo)
2. Naviguer vers `/documents`
3. Vérifier que la page se charge sans erreur
4. Vérifier l'affichage de la liste des documents

**Résultat attendu:** Page Documents accessible et fonctionnelle

### ✅ Test 4: Création de Document
1. Sur la page Documents, cliquer sur "Nouveau Document"
2. Remplir le formulaire avec des données valides
3. Soumettre le formulaire
4. Vérifier que le document apparaît dans la liste

**Résultat attendu:** Document créé et visible dans la liste

### ✅ Test 5: Modification de Document
1. Cliquer sur un document existant
2. Modifier les informations
3. Sauvegarder les modifications
4. Vérifier que les changements sont persistés

**Résultat attendu:** Modifications sauvegardées correctement

### ✅ Test 6: Suppression de Document
1. Sélectionner un document
2. Cliquer sur supprimer
3. Confirmer la suppression
4. Vérifier que le document n'apparaît plus dans la liste

**Résultat attendu:** Document supprimé de la base de données

### ✅ Test 7: Page Substitutes
1. Naviguer vers `/substitutes`
2. Vérifier que la page se charge sans erreur
3. Vérifier l'affichage de la liste des substituts

**Résultat attendu:** Page Substitutes accessible et fonctionnelle

### ✅ Test 8: Substitutes avec Paramètre Produit
1. Naviguer vers `/substitutes/123` (avec un ID de produit)
2. Vérifier que les substituts du produit spécifique sont affichés
3. Vérifier le filtrage par produit

**Résultat attendu:** Substituts filtrés par produit correctement

### ✅ Test 9: Création de Substitute
1. Sur la page Substitutes, cliquer sur "Nouveau Substitute"
2. Remplir le formulaire avec des données valides
3. Soumettre le formulaire
4. Vérifier que le substitute apparaît dans la liste

**Résultat attendu:** Substitute créé et visible dans la liste

## Tests d'Intégration

### ✅ Test 10: Navigation entre Pages
1. Tester la navigation depuis le menu principal
2. Vérifier les liens vers Documents et Substitutes
3. Tester les boutons de retour

**Résultat attendu:** Navigation fluide sans erreurs

### ✅ Test 11: Permissions d'Accès
1. Se connecter avec différents rôles d'utilisateur
2. Vérifier l'accès aux pages selon les permissions
3. Tester les restrictions d'accès

**Résultat attendu:** Contrôle d'accès fonctionnel selon les rôles

### ✅ Test 12: Responsive Design
1. Tester l'application sur différentes tailles d'écran
2. Vérifier l'affichage mobile des nouveaux composants
3. Tester les interactions tactiles

**Résultat attendu:** Interface responsive et utilisable sur mobile

## Tests de Performance

### ✅ Test 13: Temps de Chargement
1. Mesurer le temps de chargement des pages Documents et Substitutes
2. Vérifier les performances avec de grandes listes
3. Tester le lazy loading si implémenté

**Résultat attendu:** Temps de chargement acceptables (<3 secondes)

### ✅ Test 14: Gestion des Erreurs
1. Tester avec des données invalides
2. Simuler des erreurs réseau
3. Vérifier l'affichage des messages d'erreur

**Résultat attendu:** Gestion gracieuse des erreurs avec messages informatifs

## Tests Backend

### ✅ Test 15: API Documents
1. Tester les endpoints `/api/documents`
2. Vérifier les opérations CRUD
3. Tester la validation des données

**Résultat attendu:** API fonctionnelle avec validation appropriée

### ✅ Test 16: API Substitutes
1. Tester les endpoints `/api/substitutes`
2. Vérifier les opérations CRUD
3. Tester le filtrage par produit

**Résultat attendu:** API fonctionnelle avec filtrage correct

### ✅ Test 17: Base de Données
1. Vérifier la création des tables Documents et Substitutes
2. Tester les relations entre tables
3. Vérifier l'intégrité des données

**Résultat attendu:** Structure de base de données correcte et cohérente

## Tests de Sécurité

### ✅ Test 18: Authentification API
1. Tester l'accès aux API sans token
2. Vérifier la validation des tokens
3. Tester l'expiration des sessions

**Résultat attendu:** Sécurité API appropriée avec authentification requise

### ✅ Test 19: Validation des Entrées
1. Tester avec des données malformées
2. Vérifier la protection contre l'injection SQL
3. Tester la validation côté client et serveur

**Résultat attendu:** Validation robuste des entrées utilisateur

## Tests de Régression

### ✅ Test 20: Fonctionnalités Existantes
1. Vérifier que le catalogue de produits fonctionne toujours
2. Tester le panier et les commandes
3. Vérifier les tableaux de bord existants

**Résultat attendu:** Aucune régression sur les fonctionnalités existantes

### ✅ Test 21: Intégration Complète
1. Effectuer un workflow complet utilisateur
2. Tester l'interaction entre anciens et nouveaux composants
3. Vérifier la cohérence de l'interface utilisateur

**Résultat attendu:** Intégration harmonieuse sans conflits

## Checklist de Validation Finale

- [ ] Tous les tests d'authentification passent
- [ ] Les nouveaux composants Documents fonctionnent
- [ ] Les nouveaux composants Substitutes fonctionnent
- [ ] La navigation est fluide
- [ ] Les permissions d'accès sont respectées
- [ ] L'interface est responsive
- [ ] Les performances sont acceptables
- [ ] La gestion d'erreurs fonctionne
- [ ] Les APIs backend répondent correctement
- [ ] La base de données est cohérente
- [ ] La sécurité est maintenue
- [ ] Aucune régression détectée

## Rapport de Tests

### Date: ___________
### Testeur: ___________
### Version: ___________

### Résultats:
- Tests réussis: ___/21
- Tests échoués: ___/21
- Tests non applicables: ___/21

### Problèmes identifiés:
1. ________________________________
2. ________________________________
3. ________________________________

### Recommandations:
1. ________________________________
2. ________________________________
3. ________________________________

### Validation finale:
- [ ] Application prête pour la production
- [ ] Corrections mineures nécessaires
- [ ] Corrections majeures requises

**Signature du testeur:** ___________________
**Date de validation:** ___________________