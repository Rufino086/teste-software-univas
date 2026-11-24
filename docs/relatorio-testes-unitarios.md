# Relatório — testes de integração (Aula 12)

**Projeto:** teste-software-univas
**Ferramenta:** Codex
**Base do oráculo:** `docs/especificacao.md` (API01–API05, RN02, RN03, RN04, RF08 e RF09)

## Parte A — casos de integração do backend

| Regra / # | Estado inicial | Requisição | Resposta esperada | Efeito no banco |
|---|---|---|---|---|
| API03-1 / RN02 | Categoria sem tarefas | `DELETE /api/categories/:id` | 200, `{ success: true, message: ... }` | Categoria removida |
| API03-2 / RN02 | Categoria com 1 tarefa | `DELETE /api/categories/:id` | 400, `{ success: false, error: ... }` | Categoria e tarefa mantidas |
| API03-3 / RN02 | ID inexistente | `DELETE /api/categories/inexistente` | 404, `{ success: false, error: ... }` | Nenhum registro criado ou removido |
| API04-1 / RN03 | Nenhuma categoria com nome `Estudos` | `POST /api/categories` com `{ name: "Estudos" }` | 201, `{ success: true, data: ... }` | Categoria criada com esse nome |
| API04-2 / RN03 | Categoria existente chamada ` trabalho ` | `POST /api/categories` com `{ name: "Trabalho" }` | 409, `{ success: false, error: ... }` | Nenhuma nova categoria; total permanece 1 |
| API05-1 / RN01 e RN04 | Tarefa `PENDING` | `PUT /api/tasks/:id` com `{ status: "IN_PROGRESS" }` | 200, `{ success: true, data: ... }` | Status gravado como `IN_PROGRESS` |
| API05-2 / RN01 e RN04 | Tarefa `COMPLETED` | `PUT /api/tasks/:id` com `{ status: "PENDING" }` | 400, `{ success: false, error: ... }` | Status continua `COMPLETED` |
| API05-3 / RN04 | Tarefa inexistente | `PUT /api/tasks/inexistente` com `{ status: "IN_PROGRESS" }` | 404, `{ success: false, error: ... }` | Nenhuma tarefa criada |
| API02-1 / API02 (caso adicional para a sabotagem) | Um usuário e uma tarefa associada | `GET /api/users` | 200, `{ success: true, count: 1, data: [...] }`, tarefa incluída no usuário | Os 1 usuário e 1 tarefa persistem |

**Relação teste → caso:** `categories.int.test.ts`: API03-1, API03-2, API03-3, API04-1 e API04-2. `tasks.int.test.ts`: API05-1, API05-2 e API05-3. `users.int.test.ts`: API02-1 e os dois testes de referência API01.

## Parte B — casos de integração do frontend

| Requisito / # | Estado inicial (handler MSW) | Ação | Resultado esperado na tela | Requisição enviada |
|---|---|---|---|---|
| RF08-1 | `GET /api/users` responde `{ success: true, count: 0, data: [] }`; POST responde 201 com `{ success: true, data: usuário }`; GET seguinte inclui o usuário | Abrir formulário, preencher Nome e Email e clicar Criar | Formulário fecha; uma linha mostra `Bruna Lima`, `bruna@email.com` e `0` tarefas | POST `/api/users`, JSON `{ name: "Bruna Lima", email: "bruna@email.com" }`; depois GET `/api/users` |
| RF09-1 | GET responde lista vazia; POST responde 409 com `{ success: false, error: "Email already exists" }` | Abrir formulário, preencher e clicar Criar | Mensagem `Email já cadastrado`; formulário continua aberto e mantém os valores | POST `/api/users`, JSON `{ name: "Bruna Lima", email: "bruna@email.com" }` |

**Relação teste → caso:** `Users.create.int.test.tsx`: RF08-1 e RF09-1. Os handlers usam as estruturas do contrato e o corpo de POST é lido por `await request.json()`.

## Parte C — execução e revisão

