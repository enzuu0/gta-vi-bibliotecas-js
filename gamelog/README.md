# GameLog — Meus jogos

**Aluno:** Enzo Montinegro · **Turma:** 1º DS

Atividade: criar um site de tema livre com CRUD completo e banco de dados Supabase.

O GameLog é uma coleção compartilhada de jogos. Cada registro tem nome, plataforma, status, nota opcional e observações. O site permite buscar por nome, filtrar por plataforma ou status e ordenar os registros. A interface funciona em computador e celular.

## Abrir o site

Abra `index.html` no navegador. A entrega já contém uma conexão configurada com uma tabela exclusiva no Supabase. É necessário acesso à internet. Os dados ficam no banco e continuam salvos depois de fechar ou atualizar a página.

Se preferir um servidor local, coloque a pasta em `htdocs` do XAMPP e abra `http://localhost/nome-da-pasta/`. Não é necessário instalar bibliotecas ou configurar PHP.

## Usar outro projeto Supabase

1. Abra seu projeto no painel do Supabase.
2. Entre em **SQL Editor**, crie uma consulta, cole o conteúdo inteiro de `banco.sql` e clique em **Run**.
3. Copie a **Project URL** e uma chave **publishable** em **Settings > API Keys** / **Connect**.
4. Abra `config.js` e substitua os valores `url` e `key`.
5. Abra `index.html`. O indicador no topo deve mostrar “Conectado ao Supabase”.

Use somente a chave pública publishable ou a antiga anon. Nunca coloque uma chave secret, service_role ou a senha do banco no JavaScript.

## Demonstrar o CRUD

| Operação | Como demonstrar | Requisição ao Supabase |
| --- | --- | --- |
| Create / criar | Clique em **Adicionar jogo**, preencha e salve | `POST` |
| Read / consultar | Veja a coleção e clique no nome para abrir os detalhes | `GET` |
| Update / editar | Clique em **Editar**, altere um campo e salve | `PATCH` com filtro pelo ID |
| Delete / excluir | Clique em **Excluir** e confirme | `DELETE` com filtro pelo ID |

Para verificar a persistência, adicione um jogo e atualize a página. Ele continuará aparecendo. No Supabase, consulte a tabela `gamelog_jogos_enzo` no Table Editor ou execute:

```sql
select * from public.gamelog_jogos_enzo order by criado_em desc;
```

## Arquivos

- `index.html`: estrutura e formulários.
- `style.css`: aparência e adaptação para celular.
- `script.js`: eventos, validação e operações do CRUD com `fetch`.
- `config.js`: URL e chave pública do Supabase.
- `banco.sql`: tabela, restrições, índice, RLS e policies para SELECT, INSERT, UPDATE e DELETE.
- `README.md`: instruções e roteiro de demonstração.
- `EXPLICACAO.txt`: explicação curta para apresentar o trabalho.

## Acesso aos dados

As quatro policies permitem acesso público, como solicitado no enunciado. Todos os visitantes compartilham os mesmos registros e podem criar, consultar, editar e excluir jogos. RLS está ativo; as permissões são restritas à tabela da atividade. O banco valida campos obrigatórios, tamanhos, opções de plataforma/status e notas entre 0 e 10. O cliente público não pode modificar IDs e datas de cadastro.

Esse modelo é para uma atividade acadêmica sem dados privados. Um sistema de coleções pessoais precisaria de login e policies que verificassem o dono de cada registro.

Os nomes e observações entram na interface por `textContent`, para que textos cadastrados não sejam executados como HTML ou JavaScript. O site só confirma uma gravação depois da resposta do Supabase. Em caso de erro, mantém os campos preenchidos para tentar novamente.

## Fontes técnicas

- https://supabase.com/docs/guides/api/creating-routes
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/api/api-keys
