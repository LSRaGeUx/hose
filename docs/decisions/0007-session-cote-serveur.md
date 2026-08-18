# 0007. Session résolue sur le serveur à chaque navigation

Statut : acceptée

## Contexte

En 2024, l’état de connexion venait de `sessionStorage` et la décision était
prise dans le navigateur. Le serveur croyait ce que le client affirmait, donc
toutes les routes du backend étaient de fait publiques.

## Décision

Better Auth, session lue depuis les en-têtes de la requête par le `beforeLoad`
de la route racine, à chaque navigation. Une route de mise en page sans chemin,
`_authed`, protège tout ce qui est imbriqué dessous.

## Conséquences

- Une garde ne fait jamais confiance au client.
- La redirection a lieu avant le loader et avant tout rendu.
- Le `beforeLoad` de `_authed` renvoie `user`, ce qui restreint le type pour
  toutes les routes filles : sous ce point, `user` est défini par construction.
- Le paramètre `redirect` n’accepte qu’un chemin relatif, et refuse `//`, sinon
  il devient une redirection ouverte.
- Coût : une résolution de session par navigation. Acceptable, et c’est ce qui
  rend la garantie réelle plutôt que déclarative.