| Verificação / problema encontrado | Ajuste ou resultado |
|---|---|
| Revisão de isolamento backend | Os novos testes usam `request(app)`, `resetDb()` no `beforeEach`, `prisma.$disconnect()` no `afterAll` e criam seus próprios registros. Não usam `vi.mock` nem `vi.spyOn`. |
| Revisão dos efeitos no banco | Os casos backend verificam status, formato de resposta e estado do banco com Prisma; API02-1 também verifica o conjunto preparado. |
| Revisão dos handlers frontend | Handlers por teste com MSW; nenhum `vi.mock` ou `vi.spyOn(api)`. O POST lê e o teste confere o corpo. Não foi necessário ajuste. |
| Revisão das linhas da tabela | Frontend localiza e confere os dados da mesma linha com `within(linha)`. |
| API02 não verificava tarefas não vazias na referência | Acrescentado API02-1 em `users.int.test.ts`, para que a remoção do `include.tasks` seja detectada. |
| `docker compose up -d postgres` | Container iniciou. O banco recusou a senha do projeto com P1000 ao preparar `teste_software_test_db`; não alterei URL, configuração ou volume. |
| `npx prisma generate` | Não concluiu: o processo ficou sem saída e foi interrompido. O Node instalado é v22.17.0, enquanto o `package.json` declara Node >=26. |
| `backend npm run test:integration` | Bloqueado no `globalSetup`, antes de executar testes: P1000 (credenciais PostgreSQL inválidas). Portanto nenhum resultado individual backend foi obtido. |
| `frontend npm run test:integration` final, sem sabotagem | 2 testes aprovados e 1 falha esperada (`it.fails`); 2 arquivos passaram. A sabotagem RF08 também foi executada e revertida, mas a suíte com sabotagem teve 1 falha real. |

## Parte D — sabotagens controladas

| Sabotagem | Resultado observado | Reversão / cobertura |
|---|---|---|
| Remover checagem `canDeleteCategory` em `categoryController.ts` (API03) | A suíte backend foi iniciada, mas o setup falhou com P1000 antes da execução; não foi possível observar detecção. | Revertida manualmente. API03-2 é o caso que detecta a remoção. |
| Trocar status 409 por 400 em `userController.ts` (API01) | P1000 impediu a execução; não foi possível observar detecção. | Revertida manualmente. O teste de referência API01 `responde 409 ao repetir um email já cadastrado` verifica status, corpo e ausência de novo registro. |
| Remover `include: { tasks: ... }` de `getUsers` (API02) | P1000 impediu a execução; não foi possível observar detecção. | Revertida manualmente. API02-1 foi adicionado para garantir detecção por presença da tarefa na resposta. |
| Remover `fetchUsers()` após salvar (RF08) | Detectada: RF08-1 falhou ao não encontrar a nova linha `Bruna Lima` após o POST 201. | Revertida manualmente; execução final sem sabotagem voltou ao resultado esperado. |

`git restore src/` foi tentado após a primeira sabotagem, mas a escrita em `.git/index` foi negada pelo ambiente. As quatro alterações temporárias em `src/` foram desfeitas por patches equivalentes; `git diff -- src/` e `git status` devem confirmar que não restaram alterações em produção.

## Defeitos encontrados

| Regra | Comportamento especificado | Comportamento observado no código/teste | Teste |
|---|---|---|---|
| API04 / RN03 | Nomes que coincidem após normalização devem responder 409 e não criar duplicata. | O controller não aplica `normalizeName`; no banco, `" trabalho "` e `"Trabalho"` são valores distintos e podem ser inseridos. | API04-2 (`it.fails`) |
| API05 / RN01 e RN04 | Transição proibida deve responder 400 e manter status. | O controller atualiza o status sem verificar `canTransition`; `COMPLETED` pode ser alterado para `PENDING`. | API05-2 (`it.fails`) |
| RF09 | HTTP 409 deve exibir `Email já cadastrado` e preservar formulário/dados. | `Users` define a mensagem genérica `Erro ao salvar usuário`; a mensagem requerida não é exibida. | RF09-1 (`it.fails`) |

As falhas de API04-2 e API05-2 não puderam ser confirmadas por execução real devido ao P1000 do banco. Foram marcadas com `it.fails` com base na divergência visível entre o contrato e o fluxo de produção; RF09-1 teve falha esperada observada na suíte frontend.
