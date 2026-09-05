# Gates: Product Demo dashboard foundation

OWNS: GATES.md, apps/app/app/_components/DashboardShell.tsx, apps/app/app/dashboard/product-demo/**, apps/app/app/api/product-demo/**, apps/app/features/product-demo/**, apps/app/infrastructure/supabase/database.types.ts, apps/app/supabase/migrations/20260829000000_create_product_demo_projects.sql, apps/app/supabase/migrations/20260829020000_create_product_demo_scenes.sql

Scope: Persist Product Demo setup and its generated storyboard scenes through user-owned server actions.

- [x] G1: this ledger states outcomes that can fail
  CHECK: node /home/juanalma/projects/visuala/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.md
  EXPECT: LINT OK
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/juanalma/projects/visuala; path=c088c8204e39/23 entries; EXPECT=matched; output-sha256=48630b7361dd44ee870917b12c3d19b9d7bdea738aaca16bb04d4cab83b772d2; output-bytes=8

- [x] G2: Product Demo dashboard code passes lint
  CHECK: pnpm app:lint && node -e "console.log('product-demo lint passed')"
  EXPECT: product-demo lint passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/juanalma/projects/visuala; path=c088c8204e39/23 entries; EXPECT=matched; output-sha256=2cc723ebb86aa8999eca98608142a87fbc9f94aecac03ca40ba3ad351901d0f0; output-bytes=800

- [x] G3: Product Demo dashboard code type-checks
  CHECK: pnpm --filter app exec tsc --noEmit && node -e "console.log('product-demo typecheck passed')"
  EXPECT: product-demo typecheck passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/juanalma/projects/visuala; path=c088c8204e39/23 entries; EXPECT=matched; output-sha256=12b50ceb6679411fdca714183cc02381b38ed8d4906d0a295f15700163ab1954; output-bytes=30
