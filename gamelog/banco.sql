-- GAMELOG | Atividade de CRUD com Supabase
-- Enzo Montinegro - 1º DS
-- Execute todo este arquivo no SQL Editor do seu projeto Supabase.
-- Esta é uma coleção pública acadêmica: visitantes podem alterar todos os jogos.
-- Use apenas dados de jogos. Não cadastre dados pessoais ou informações privadas.

begin;

create table if not exists public.gamelog_jogos_enzo (
    id uuid primary key default gen_random_uuid(),
    nome varchar(100) not null check (char_length(btrim(nome)) between 1 and 100),
    plataforma varchar(30) not null check (plataforma in ('PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Outra')),
    status varchar(20) not null default 'Quero jogar' check (status in ('Quero jogar', 'Jogando', 'Zerado', 'Platinado')),
    nota numeric(3,1) check (nota between 0 and 10),
    observacoes varchar(500) not null default '',
    criado_em timestamptz not null default now()
);

create index if not exists gamelog_jogos_enzo_criado_em_idx
    on public.gamelog_jogos_enzo (criado_em desc, id desc);

-- RLS permanece ativo. Cada operação tem sua própria policy.
alter table public.gamelog_jogos_enzo enable row level security;

-- Apenas esta tabela recebe acesso. IDs e datas não podem ser definidos
-- ou alterados pelo cliente público: o banco gera esses valores.
revoke all on public.gamelog_jogos_enzo from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select, delete on public.gamelog_jogos_enzo to anon, authenticated;
grant insert (nome, plataforma, status, nota, observacoes)
    on public.gamelog_jogos_enzo to anon, authenticated;
grant update (nome, plataforma, status, nota, observacoes)
    on public.gamelog_jogos_enzo to anon, authenticated;

drop policy if exists "gamelog_select_publico" on public.gamelog_jogos_enzo;
create policy "gamelog_select_publico"
    on public.gamelog_jogos_enzo for select to anon, authenticated
    using (true);

drop policy if exists "gamelog_insert_publico" on public.gamelog_jogos_enzo;
create policy "gamelog_insert_publico"
    on public.gamelog_jogos_enzo for insert to anon, authenticated
    with check (true);

drop policy if exists "gamelog_update_publico" on public.gamelog_jogos_enzo;
create policy "gamelog_update_publico"
    on public.gamelog_jogos_enzo for update to anon, authenticated
    using (true) with check (true);

drop policy if exists "gamelog_delete_publico" on public.gamelog_jogos_enzo;
create policy "gamelog_delete_publico"
    on public.gamelog_jogos_enzo for delete to anon, authenticated
    using (true);

-- Exemplos opcionais. Reexecutar o SQL não duplica os exemplos existentes.
insert into public.gamelog_jogos_enzo (nome, plataforma, status, nota, observacoes)
select v.nome, v.plataforma, v.status, v.nota, v.observacoes
from (values
    ('Cuphead', 'PC', 'Platinado', 10.0, 'Animação incrível e chefes desafiadores.'),
    ('Hollow Knight', 'Nintendo Switch', 'Jogando', 9.5, 'Explorando Hallownest.'),
    ('Stardew Valley', 'PC', 'Quero jogar', null, 'Um jogo para relaxar.'),
    ('Five Nights at Freddy''s', 'PlayStation', 'Zerado', 9.0, 'Cinco noites de muita tensão.')
) as v(nome, plataforma, status, nota, observacoes)
where not exists (
    select 1 from public.gamelog_jogos_enzo j
    where j.nome = v.nome and j.plataforma = v.plataforma
);

commit;

-- Consulta para conferir os dados:
select * from public.gamelog_jogos_enzo order by criado_em desc;
