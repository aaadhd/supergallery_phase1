-- Supabase SQL 에디터에서 실행 (또는 migration으로 적용)
-- 프로젝트: Table Editor에서 works 테이블을 만들어도 되고, 아래를 한 번에 실행해도 됩니다.

create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists works_created_at_idx on public.works (created_at desc);

alter table public.works enable row level security;

-- 익명(anon) 키로 피드 읽기 (브라우저 클라이언트)
drop policy if exists "works_select_public" on public.works;
create policy "works_select_public" on public.works for select using (true);

-- 인증된 사용자만 직접 insert (나중에 업로드 연동 시). 테스트만 하려면 임시로 anon insert 정책을 추가할 수 있음.
drop policy if exists "works_insert_authenticated" on public.works;
create policy "works_insert_authenticated" on public.works
  for insert to authenticated
  with check (true);

-- 예시 행 (이미지는 공개 URL 권장). Table Editor의 JSON에 붙여넣기용으로도 사용 가능.
-- insert into public.works (payload) values
-- (
--   '{
--     "id": "sb-demo-1",
--     "title": "Supabase에서 불러온 작품",
--     "image": "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800",
--     "artistId": "demo-1",
--     "artist": {
--       "id": "demo-1",
--       "name": "데모 작가",
--       "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
--     },
--     "likes": 0,
--     "saves": 0,
--     "comments": 0,
--     "feedReviewStatus": "approved"
--   }'::jsonb
-- );
