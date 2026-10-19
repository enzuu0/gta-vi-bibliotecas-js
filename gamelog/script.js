'use strict';

// Cada operação envia uma requisição à API REST do Supabase.
const config = window.GAMELOG_CONFIG || {};
const TABLE = 'gamelog_jogos_enzo';
const $ = (id) => document.getElementById(id);
let games = [];
let activeStatus = '';
let editingId = null;
let selectedId = null;
let deleteId = null;
let saving = false;
let deleting = false;
let loading = false;
let toastTimer;
const statusClasses = {'Jogando':'badge-playing','Zerado':'badge-finished','Platinado':'badge-platinum'};
const dateFormat = new Intl.DateTimeFormat('pt-BR', {day:'2-digit',month:'short',year:'numeric'});

function notify(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => {$('toast').hidden = true;}, 4000);
}

function setConnection(online) {
  const el = $('connection');
  el.className = 'connection ' + (online ? 'online' : 'offline');
  el.replaceChildren();
  el.append(document.createElement('span'), document.createTextNode(online ? 'Conectado ao Supabase' : 'Sem conexão'));
}

function readableError(error) {
  if (error.code === 'PGRST205' || error.code === '42P01') return 'A tabela ainda não existe. Execute o arquivo banco.sql no SQL Editor do Supabase.';
  if (error.code === '42501' || error.status === 403) return 'O banco recusou o acesso. Confira as permissões e as quatro policies do arquivo banco.sql.';
  if (error.status === 401) return 'A chave pública do Supabase não é válida. Confira o arquivo config.js.';
  if (error.name === 'TimeoutError' || error.name === 'AbortError') return 'O banco demorou para responder. Tente novamente.';
  if (error instanceof TypeError) return 'Não foi possível acessar o Supabase. Confira sua conexão com a internet.';
  return error.message || 'Ocorreu um erro. Tente novamente.';
}

async function api(method = 'GET', query = '', body) {
  if (!config.url || !config.key) throw new Error('Preencha a URL e a chave pública do Supabase no arquivo config.js.');
  if (config.key.startsWith('sb_secret_')) throw new Error('Use somente uma chave publishable ou anon no arquivo config.js.');
  const response = await fetch(`${config.url.replace(/\/$/, '')}/rest/v1/${TABLE}${query}`, {
    method,
    headers: {apikey: config.key, 'Content-Type': 'application/json', Prefer: 'return=representation'},
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000)
  });
  const text = await response.text();
  let result;
  try { result = text ? JSON.parse(text) : []; } catch { throw new Error('O banco retornou uma resposta inesperada. Tente novamente.'); }
  if (!response.ok) throw Object.assign(new Error(result.message || 'Não foi possível concluir a operação.'), result, {status:response.status});
  return result;
}

async function loadGames() {
  if (loading) return;
  loading = true;
  $('refresh').disabled = true;
  $('load-error').hidden = true;
  $('loading').hidden = false;
  $('table-wrap').hidden = true;
  $('empty').hidden = true;
  $('result-count').textContent = 'Carregando seus jogos…';
  try {
    // READ: busca todos os registros, inclusive em coleções com mais de mil jogos.
    const loaded = [];
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const page = await api('GET', `?select=id,nome,plataforma,status,nota,observacoes,criado_em&order=criado_em.desc,id.desc&limit=${pageSize}&offset=${offset}`);
      loaded.push(...page);
      if (page.length < pageSize) break;
    }
    games = loaded;
    setConnection(true);
    render();
  } catch (error) {
    setConnection(false);
    $('load-error').hidden = false;
    $('error-detail').textContent = readableError(error);
    $('result-count').textContent = 'Coleção indisponível';
    for (const id of ['total','playing','completed','platinum']) $(id).textContent = '—';
  } finally {
    $('loading').hidden = true;
    $('refresh').disabled = false;
    loading = false;
  }
}

function cell(className, text) {
  const td = document.createElement('td');
  td.className = className;
  if (text !== undefined) td.textContent = text;
  return td;
}

function actionButton(text, label, handler, className = '') {
  const button = document.createElement('button');
  button.className = 'action ' + className;
  button.textContent = text;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', handler);
  return button;
}

