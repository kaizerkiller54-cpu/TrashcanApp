# Spécification de Sécurité - Eco-Trieur IA

## 1. Invariants de Données
- Un utilisateur ne peut créer, modifier ou lire que son propre profil (`/users/{userId}`).
- Un utilisateur ne peut voir, insérer ou supprimer que ses propres scans de déchets dans son sous-chemin (`/users/{userId}/scans/{scanId}`).
- Pendant l'inscription ou la mise à jour, le type des champs doit être rigoureusement validé.
- Les timestamps de scan sont validés au niveau du serveur (`request.time`).
- La modification d'un scan existant est modifiable uniquement via les règles d'intégrité définies (ou interdite, car un scan est un enregistrement historique immuable).

## 2. Charge de Tests ("Dirty Dozen" Payloads)
Voici 12 scénarios d'attaque qui doivent être bloqués par nos règles de sécurité :
1. **Lecture anonyme globale** : Tentative de lire l'ensemble de la collection `/users` sans être authentifié.
2. **Usurpation d'identité d'enregistrement** : Insérer un profil utilisateur pour `/users/victim_uid` alors que l'attaquant a le UID `evil_uid`.
3. **Ghost fields dans le profil** : Insérer un profil contenant des champs additionnels non déclarés (ex: `isAdmin: true` ou `credits: 9999`).
4. **Lecture étrangère de scans** : L'utilisateur `evil_uid` tente de lister les scans de l'utilisateur `victim_uid`.
5. **Création de scan étranger** : L'utilisateur `evil_uid` tente d'ajouter un scan de déchet directement dans la liste de `/users/victim_uid/scans`.
6. **Contournement de la date de création par le client** : Fournir une date de création falsifiée dans le passé ou le futur au lieu d'utiliser `request.time`.
7. **Modification rétroactive historique** : Tenter d'éditer la méthode de recyclage d'un scan historique déjà validé.
8. **Nom d'utilisateur vide** : Tenter de s'enregistrer avec un `userName` vide ou trop long (plus de 128 caractères).
9. **Email non vérifié ou incorrect** : Tenter de l'associer avec une adresse email incorrecte.
10. **ID de scan empoisonné** : Injecter un ID de scan de plus de 1.5 Ko contenant des caractères malveillants (ex: script d'injection standard).
11. **Dépassement de la taille limite du tableau** : Insérer une liste d'étapes de préparation trop importante (Déni de portefeuille).
12. **Effacement du profil par un tiers** : Un utilisateur non propriétaire tentant de détruire un profil `/users/{userId}`.

## 3. Configuration des Tests
Tous ces scénarios renverront un résultat `PERMISSION_DENIED` grâce aux expressions d'accès conditionnelles de Firestore.
