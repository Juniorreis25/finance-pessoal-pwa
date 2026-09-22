# Supabase database workflow

Schema changes belong in timestamped SQL migrations under `migrations/`. The files in Git and Supabase's applied migration ledger are separate records; keep them aligned before applying future changes.

## Production reconciliation checkpoint — 2026-09-21

Read-only inspection of the active `finance_pessoal_v2` project found:

- The public schema has `cards`, `transactions`, `categories`, `recurring_expenses`, and `user_profiles`, with RLS enabled on each table.
- The policies on those tables scope access to `auth.uid() = user_id`; transaction insert/update policies also verify card ownership. The installment RPC is `SECURITY INVOKER`.
- The remote migration ledger contains `20260920192325_secure_rls_storage_and_rpc` and `20260920192421_secure_avatar_storage`.
- This repository also contains older migration files, beginning with `01_initial_schema.sql`, that are absent from the remote ledger. The table and column metadata includes fields expected by those migrations, but that does not prove that every constraint, function, trigger, and policy matches the files.
- Supabase Performance Advisor reports missing indexes for the foreign keys `cards.user_id`, `transactions.user_id`, and `transactions.card_id`.

No SQL was applied during this inspection. Do not run `supabase db push` against production until the existing database has been captured and the older local migration history has been reconciled. Reapplying legacy migrations could conflict with objects that already exist.

## Safe reconciliation sequence

1. Set up and authenticate the Supabase CLI, then link `web/` to the verified production project.
2. Compare local and remote status with `supabase migration list`.
3. Follow Supabase's existing-project workflow to capture the remote schema in a migration and review it against the tracked files.
4. Reconcile the migration ledger only for versions whose effects have been verified in the remote schema. `migration repair` changes tracking; it does not run the migration SQL.
5. Apply future changes through reviewed migration files. Test them against a local database before pushing them to a remote environment.

The legacy `01_initial_schema.sql` filename does not use the timestamped format expected for new migrations. Preserve its history while normalizing the migration set as part of reconciliation; do not simply replay or rename it on production.

The CLI and local Supabase configuration are not present in this checkout yet. The first setup should follow Supabase's [migration workflow](https://supabase.com/docs/guides/local-development/database-migrations) and [existing-project workflow](https://supabase.com/docs/guides/local-development/cli-workflows).

## Performance follow-up

Dashboard reads are now bounded to the selected year and the following month, and the transaction history query is bounded to the selected month. Both select only the columns needed by the UI and use stable date/id ordering for range pagination.

The advisor's foreign-key findings need query-plan and table-size review before index DDL is added. In particular, the dashboard and history access pattern may benefit from a composite transaction index rather than a standalone `user_id` index. Track any index change in a new migration after confirming the baseline above.