function render() {
  $('total').textContent = games.length;
  $('playing').textContent = games.filter(g => g.status === 'Jogando').length;
  $('completed').textContent = games.filter(g => ['Zerado','Platinado'].includes(g.status)).length;
  $('platinum').textContent = games.filter(g => g.status === 'Platinado').length;
  const search = $('search').value.trim().toLocaleLowerCase('pt-BR');
  const platform = $('platform-filter').value;
  let filtered = games.filter(g => g.nome.toLocaleLowerCase('pt-BR').includes(search) && (!platform || g.plataforma === platform) && (!activeStatus || g.status === activeStatus));
  if ($('sort').value === 'name') filtered.sort((a,b) => a.nome.localeCompare(b.nome,'pt-BR'));
  if ($('sort').value === 'rating') filtered.sort((a,b) => (b.nota ?? -1) - (a.nota ?? -1));
  $('result-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'jogo' : 'jogos'} ${search || platform || activeStatus ? 'encontrados' : 'na coleção'}`;
  $('games').replaceChildren();
  for (const game of filtered) {
    const tr = document.createElement('tr');
    const nameCell = cell('');
    const nameWrap = document.createElement('div');
    nameWrap.className = 'game-cell';
    const avatar = document.createElement('div');
    const hash = [...game.nome].reduce((sum,char) => sum + char.codePointAt(0), 0);
    avatar.className = 'game-avatar avatar-' + hash % 4;
    avatar.setAttribute('aria-hidden','true');
    avatar.textContent = game.nome.split(/\s+/).slice(0,2).map(word => [...word][0]).join('').toUpperCase();
    const nameInfo = document.createElement('div');
    const nameButton = document.createElement('button');
    nameButton.className = 'game-name';
    nameButton.textContent = game.nome;
    nameButton.setAttribute('aria-label', `Ver detalhes de ${game.nome}`);
    nameButton.addEventListener('click', () => openDetails(game.id));
    const date = document.createElement('div');
    date.className = 'game-date';
    date.textContent = 'Adicionado em ' + dateFormat.format(new Date(game.criado_em));
    nameInfo.append(nameButton,date);
    nameWrap.append(avatar,nameInfo);
    nameCell.append(nameWrap);
    const statusCell = cell('status-cell');
    const badge = document.createElement('span');
    badge.className = 'badge ' + (statusClasses[game.status] || '');
    badge.textContent = (game.status === 'Platinado' ? '✦ ' : '') + game.status;
    statusCell.append(badge);
    const rating = cell('rating-cell rating');
    const star = document.createElement('span');
    star.textContent = '★';
    star.setAttribute('aria-hidden','true');
    const max = document.createElement('small');
    max.textContent = game.nota === null ? '' : ' / 10';
    rating.append(star,document.createTextNode(game.nota === null ? 'Sem nota' : Number(game.nota).toLocaleString('pt-BR')),max);
    const actions = cell('actions-cell');
    const actionWrap = document.createElement('div');
    actionWrap.className = 'actions';
    actionWrap.append(actionButton('Editar', `Editar ${game.nome}`, () => openForm(game.id)),actionButton('Excluir', `Excluir ${game.nome}`, () => openDelete(game.id),'delete'));
    actions.append(actionWrap);
    tr.append(nameCell,cell('platform-cell',game.plataforma),statusCell,rating,actions);
    $('games').append(tr);
  }
  $('table-wrap').hidden = filtered.length === 0;
  $('empty').hidden = filtered.length !== 0;
  $('empty-title').textContent = games.length ? 'Nenhum jogo encontrado.' : 'Sua coleção começa com um jogo.';
  $('empty-description').textContent = games.length ? 'Experimente outro nome, plataforma ou status.' : 'Adicione o primeiro e acompanhe sua jornada.';
  $('empty-add').hidden = games.length > 0;
}

function openForm(id = null) {
  if (saving) return;
  const game = games.find(g => g.id === id);
  editingId = game ? game.id : null;
  $('game-form').reset();
  $('dialog-title').textContent = game ? 'Editar jogo' : 'Adicionar jogo';
  $('form-error').hidden = true;
  $('save').textContent = game ? 'Salvar alterações' : 'Salvar jogo';
  if (game) {
    $('name').value = game.nome;
    $('platform').value = game.plataforma;
    $('status').value = game.status;
    $('rating').value = game.nota ?? '';
    $('notes').value = game.observacoes || '';
  }
  $('game-dialog').showModal();
}

function openDetails(id) {
  const game = games.find(g => g.id === id);
  if (!game) return;
  selectedId = id;
  $('details-title').textContent = game.nome;
  $('details').replaceChildren();
  for (const [label,value] of [['Plataforma',game.plataforma],['Status',game.status],['Nota',game.nota === null ? 'Sem nota' : `${Number(game.nota).toLocaleString('pt-BR')} / 10`],['Observações',game.observacoes || 'Nenhuma observação.'],['Cadastro',dateFormat.format(new Date(game.criado_em))]]) {
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = value;
    $('details').append(dt,dd);
  }
  $('details-dialog').showModal();
}

async function saveGame(event) {
  event.preventDefault();
  if (saving) return;
  const name = $('name').value.trim();
  const rating = $('rating').value === '' ? null : Number($('rating').value);
  if (!name || (rating !== null && (!Number.isFinite(rating) || rating < 0 || rating > 10))) {
    $('form-error').textContent = 'Preencha o nome e use uma nota de 0 a 10.';
    $('form-error').hidden = false;
    return;
  }
  const payload = {nome:name,plataforma:$('platform').value,status:$('status').value,nota:rating,observacoes:$('notes').value.trim()};
  saving = true;
  $('save').disabled = true;
  $('save').textContent = 'Salvando…';
  $('form-error').hidden = true;
  const wasEditing = editingId !== null;
  try {
    // CREATE usa POST. UPDATE usa PATCH e filtra pelo id selecionado.
    const updated = await api(wasEditing ? 'PATCH' : 'POST', wasEditing ? `?id=eq.${encodeURIComponent(editingId)}` : '',payload);
    if (updated.length !== 1) throw new Error('O registro não foi salvo. Ele pode ter sido excluído em outra janela. Atualize a coleção.');
    const game = updated[0];
    games = [game,...games.filter(g => g.id !== game.id)].sort((a,b) => new Date(b.criado_em) - new Date(a.criado_em));
    setConnection(true);
    $('game-dialog').close();
    $('load-error').hidden = true;
    render();
    notify(wasEditing ? 'Alterações salvas no Supabase.' : 'Jogo adicionado à coleção.');
  } catch (error) {
    $('form-error').textContent = readableError(error);
    $('form-error').hidden = false;
  } finally {
    saving = false;
    $('save').disabled = false;
    $('save').textContent = wasEditing ? 'Salvar alterações' : 'Salvar jogo';
  }
}

function openDelete(id) {
  const game = games.find(g => g.id === id);
  if (!game) return;
  deleteId = id;
  $('delete-description').textContent = `Você está prestes a excluir “${game.nome}” da coleção.`;
  $('delete-error').hidden = true;
  $('delete-dialog').showModal();
  $('cancel-delete').focus();
}

async function deleteGame() {
  if (deleting || deleteId === null) return;
  deleting = true;
  $('confirm-delete').disabled = true;
  $('confirm-delete').textContent = 'Excluindo…';
  $('delete-error').hidden = true;
  try {
    // DELETE remove apenas o registro selecionado e retorna a linha excluída.
    const removed = await api('DELETE', `?id=eq.${encodeURIComponent(deleteId)}`);
    games = games.filter(g => g.id !== deleteId);
    $('delete-dialog').close();
    render();
    notify(removed.length ? 'Jogo excluído da coleção.' : 'Esse jogo já havia sido excluído.');
  } catch (error) {
    $('delete-error').textContent = readableError(error);
    $('delete-error').hidden = false;
  } finally {
    deleting = false;
    $('confirm-delete').disabled = false;
    $('confirm-delete').textContent = 'Excluir jogo';
  }
}

$('new-game').addEventListener('click', () => openForm());
$('empty-add').addEventListener('click', () => openForm());
$('refresh').addEventListener('click',loadGames);
$('retry').addEventListener('click',loadGames);
$('search').addEventListener('input',render);
$('platform-filter').addEventListener('change',render);
$('sort').addEventListener('change',render);
$('game-form').addEventListener('submit',saveGame);
$('name').addEventListener('input',() => $('name').setCustomValidity(''));
document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => {
  activeStatus = button.dataset.status;
  document.querySelectorAll('.tab').forEach(tab => {tab.classList.toggle('active',tab === button);tab.setAttribute('aria-pressed',String(tab === button));});
  render();
}));
document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click',() => {if (!saving) $('game-dialog').close();}));
$('game-dialog').addEventListener('cancel',event => {if (saving) event.preventDefault();});
$('close-details').addEventListener('click',() => $('details-dialog').close());
$('edit-details').addEventListener('click',() => {$('details-dialog').close();openForm(selectedId);});
$('cancel-delete').addEventListener('click',() => {if (!deleting) $('delete-dialog').close();});
$('delete-dialog').addEventListener('cancel',event => {if (deleting) event.preventDefault();});
$('confirm-delete').addEventListener('click',deleteGame);
loadGames();
