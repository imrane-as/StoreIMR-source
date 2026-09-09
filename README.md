# StoreIMR

Boutique Next.js avec catalogue public, pages produit, liens Vinted et espace d'administration sécurisé.

## Activation de l'administration

1. Créer un projet gratuit sur Supabase.
2. Ouvrir **SQL Editor**, copier le contenu de `supabase/setup.sql` et cliquer sur **Run**.
3. Dans **Authentication > Users**, créer l'utilisateur propriétaire avec son email et son mot de passe.
4. Dans Vercel, ouvrir **Settings > Environment Variables** et ajouter :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAIL` (le même email que l'utilisateur créé)
   - `OPENAI_API_KEY` (clé secrète pour l’assistant de rédaction IA)
5. Relancer le déploiement, puis ouvrir `/admin`.

La clé `SUPABASE_SERVICE_ROLE_KEY` doit rester secrète et ne doit jamais être copiée dans un fichier GitHub.
