(() => {
  'use strict';
  const config = window.GAME_CONFIG;
  const WIDTH = config.boardWidth, HEIGHT = config.boardHeight, STEP = 1 / 120;
  const LINE = config.dangerLine;
  const levels = config.levels.map(v => ({ ...v, r: v.radius }));
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let balls = [], particles = [], score = 0, best = 0, highest = 0, state = 'playing';
  let current = randomLevel(), next = randomLevel(), aim = WIDTH / 2, cooldown = 0, danger = 0, elapsed = 0, id = 0;
  let lastFrame = 0, accumulator = 0, sound = true, music = true, audio = null, restartWasPlaying = false;
  const heldKeys = new Set();
  const textures = levels.map(() => null), thumbnailURLs = levels.map(() => '');
  let loadedCount = 0;
  const loadingMessage = '果果头像加载中…';
  $('status').textContent = loadingMessage;
  const imageReady = Promise.all(levels.map((level, index) => new Promise(resolve => {
    const fallback = level.fallbackImage || level.image;
    const sources = [level.image, fallback, fallback + '?retry=ipad13'];
    let attempt = 0, finished = false;
    function load() {
      const request = attempt, img = new Image();
      let timer;
      function fail() {
        if (finished || request !== attempt) return;
        clearTimeout(timer); img.onload = img.onerror = null;
        attempt++;
        if (attempt < sources.length) load();
        else { finished = true; resolve(); }
      }
      img.onload = () => {
        if (finished || request !== attempt) return;
        clearTimeout(timer);
        try {
          // Reuse decoded portraits rather than allocating two canvases per image.
          // Only the unchanged ep screenshot needs a square crop.
          if (level.crop) {
            const [x,y,side] = level.crop;
            const tile = document.createElement('canvas'); tile.width = tile.height = 640;
            const painter = tile.getContext('2d');
            painter.drawImage(img,x,y,side,side,0,0,640,640);
            const thumb = document.createElement('canvas'); thumb.width = thumb.height = 96;
            thumb.getContext('2d').drawImage(tile,0,0,96,96);
            thumbnailURLs[index] = thumb.toDataURL('image/png');
            textures[index] = tile;
          } else {
            textures[index] = img;
            thumbnailURLs[index] = img.src;
          }
          finished = true; loadedCount++; updateUI(); resolve();
        } catch { fail(); }
      };
      img.onerror = fail;
      timer = setTimeout(fail,15000);
      img.src = sources[attempt];
    }
    load();
  })));
  imageReady.then(() => {
    if ($('status').textContent !== loadingMessage) return;
    $('status').textContent = loadedCount === levels.length
      ? '找准落点，让相同的果果相遇。'
      : '部分头像未加载成功，刷新可重试。';
  });
  try { best = Math.max(0, Number(localStorage.getItem('guoguo-nine-v2-best')) || 0); } catch {}
  $('best').textContent = best;
  function randomLevel() {
    const roll = Math.random(); let cumulative = 0;
    for (let i = 0; i < config.dropWeights.length; i++) { cumulative += config.dropWeights[i]; if (roll < cumulative) return i; }
    for (let i = config.dropWeights.length - 1; i >= 0; i--) if (config.dropWeights[i] > 0) return i;
    return 0;
  }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function updateUI() {
    $('score').textContent = score; $('best').textContent = best;
    $('progress').textContent = `${highest + 1} / ${levels.length}`;
    $('next').textContent = thumbnailURLs[next] ? '' : next + 1;
    $('next').setAttribute('aria-label', `下一个：${levels[next].name}`);
    $('next').style.backgroundColor = levels[next].color;
    $('next').style.backgroundImage = thumbnailURLs[next] ? `url("${thumbnailURLs[next]}")` : '';
    $('levels').replaceChildren(...levels.map((l, i) => {
      const li = document.createElement('li'); li.className = `level ${i <= highest ? 'reached' : ''} ${i === highest ? 'latest' : ''}`;
      const icon = document.createElement('span'); icon.className = 'level-icon'; icon.style.setProperty('--color', l.color);
      if (thumbnailURLs[i]) { icon.style.backgroundImage = `url("${thumbnailURLs[i]}")`; } else icon.textContent = i + 1;
      const name = document.createElement('span'); name.className = 'level-name'; name.textContent = l.name;
      icon.setAttribute('aria-label', `${i + 1}号 ${l.name}`); li.title = `${i + 1}号 ${l.name}`;
      li.append(icon, name); return li;
    }));
  }
  const bgm = $('bgm');
  bgm.loop = true;
  let musicSource = null, musicGain = null, audioUnlocked = false;
  async function unlockAudio() {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (!musicSource) {
        musicSource = audio.createMediaElementSource(bgm);
        musicGain = audio.createGain(); musicGain.gain.value = .4;
        musicSource.connect(musicGain); musicGain.connect(audio.destination);
      }
      // Both calls occur inside the gesture, before awaiting (including Safari).
      const resumeAudio = audio.resume();
      const playMusic = music && !document.hidden ? bgm.play() : Promise.resolve();
      audioUnlocked = true;
      await Promise.all([resumeAudio, playMusic]);
      if (!music || document.hidden) bgm.pause();
      if (sound) loadVoices().catch(() => {});
    } catch (error) {
      if (error.name !== 'NotAllowedError') $('status').textContent = '声音加载失败，可重新切换音效或音乐。';
    }
  }
  function unlockOnGesture(event) {
    if (event.target.closest?.('[data-audio-control]')) return;
    if ((sound || music) && (!audioUnlocked || audio?.state !== 'running' || (music && bgm.paused))) unlockAudio();
  }
  document.addEventListener('pointerdown', unlockOnGesture, { capture: true });
  document.addEventListener('keydown', unlockOnGesture, { capture: true });
  bgm.addEventListener('error', () => { if (music) $('status').textContent = '背景音乐加载失败，可关闭后重新开启。'; });
  window.addEventListener('pagehide', () => { bgm.pause(); stopVoice(); });
  // Video phrases, in source order; platform outro is excluded.
  const voiceSlices = [[.10,1.12],[1.34,.96],[2.38,.80],[3.22,.67],[3.91,.45],[4.35,.64],[5.02,1.25],[6.49,1.57],[8.48,2.62]];
  let voiceBuffer = null, voiceLoading = null, activeVoice = null, voiceRequest = 0;
  function stopVoice() {
    voiceRequest++;
    if (activeVoice) { try { activeVoice.stop(); } catch {} activeVoice = null; }
  }
  function loadVoices() {
    if (voiceBuffer) return Promise.resolve(voiceBuffer);
    if (!voiceLoading) voiceLoading = fetch('guoguo-voices.mp3').then(response => {
      if (!response.ok) throw new Error('Audio unavailable');
      return response.arrayBuffer();
    }).then(bytes => audio.decodeAudioData(bytes)).then(buffer => voiceBuffer = buffer).catch(error => { voiceLoading = null; throw error; });
    return voiceLoading;
  }
  async function tone(level) {
    if (!sound || !audio) return;
    stopVoice(); const request = voiceRequest;
    try {
      const buffer = await loadVoices();
      if (!sound || request !== voiceRequest || state === 'paused' || state === 'lost') return;
      const source = audio.createBufferSource(), gain = audio.createGain();
      const [offset, duration] = voiceSlices[level];
      source.buffer = buffer; gain.gain.value = .6;
      source.connect(gain); gain.connect(audio.destination); activeVoice = source;
      source.onended = () => { source.disconnect(); gain.disconnect(); if (activeVoice === source) activeVoice = null; };
      source.start(0, offset, duration);
    } catch { if (sound && request === voiceRequest) $('status').textContent = '音效加载失败，可关闭后重新开启。'; }
  }
  function makeBall(level, x, y, vx = 0, vy = 0) {
    return { id: ++id, level, r: levels[level].r, x, y, vx, vy, age: 0, born: elapsed, lock: 0 };
  }
  function drop(x = aim) {
    if (state !== 'playing' || cooldown > 0 || $('restart-dialog').open) return false;
    const r = levels[current].r; aim = clamp(x, r + 2, WIDTH - r - 2);
    balls.push(makeBall(current, aim, Math.max(r + 2, 25), 0, config.initialFallSpeed));
    tone(current);
    highest = Math.max(highest, current); current = next; next = randomLevel(); cooldown = config.dropCooldown;
    $('hint').hidden = true; updateUI(); return true;
  }
  function burst(x, y, level) {
    if (reduced) return;
    for (let i = 0; i < 16; i++) { const a = Math.random() * Math.PI * 2, v = 50 + Math.random() * 150;
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .55, color: levels[level].color, r: 2 + Math.random() * 3 }); }
  }
  function merge(a, b) {
    const level = a.level + 1;
    const merged = makeBall(level, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.vx + b.vx) / 2, Math.min(0, (a.vy + b.vy) / 2));
    merged.x = clamp(merged.x, merged.r, WIDTH - merged.r); merged.y = Math.min(merged.y, HEIGHT - merged.r); merged.lock = .08;
    balls = balls.filter(ball => ball !== a && ball !== b); balls.push(merged);
    score += (2 ** level) * 10; highest = Math.max(highest, level);
    if (score > best) { best = score; try { localStorage.setItem('guoguo-nine-v2-best', String(best)); } catch {} }
    burst(merged.x, merged.y, level); tone(level); updateUI();
    $('status').textContent = `合成了「${levels[level].name}」！ +${(2 ** level) * 10}`;
    if (level === levels.length - 1) { state = 'won'; balls = [merged]; merged.x = WIDTH / 2; merged.y = HEIGHT / 2; merged.vx = merged.vy = 0;
      $('win-banner').hidden = false; $('pause').disabled = true; $('status').textContent = '恭喜绳匠大人！你合成了 ep果！'; }
  }
  function physics(dt) {
    elapsed += dt; cooldown = Math.max(0, cooldown - dt);
    for (const b of balls) { b.age += dt; b.lock = Math.max(0, b.lock - dt); b.vy += config.gravity * dt; b.vx *= .9995; b.vy *= .999;
      if (b.y + b.r >= HEIGHT - 1) b.vx *= .985;
      b.x += b.vx * dt; b.y += b.vy * dt; }
    for (let pass = 0; pass < 9; pass++) {
      let pair = null;
      for (let i = 0; i < balls.length; i++) {
        const a = balls[i];
        if (a.x < a.r) { a.x = a.r; if (a.vx < 0) a.vx *= -.18; }
        if (a.x > WIDTH - a.r) { a.x = WIDTH - a.r; if (a.vx > 0) a.vx *= -.18; }
        if (a.y > HEIGHT - a.r) { a.y = HEIGHT - a.r; if (a.vy > 0) a.vy = a.vy < 22 ? 0 : a.vy * -.12;  }
        for (let j = i + 1; j < balls.length; j++) {
          const b = balls[j]; let dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy), sum = a.r + b.r;
          if (dist > sum + .1) continue;
          if (a.level === b.level && a.lock === 0 && b.lock === 0 && a.level < levels.length - 1) { pair = [a, b]; break; }
          if (dist < .001) { dx = .001; dy = 0; dist = .001; }
          const nx = dx / dist, ny = dy / dist, wa = 1 / (a.r * a.r), wb = 1 / (b.r * b.r), total = wa + wb;
          const correction = Math.max(0, sum - dist - .025) * .86 / total;
          a.x -= nx * correction * wa; a.y -= ny * correction * wa; b.x += nx * correction * wb; b.y += ny * correction * wb;
          const speed = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (speed < 0) { const impulse = -(speed < -50 ? 1.13 : 1) * speed / total;
            a.vx -= impulse * nx * wa; a.vy -= impulse * ny * wa; b.vx += impulse * nx * wb; b.vy += impulse * ny * wb;
            const tangent = ((b.vx - a.vx) * -ny + (b.vy - a.vy) * nx) * .06 / total;
            a.vx += -ny * tangent * wa; a.vy += nx * tangent * wa; b.vx -= -ny * tangent * wb; b.vy -= nx * tangent * wb; }
        }
        if (pair) break;
      }
      if (pair) { merge(...pair); if (state === 'won') return; }
    }
    const overflow = balls.some(b => b.age > config.spawnGraceSeconds && b.y - b.r < LINE);
    danger = overflow ? danger + dt : Math.max(0, danger - dt * 3);
    if (danger > .2) $('status').textContent = `快碰出空位！${Math.max(1, Math.ceil(config.dangerSeconds - danger))} 秒后到顶`;
    if (!overflow && danger === 0 && $('status').textContent.startsWith('快碰')) $('status').textContent = '危机解除，继续合成。';
    if (danger >= config.dangerSeconds) { state = 'lost'; stopVoice(); showOverlay('果子满出来啦', `本局 ${score} 分，合成到「${levels[highest].name}」。再试一次？`, '下次一定更大'); $('pause').disabled = true; }
  }
  function drawOrb(b, alpha = 1, preview = false) {
    const l = levels[b.level], img = textures[b.level];
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(b.x, b.y);
    const grow = preview || reduced || state === 'won' ? 1 : Math.min(1, .8 + b.age * 3); ctx.scale(grow, grow);
    ctx.shadowColor = '#66478419'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 2;
    ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    const bubble = ctx.createRadialGradient(-b.r * .28, -b.r * .4, 0, 0, 0, b.r);
    bubble.addColorStop(0, '#ffffff40'); bubble.addColorStop(.7, l.color + '24'); bubble.addColorStop(1, '#bda1e65e');
    ctx.fillStyle = bubble; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); ctx.clip();
    if (img) { ctx.save();
      if (b.level === levels.length - 1) {
        // ep果 preserves the supplied artwork inside the translucent bubble.
        ctx.beginPath(); ctx.arc(0, 0, b.r * .89, 0, Math.PI * 2); ctx.clip(); ctx.globalAlpha *= .9;
        ctx.drawImage(img, -b.r * .89, -b.r * .89, 1.78 * b.r, 1.78 * b.r);
      } else { ctx.globalAlpha *= .94; ctx.drawImage(img, -b.r, -b.r, 2 * b.r, 2 * b.r); }
      ctx.restore(); }
    else { const g = ctx.createRadialGradient(-b.r * .35, -b.r * .45, 0, 0, 0, b.r); g.addColorStop(0, '#ffffff50'); g.addColorStop(.65, '#ffffff00'); g.addColorStop(1, '#27123516'); ctx.fillStyle = g; ctx.fillRect(-b.r, -b.r, b.r * 2, b.r * 2);
      ctx.fillStyle = '#342442'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `800 ${Math.max(13, b.r * .65)}px system-ui`; ctx.fillText(String(b.level + 1), 0, b.level === levels.length - 1 ? -b.r * .08 : 1);
      if (b.level === levels.length - 1) { ctx.font = `700 ${b.r * .11}px system-ui`; ctx.fillText('ep果', 0, b.r * .38); } }
    ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, b.r - .6, 0, Math.PI * 2); ctx.lineWidth = Math.max(1.2, b.r * .012); ctx.strokeStyle = '#ad8bd587'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, b.r * .94, Math.PI * 1.10, Math.PI * 1.58); ctx.lineWidth = Math.max(2, b.r * .035); ctx.lineCap = 'round'; ctx.strokeStyle = '#ffffffc9'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, b.r * .94, Math.PI * .13, Math.PI * .39); ctx.lineWidth = Math.max(1.3, b.r * .018); ctx.strokeStyle = '#fdf6b59c'; ctx.stroke();
    ctx.restore();
  }
  function draw() {
    ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0); ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#8e6bb012'; for (let x = 20; x < WIDTH; x += 24) for (let y = 20; y < HEIGHT; y += 24) { ctx.beginPath(); ctx.arc(x, y, .9, 0, Math.PI * 2); ctx.fill(); }
    if (state !== 'won') { ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = danger > .2 ? '#e45b76' : '#aa93bb80'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(13, LINE); ctx.lineTo(WIDTH - 13, LINE); ctx.stroke(); ctx.restore();
      ctx.fillStyle = danger > .2 ? '#b93855' : '#9b84ad'; ctx.font = '11px system-ui'; ctx.textAlign = 'right'; ctx.fillText('到这里就完蛋惹', WIDTH - 17, LINE + 17); }
    if (state === 'playing') { const r = levels[current].r, x = clamp(aim, r + 2, WIDTH - r - 2);
      ctx.save(); ctx.setLineDash([3, 8]); ctx.strokeStyle = '#8d70a54a'; ctx.beginPath(); ctx.moveTo(x, 28 + r); ctx.lineTo(x, HEIGHT - 6); ctx.stroke(); ctx.restore();
      drawOrb({ x, y: Math.max(r + 2, 25), r, level: current }, cooldown ? .25 : .76, true); }
    for (const b of balls) drawOrb(b);
    for (const p of particles) { ctx.globalAlpha = Math.max(0, p.life / .55); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1;
    if (danger > .2 && state === 'playing') { ctx.fillStyle = `rgba(235,80,110,${.03 + danger * .025})`; ctx.fillRect(0, 0, WIDTH, 72); }
  }
  function frame(time) {
    const delta = lastFrame ? Math.min((time - lastFrame) / 1000, .05) : 0; lastFrame = time;
    if (state === 'playing' && !$('restart-dialog').open) {
      const direction = Number(heldKeys.has('ArrowRight')) - Number(heldKeys.has('ArrowLeft'));
      aim = clamp(aim + direction * config.keyboardSpeed * delta, 0, WIDTH);
      accumulator += delta; while (accumulator >= STEP && state === 'playing') { physics(STEP); accumulator -= STEP; } }
    else accumulator = 0;
    if (state !== 'paused') { for (const p of particles) { p.x += p.vx * delta; p.y += p.vy * delta; p.vy += 240 * delta; p.life -= delta; } particles = particles.filter(p => p.life > 0); }
    draw(); requestAnimationFrame(frame);
  }
  function showOverlay(title, text, kicker) { $('overlay').hidden = false; $('result-title').textContent = title; $('result-text').textContent = text; $('result-kicker').textContent = kicker;
    $('resume').hidden = state !== 'paused'; $('play-again').hidden = state !== 'lost'; (state === 'paused' ? $('resume') : $('play-again')).focus(); }
  function pause() { heldKeys.clear(); if (state === 'playing') { state = 'paused'; stopVoice(); $('pause').textContent = '继续'; showOverlay('暂停中', '果子们很想你', '稍微歇一下'); } else if (state === 'paused') resume(); }
  function resume() { if (state !== 'paused') return; state = 'playing'; $('overlay').hidden = true; $('pause').textContent = '暂停'; lastFrame = 0; canvas.focus({ preventScroll: true }); }
  function restart() { stopVoice(); heldKeys.clear(); balls = []; particles = []; score = 0; highest = 0; state = 'playing'; current = randomLevel(); next = randomLevel(); aim = WIDTH / 2; cooldown = danger = elapsed = accumulator = 0;
    $('overlay').hidden = $('win-banner').hidden = true; $('hint').hidden = false; $('pause').disabled = false; $('pause').textContent = '暂停'; $('status').textContent = '找准落点，让相同的果果相遇。'; updateUI(); canvas.focus({ preventScroll: true }); }
  function pointer(e) { const rect = canvas.getBoundingClientRect(); aim = clamp((e.clientX - rect.left) / rect.width * WIDTH, 0, WIDTH); }
  let pointerId = null;
  canvas.addEventListener('pointerdown', e => { if (state !== 'playing' || pointerId !== null) return; e.preventDefault(); pointerId = e.pointerId; pointer(e); canvas.setPointerCapture(e.pointerId); canvas.focus({ preventScroll: true }); });
  canvas.addEventListener('pointermove', e => { if (pointerId === null || pointerId === e.pointerId) pointer(e); });
  canvas.addEventListener('pointerup', e => { if (e.pointerId !== pointerId) return; pointer(e); pointerId = null; drop(); });
  canvas.addEventListener('pointercancel', () => { pointerId = null; });
  canvas.addEventListener('keydown', e => {
    if (['ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) {
      e.preventDefault(); if (state !== 'playing') return;
      if (e.key.startsWith('Arrow')) { heldKeys.add(e.key); if (!e.repeat) aim = clamp(aim + (e.key === 'ArrowRight' ? 18 : -18), 0, WIDTH); }
      else if (!e.repeat) drop();
    }
    if (e.key.toLowerCase() === 'p' && !e.repeat) pause();
  });
  window.addEventListener('keyup', e => heldKeys.delete(e.key));
  window.addEventListener('blur', () => heldKeys.clear());
  canvas.addEventListener('blur', () => heldKeys.clear());
  $('pause').onclick = pause; $('resume').onclick = resume; $('play-again').onclick = restart; $('win-again').onclick = restart;
  $('restart').onclick = () => { if (!balls.length) return restart(); restartWasPlaying = state === 'playing'; $('restart-dialog').showModal(); };
  $('cancel-restart').onclick = () => $('restart-dialog').close();
  $('confirm-restart').onclick = () => { $('restart-dialog').close(); restart(); };
  $('restart-dialog').addEventListener('close', () => { if (restartWasPlaying) lastFrame = 0; });
  $('sound').onclick = async () => {
    sound = !sound;
    $('sound').setAttribute('aria-pressed', String(sound));
    $('sound').setAttribute('aria-label', sound ? '关闭音效' : '开启音效');
    $('sound').querySelector('span').textContent = sound ? '开' : '关';
    if (!sound) stopVoice();
    await unlockAudio();
    if (sound) tone(current);
  };
  $('music').onclick = async () => {
    music = !music;
    $('music').setAttribute('aria-pressed', String(music));
    $('music').setAttribute('aria-label', music ? '关闭背景音乐' : '开启背景音乐');
    $('music').querySelector('span').textContent = music ? '开' : '关';
    if (!music) bgm.pause();
    await unlockAudio();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { bgm.pause(); if (state === 'playing') pause(); }
    else if (music && audioUnlocked) unlockAudio();
    lastFrame = 0;
  });
  const modelContext = document.modelContext;
  if (modelContext?.registerTool) { const lifecycle = new AbortController(); window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
    try { Promise.resolve(modelContext.registerTool({ name: 'drop_round', title: '放下一颗圆圆', description: '在游戏区指定横向位置放下当前圆形。位置范围为0至480，游戏进行中且冷却结束时可用。', inputSchema: { type: 'object', properties: { x: { type: 'number', minimum: 0, maximum: 480 } }, required: ['x'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input) { if (!input || typeof input.x !== 'number' || !Number.isFinite(input.x) || input.x < 0 || input.x > WIDTH) throw new Error('x 必须在 0 至 480 之间。'); if (!drop(input.x)) throw new Error('游戏暂停、结束或圆形还在冷却，请稍后再试。'); return { score, count: balls.length, nextLevel: current + 1, state }; } }, { signal: lifecycle.signal })).catch(() => {}); } catch {} }
  updateUI(); requestAnimationFrame(frame);
})();
