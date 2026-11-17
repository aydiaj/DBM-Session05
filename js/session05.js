(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const KEY = 'dbm-session05-progress-v1';
  const THEME = 'dbm-session05-theme-v1';
  const items = window.S05_ITEMS || [];
  let state = { completed: [], values: {}, quizChecked: false };
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (stored && Array.isArray(stored.completed) && stored.values && typeof stored.values === 'object') {
      state = { completed: stored.completed.filter(n => Number.isInteger(n) && n >= 0 && n < 8), values: stored.values, quizChecked: !!stored.quizChecked };
    }
  } catch { $('#s5-storage-status').textContent = 'Saving is unavailable here. Your work still works in this tab.'; }
  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { $('#s5-storage-status').textContent = 'Saving is unavailable here. Keep a copy of your notes.'; }
  };
  let toastTimer;
  const toast = message => {
    const el = $('#s5-toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  };
  const panels = $$('.lesson');
  let current = 0;
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const setMenu = open => {
    document.body.classList.toggle('nav-open', open);
    $('#s5-menu').setAttribute('aria-expanded', String(open));
    $('#s5-scrim').hidden = !open;
    if (open) $('.step-link', $('#s5-sidebar')).focus();
  };
  const renderProgress = () => {
    $$('.step-link').forEach((el, i) => {
      el.classList.toggle('active', i === current);
      el.classList.toggle('done', state.completed.includes(i));
      if (i === current) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
    });
    $$('[data-complete]').forEach(el => {
      const done = state.completed.includes(Number(el.dataset.complete));
      el.setAttribute('aria-pressed', String(done));
      el.textContent = done ? '✓ Step complete' : '✓ Mark step complete';
    });
    $('#s5-progress-text').textContent = `${state.completed.length} / 8`;
    $('#s5-progress').setAttribute('aria-valuenow', String(state.completed.length));
    $('#s5-progress-fill').style.width = `${state.completed.length / 8 * 100}%`;
  };
  const navigate = (index, options = {}) => {
    current = Math.max(0, Math.min(7, index));
    panels.forEach((panel, i) => { panel.hidden = i !== current; });
    renderProgress(); setMenu(false);
    if (!options.fromHash) history.replaceState(null, '', `#step-${String(current + 1).padStart(2, '0')}`);
    if (!options.initial) {
      window.scrollTo({top: 0, behavior: reducedMotion() ? 'auto' : 'smooth'});
      $(`#s5-title-${current}`).focus({preventScroll: true});
    }
  };
  $$('.step-link').forEach(el => el.addEventListener('click', () => navigate(Number(el.dataset.step))));
  $$('[data-prev]').forEach(el => el.addEventListener('click', () => navigate(current - 1)));
  $$('[data-next]').forEach(el => el.addEventListener('click', () => navigate(current + 1)));
  $$('[data-complete]').forEach(el => el.addEventListener('click', () => {
    const index = Number(el.dataset.complete);
    state.completed = state.completed.includes(index) ? state.completed.filter(n => n !== index) : [...state.completed, index];
    persist(); renderProgress(); toast(state.completed.includes(index) ? 'Step saved as complete.' : 'Step marked for another look.');
  }));
  $('#s5-menu').addEventListener('click', () => setMenu(!document.body.classList.contains('nav-open')));
  $('#s5-close').addEventListener('click', () => { setMenu(false); $('#s5-menu').focus(); });
  $('#s5-scrim').addEventListener('click', () => { setMenu(false); $('#s5-menu').focus(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('nav-open')) { setMenu(false); $('#s5-menu').focus(); }
    if (event.key === 'Tab' && document.body.classList.contains('nav-open')) {
      const focusable = $$('button:not([disabled]), a[href]', $('#s5-sidebar')).filter(el => el.getClientRects().length);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 1000) setMenu(false); });
  const applyTheme = theme => {
    document.body.dataset.theme = theme;
    $('#s5-theme').setAttribute('aria-pressed', String(theme === 'dark'));
    $('#s5-theme').setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  };
  let theme = 'light';
  try { theme = localStorage.getItem(THEME) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch {}
  applyTheme(theme === 'dark' ? 'dark' : 'light');
  $('#s5-theme').addEventListener('click', () => {
    const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(next);
    try { localStorage.setItem(THEME, next); } catch {}
  });
  $('#s5-sources-link').addEventListener('click', event => {
    event.preventDefault(); navigate(7);
    requestAnimationFrame(() => $('#sources').scrollIntoView({behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start'}));
  });
  window.addEventListener('hashchange', () => {
    const match = location.hash.match(/^#step-0?([1-8])$/);
    if (match) navigate(Number(match[1]) - 1, {fromHash: true});
  });
  const initial = location.hash.match(/^#step-0?([1-8])$/);
  navigate(initial ? Number(initial[1]) - 1 : 0, {initial: true, fromHash: true});
  if (location.hash === '#sources') { navigate(7, {initial: true}); requestAnimationFrame(() => $('#sources').scrollIntoView()); }

  document.addEventListener('click', async event => {
    const button = event.target.closest('.copy-btn'); if (!button) return;
    const code = $('pre code', button.closest('.code-shell'));
    if (!code) return;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(code.textContent);
      else {
        const temp = document.createElement('textarea'); temp.value = code.textContent;
        temp.style.position = 'fixed'; temp.style.opacity = '0'; document.body.appendChild(temp);
        temp.select(); const ok = document.execCommand('copy'); temp.remove(); if (!ok) throw new Error('copy');
      }
      toast('Code copied.');
    } catch { toast('Select the code and copy it with your keyboard.'); }
  });
  const codeBlock = (label, source) => `<div class="code-shell"><div class="code-head"><span>${esc(label)}</span><button class="copy copy-btn" type="button">Copy code</button></div><pre tabindex="0"><code>${esc(source)}</code></pre></div>`;
  const journey = [
    {label:'Inspect the table', file:'SSMS · setup-inventory.sql', title:'Start from the prepared SQL table', body:'Check dbo.Items in DBM_Session05_Inventory. Identify its key, column types and sample rows.', code:'SELECT Id, Name, UnitPrice, Stock, IsActive, AddedAt\nFROM dbo.Items\nORDER BY Id;', status:'Inspect with SSMS · the C# app has not run'},
    {label:'Map the entity', file:'InventoryModels · Item.cs', title:'Describe one Item in C#', body:'Mapped properties correspond to columns. Id is the key. Attributes add mapping information such as a length or decimal SQL type.', code:'public int Id { get; set; }\npublic string Name { get; set; } = "";', status:'Model definition · no rows fetched'},
    {label:'Expose the DbSet', file:'InventoryDBLibrary · InventoryDBContext.cs', title:'Give the context an Item query entry point', body:'DbSet<Item> lets us build queries over the mapped entity set. Items is the default table name by convention; it is not a list already loaded from SQL Server.', code:'public DbSet<Item> Items { get; set; }', status:'Entity set · no rows fetched'},
    {label:'Read the settings', file:'InventoryManager · appsettings.json', title:'Name the database destination', body:'The connection string identifies the server, database and authentication. It supplies settings; it does not open a connection.', code:'Server=YOUR_SERVER;Database=DBM_Session05_Inventory;\nIntegrated Security=True;', status:'Connection settings · no connection opened'},
    {label:'Choose the provider', file:'InventoryManager · Program.cs', title:'Build options for SQL Server', body:'Microsoft.EntityFrameworkCore.SqlServer is the EF Core provider. UseSqlServer selects and configures it. Microsoft.Data.SqlClient is its underlying connection/command driver.', code:'var optionsBuilder = new DbContextOptionsBuilder<InventoryDbContext>();\noptionsBuilder.UseSqlServer(connectionString);', status:'Provider configured · no connection opened'},
    {label:'Create the context', file:'InventoryManager · Program.cs', title:'Create this short database session', body:'Pass the built options to InventoryDbContext. The supplied constructor passes them to DbContext. using disposes the context when its enclosing scope ends.', code:'using var db = new InventoryDbContext(optionsBuilder.Options);', status:'Context exists · connection still closed'},
    {label:'Build and preview', file:'InventoryManager · Program.cs', title:'Describe the request before executing it', body:'OrderBy builds a provider-backed query. ToQueryString creates a debugging SQL preview. Neither line fetches rows in this example.', code:'var query = db.Items.OrderBy(item => item.Name);\nConsole.WriteLine(query.ToQueryString());', status:'Query definition / SQL preview · no rows fetched'},
    {label:'Execute and print', file:'InventoryManager · Program.cs', title:'Read values into objects, then print the list', body:'ToListAsync executes the query. EF manages the connection and materialises the returned values. After the call completes, printing the loaded list sends no new query. The context is disposed at the end of its scope.', code:'List<Item> items = await query.ToListAsync();\nPrintItems("Inventory", items);', status:'Connection used for the operation · then normally closed'}
  ];
  $('#journey-nav').innerHTML = journey.map((stage,i) => `<li><button type="button" data-journey="${i}" aria-pressed="${i === 0}"><b>${i+1}</b><span>${esc(stage.label)}</span></button></li>`).join('');
  const showJourney = index => {
    const stage = journey[index];
    $$('[data-journey]').forEach(el => el.setAttribute('aria-pressed', String(Number(el.dataset.journey) === index)));
    $('#journey-detail').innerHTML = `<span class="section-kicker">${esc(stage.file)}</span><h3>${esc(stage.title)}</h3><p>${esc(stage.body)}</p>${codeBlock('Journey checkpoint', stage.code)}<span class="s05-status">${esc(stage.status)}</span>`;
  };
  $$('[data-journey]').forEach(el => el.addEventListener('click', () => showJourney(Number(el.dataset.journey))));
  showJourney(0);
  const project = {
    console:'<h3>EF10_InventoryManager</h3><p>The runnable Console project. Program.cs reads settings, configures EF Core, runs queries and prints results. Set this as the startup project.</p><p><b>References:</b> InventoryDBLibrary, then the model types through that dependency.</p>',
    database:'<h3>EF10_InventoryDBLibrary</h3><p>A Class Library that builds a reusable DLL. It defines InventoryDbContext and references the EF Core SQL Server provider.</p><p><b>References:</b> InventoryModels, where Item is defined. This library does not start its own Console window.</p>',
    model:'<h3>EF10_InventoryModels</h3><p>A Class Library containing Item. Its properties describe the mapped data. The framework DataAnnotations namespaces provide our attributes.</p><p>It holds no connection string and opens no database connection.</p>'
  };
  const showProject = name => {
    $$('[data-project]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.project === name)));
    $('#project-detail').innerHTML = project[name];
  };
  $$('[data-project]').forEach(el => el.addEventListener('click', () => showProject(el.dataset.project)));
  showProject('console');
  const renderTable = (headers, rows, label) => `<div class="table-wrap s2-table-wrap" role="region" tabindex="0" aria-label="${esc(label)}"><table class="s2-table"><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  $('#inventory-table').innerHTML = renderTable(['Id','Name','UnitPrice','Stock','Active','AddedAt'],items.map(i=>[i.Id,i.Name,i.UnitPrice.toFixed(2),i.Stock,i.IsActive?'Yes':'No',i.AddedAt.replace('T',' ')]),'Prepared inventory data');
  const predicates = {
    all: () => true,
    available: item => item.IsActive && item.Stock > 0,
    search: item => item.Name.includes('Star'),
    price: item => item.Stock > 0 && item.UnitPrice >= 10 && item.UnitPrice <= 20
  };
  const filterCode = {
    all:'db.Items',
    available:'db.Items.Where(item => item.IsActive && item.Stock > 0)',
    search:'db.Items.Where(item => item.Name.Contains("Star"))',
    price:'db.Items.Where(item => item.Stock > 0\n    && item.UnitPrice >= 10m && item.UnitPrice <= 20m)'
  };
  const applyFilter = () => {
    const mode = $('#filter-mode').value;
    const predicate = predicates[mode] || predicates.all;
    const included = items.filter(predicate);
    $('#filter-result').innerHTML = codeBlock('Condition illustrated by the simulation', filterCode[mode]) + `<p class="s05-filter-count">${included.length} of ${items.length} records match.</p><div class="table-wrap s2-table-wrap" tabindex="0" role="region" aria-label="Simulated filter matches"><table class="s2-table"><thead><tr><th scope="col">Id</th><th scope="col">Name</th><th scope="col">Result</th></tr></thead><tbody>${items.map(i=>{const yes=predicate(i);return `<tr class="${yes?'s05-in':''}"><td class="${yes?'':'s05-out'}">${i.Id}</td><td class="${yes?'':'s05-out'}">${esc(i.Name)}</td><td>${yes?'✓ Included':'Excluded'}</td></tr>`;}).join('')}</tbody></table></div>`;
  };
  $('#filter-run').addEventListener('click', applyFilter); applyFilter();
  const showShape = name => {
    $$('[data-shape]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.shape===name)));
    const examples = {
      entity:['List<Item>','Item { Id = 3, Name = "Star Trek", UnitPrice = 12.50m,\n       Stock = 3, IsActive = true, AddedAt = ... }','A complete Item entity, with all six mapped values.'],
      name:['List<string>','"Star Trek"','A string value. It has no Stock or UnitPrice property.'],
      price:['List of an anonymous type','{ Name = "Star Trek", UnitPrice = 12.50m }','A projected object with the two selected values. Use var for this anonymous shape.']
    };
    const [type,code,detail]=examples[name];
    $('#shape-demo').innerHTML=`<h3>${esc(type)}</h3><pre>${esc(code)}</pre><p>${esc(detail)}</p><p class="small">Illustrative view of one result, not a separate database request.</p>`;
  };
  $$('[data-shape]').forEach(el=>el.addEventListener('click',()=>showShape(el.dataset.shape))); showShape('entity');
  const choiceCheck = (button,select,result,answer,message) => $(button).addEventListener('click',()=>{
    const value=$(select).value, el=$(result); el.classList.toggle('good',value===answer);
    el.textContent=!value?'Choose an answer first.':value===answer?'Correct. '+message:'Try again. '+message;
  });
  choiceCheck('#role-check','#role-choice','#role-feedback','provider','UseSqlServer selects the EF Core SQL Server provider. The builder carries its configuration.');
  choiceCheck('#terminal-check','#terminal-choice','#terminal-feedback','any','AnyAsync returns the true/false answer directly.');
  const quiz=[
    {q:'Does creating InventoryDbContext open the database connection in this app?',a:['Yes, immediately.','No. EF opens it when a database operation needs it.'],correct:1,why:'Context construction prepares the session; the first executed query uses the connection.'},
    {q:'What does db.Items.Where(...) do before execution?',a:['Build a query condition.','Fetch every matching row immediately.'],correct:0,why:'Where composes the provider query. ToListAsync or another terminal method executes it.'},
    {q:'What does db.Items represent?',a:['Every Item already loaded into a List<Item>.','The mapped Item entity set used to build queries.'],correct:1,why:'A DbSet is a query entry point. A loaded List<Item> is the result of execution.'},
    {q:'What does FirstOrDefaultAsync return for missing Id 999 here?',a:['null','An automatically created Item with Id 999.','An exception because every lookup must succeed.'],correct:0,why:'For this entity lookup, no match gives null. Check it before reading properties.'},
    {q:'After ToListAsync completes, does foreach over that loaded list send the same query again?',a:['Yes, once for each item.','No. It reads the loaded objects.'],correct:1,why:'Enumerating the list is in-memory work. Executing the original provider query again would be different.'}
  ];
  $('#exit-quiz').innerHTML='<p>Answer all five, then check. Use the feedback to review your code.</p>'+quiz.map((q,i)=>`<fieldset class="s05-quiz-item"><legend>${i+1}. ${esc(q.q)}</legend>${q.a.map((a,j)=>`<label><input type="radio" name="exit-${i}" value="${j}" data-save="exit-${i}"><span>${esc(a)}</span></label>`).join('')}<p class="s05-answer" id="exit-answer-${i}" hidden></p></fieldset>`).join('')+'<button class="button s2-btn primary" id="exit-check" type="button">Check all answers</button><p id="exit-quiz-result" role="status"></p>';
  const scoreQuiz = silent => {
    const choices=quiz.map((_,i)=>$(`input[name="exit-${i}"]:checked`));
    if(choices.some(c=>!c)){if(!silent)$('#exit-quiz-result').textContent='Answer all five questions first.';return;}
    let score=0;
    choices.forEach((c,i)=>{
      const correct=Number(c.value)===quiz[i].correct; if(correct)score++;
      const el=$(`#exit-answer-${i}`);el.hidden=false;el.textContent=(correct?'Correct. ':'Review this one. ')+quiz[i].why;
    });
    $('#exit-quiz-result').textContent=`${score} / ${quiz.length} correct. Review the explanations, then check your own program.`;
    state.quizChecked=true;persist();
  };
  $('#exit-check').addEventListener('click',()=>scoreQuiz(false));
  $$('[data-save]').forEach(el=>{
    const value=state.values[el.dataset.save];
    if(el.type==='checkbox') el.checked=value===true;
    else if(el.type==='radio') el.checked=String(value)===el.value;
    else if(typeof value==='string') el.value=value;
    const event=el.matches('textarea')?'input':'change';
    el.addEventListener(event,()=>{
      state.values[el.dataset.save]=el.type==='checkbox'?el.checked:el.value;
      if(el.type==='radio'){state.quizChecked=false;$('#exit-quiz-result').textContent='';$$('.s05-answer').forEach(p=>p.hidden=true);}
      persist();
    });
  });
  if(state.quizChecked)scoreQuiz(true);
  const dialog=$('#s5-reset-dialog');
  $('#s5-reset').addEventListener('click',()=>dialog.showModal());
  $('#s5-cancel-reset').addEventListener('click',()=>dialog.close());
  $('#s5-confirm-reset').addEventListener('click',()=>{
    state={completed:[],values:{},quizChecked:false};persist();
    $$('[data-save]').forEach(el=>{if(el.type==='checkbox'||el.type==='radio')el.checked=false;else el.value='';});
    $$('.s05-answer').forEach(el=>el.hidden=true);$('#exit-quiz-result').textContent='';
    dialog.close();navigate(0);toast('Session 05 has been reset.');
  });
})();
