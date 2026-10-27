(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const canvas = $("gameCanvas");

  if (!canvas) {
    console.error("No se encontró el canvas del juego.");
    return;
  }

  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const ui = {
    menu: $("menu"),
    selection: $("selection"),
    gameScreen: $("gameScreen"),
    pauseScreen: $("pauseScreen"),
    gameOver: $("gameOver"),
    endingScreen: $("endingScreen"),
    dialogue: $("dialogue"),
    dialogueText: $("dialogueText"),
    dialogueNext: $("dialogueNext"),
    bossHud: $("bossHud"),
    bossName: $("bossName"),
    bossHealth: $("bossHealth"),
    toast: $("toast"),
    hearts: $("hearts"),
    memoryCount: $("memoryCount"),
    sealCount: $("sealCount"),
    skillState: $("skillState"),
    endingStats: $("endingStats")
  };

  const avatarPaths = [
    "jei1.jpeg",
    "jei2.png",
    "jei3.png",
    "jei4.png"
  ];

  const avatars = avatarPaths.map(src => {
    const img = new Image();
    img.src = src;
    img.onerror = () => console.warn("No se encontró:", src);
    return img;
  });

  let selectedAvatar = 0;
  let state = "menu";
  let levelIndex = 0;
  let cameraX = 0;
  let elapsed = 0;
  let lastTime = 0;

  let player;
  let level;
  let platforms = [];
  let enemies = [];
  let memories = [];
  let projectiles = [];
  let particles = [];
  let boss = null;

  let gateOpen = false;
  let magicUnlocked = false;
  let totalMemories = 0;
  let totalSeals = 0;
  let checkpointX = 70;
  let toastTimer = 0;
  let dialogueQueue = [];
  let dialogueCallback = null;

  const keys = {};
  const touch = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    magic: false
  };

  let jumpPressed = false;
  let attackPressed = false;
  let magicPressed = false;

  const stats = {
    deaths: 0,
    enemies: 0,
    bosses: 0
  };

  const clamp = (v, min, max) =>
    Math.max(min, Math.min(max, v));

  const random = (min, max) =>
    min + Math.random() * (max - min);

  function collision(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function centerX(obj) {
    return obj.x + obj.w / 2;
  }

  const levels = [
    {
      name: "Bosque de las Luciérnagas",
      bossName: "Bruja del Bosque",
      bossType: "forest",
      sky1: "#11172a",
      sky2: "#26344b",
      ground: "#273d36",
      accent: "#b8f7d4",
      length: 3100,
      gateX: 2930,
      enemyCount: 6,
      memories: [
        {
          x: 510,
          y: 335,
          text: "Nos conocimos por un comentario de TikTok. Nunca imaginé que algo tan pequeño nos acercaría tanto."
        },
        {
          x: 1420,
          y: 265,
          text: "Me gustó tu forma de ser y poco a poco te volviste alguien muy especial para mí."
        },
        {
          x: 2310,
          y: 310,
          text: "Aunque nuestra relación sea virtual y exista distancia, lo que siento por ti es real."
        }
      ],
      platforms: [
        [0,455,520,100],
        [600,425,240,130],
        [930,375,180,180],
        [1180,430,300,125],
        [1570,360,210,195],
        [1880,415,250,140],
        [2220,370,190,185],
        [2500,425,250,130],
        [2800,455,300,100]
      ]
    },
    {
      name: "Pantano de los Espejos",
      bossName: "Bruja del Espejo",
      bossType: "mirror",
      sky1: "#111126",
      sky2: "#3a2450",
      ground: "#34304a",
      accent: "#d4b8ff",
      length: 3500,
      gateX: 3340,
      enemyCount: 8,
      memories: [
        {
          x: 620,
          y: 300,
          text: "Cada conversación contigo hizo que quisiera conocerte más."
        },
        {
          x: 1710,
          y: 255,
          text: "No necesito que todo sea perfecto. Quiero seguir creando recuerdos contigo."
        },
        {
          x: 2720,
          y: 300,
          text: "Hoy celebramos tres meses. Este pequeño mundo es mi forma de darte un detalle especial."
        }
      ],
      platforms: [
        [0,455,430,100],
        [510,410,210,145],
        [800,350,180,205],
        [1070,425,250,130],
        [1410,375,210,180],
        [1710,320,190,235],
        [1990,405,260,150],
        [2320,355,200,200],
        [2610,415,260,140],
        [2940,355,190,200],
        [3220,455,300,100]
      ]
    },
    {
      name: "Castillo de las Brujas",
      bossName: "Reina de las Brujas",
      bossType: "queen",
      sky1: "#080811",
      sky2: "#34203b",
      ground: "#3a293d",
      accent: "#ffb8df",
      length: 3900,
      gateX: 3740,
      enemyCount: 10,
      memories: [
        {
          x: 650,
          y: 300,
          text: "Gracias por llegar a mi vida de una manera tan inesperada."
        },
        {
          x: 1900,
          y: 255,
          text: "Quiero que este sea uno de muchos capítulos bonitos de nuestra historia."
        },
        {
          x: 3070,
          y: 300,
          text: "Tres meses contigo: una fecha pequeña, pero un recuerdo enorme para mí."
        }
      ],
      platforms: [
        [0,455,440,100],
        [520,400,190,155],
        [790,340,180,215],
        [1050,420,250,135],
        [1390,360,190,195],
        [1660,310,180,245],
        [1920,400,240,155],
        [2220,345,190,210],
        [2500,405,250,150],
        [2810,345,180,210],
        [3070,400,230,155],
        [3360,350,190,205],
        [3630,455,270,100]
      ]
    }
  ];

  function showScreen(screenName) {
    [
      "menu",
      "selection",
      "gameScreen",
      "pauseScreen",
      "gameOver",
      "endingScreen"
    ].forEach(name => {
      if (ui[name]) {
        ui[name].classList.toggle(
          "hidden",
          name !== screenName
        );
      }
    });

    state = screenName;
  }

  function toast(text, duration = 2200) {
    if (!ui.toast) return;

    ui.toast.textContent = text;
    ui.toast.classList.remove("hidden");
    toastTimer = duration;
  }

  function dialogue(text, callback) {
    if (!ui.dialogue) {
      if (callback) callback();
      return;
    }

    dialogueQueue = Array.isArray(text) ? [...text] : [text];
    dialogueCallback = callback || null;
    nextDialogue();
  }

  function nextDialogue() {
    if (!ui.dialogue) return;

    if (dialogueQueue.length > 0) {
      ui.dialogue.classList.remove("hidden");

      if (ui.dialogueText) {
        ui.dialogueText.textContent = dialogueQueue.shift();
      }

      state = "dialogue";
    } else {
      ui.dialogue.classList.add("hidden");

      const callback = dialogueCallback;
      dialogueCallback = null;

      if (callback) callback();

      if (state === "dialogue") {
        state = "playing";
      }
    }
  }

  function createPlayer() {
    return {
      x: checkpointX,
      y: 350,
      w: 36,
      h: 54,
      vx: 0,
      vy: 0,
      speed: 3.2,
      jump: 10.8,
      grounded: false,
      facing: 1,
      hp: 5,
      invuln: 0,
      attackCooldown: 0,
      attackTimer: 0,
      magicCooldown: 0
    };
  }

  function startLevel(index, newGame = false) {
    levelIndex = index;
    level = levels[index];

    cameraX = 0;
    checkpointX = 70;
    player = createPlayer();

    platforms = level.platforms.map(p => ({
      x: p[0],
      y: p[1],
      w: p[2],
      h: p[3]
    }));

    memories = level.memories.map((m, i) => ({
      ...m,
      w: 28,
      h: 32,
      got: false,
      id: i
    }));

    projectiles = [];
    particles = [];
    enemies = [];
    gateOpen = false;

    boss = {
      x: level.length - 420,
      y: 360,
      w: 62,
      h: 86,
      hp: index === 2 ? 14 : index === 1 ? 10 : 8,
      maxHp: index === 2 ? 14 : index === 1 ? 10 : 8,
      name: level.bossName,
      type: level.bossType,
      alive: true,
      vulnerable: 0,
      attackTimer: 1200,
      hurtTimer: 0,
      phase: 1
    };

    for (let i = 0; i < level.enemyCount; i++) {
      const x = 350 + i * (
        (level.length - 850) / level.enemyCount
      );

      enemies.push({
        x,
        y: 400,
        w: 34,
        h: 42,
        hp: 2,
        alive: true,
        hurt: 0,
        vx: random(-0.7, 0.7),
        baseX: x,
        type: i % 3
      });
    }

    if (newGame) {
      totalMemories = 0;
      totalSeals = 0;
      magicUnlocked = false;

      stats.deaths = 0;
      stats.enemies = 0;
      stats.bosses = 0;
    }

    showScreen("gameScreen");
    state = "playing";
    updateHUD();

    toast(level.name, 2500);

    if (index === 0 && newGame) {
      dialogue([
        "Todo comenzó con un comentario de TikTok.",
        "Ahora tendrás que atravesar tres reinos para encontrar a Jeimer.",
        "Recoge recuerdos, derrota a las brujas y abre el portal."
      ]);
    }
  }

  function updateHUD() {
    if (ui.hearts && player) {
      ui.hearts.textContent =
        "♥".repeat(Math.max(0, player.hp)) +
        "♡".repeat(Math.max(0, 5 - player.hp));
    }

    if (ui.memoryCount) {
      ui.memoryCount.textContent = `${totalMemories}/9`;
    }

    if (ui.sealCount) {
      ui.sealCount.textContent = `${totalSeals}/3`;
    }

    if (ui.skillState) {
      ui.skillState.textContent = magicUnlocked
        ? "Magia desbloqueada"
        : "Magia bloqueada";
    }

    if (ui.bossHud && boss && boss.alive) {
      ui.bossHud.classList.remove("hidden");

      if (ui.bossName) {
        ui.bossName.textContent = boss.name;
      }

      if (ui.bossHealth) {
        ui.bossHealth.style.width =
          `${Math.max(0, boss.hp / boss.maxHp * 100)}%`;
      }
    } else if (ui.bossHud) {
      ui.bossHud.classList.add("hidden");
    }
  }

  function particlesBurst(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x,
        y,
        vx: random(-2.5, 2.5),
        vy: random(-3.5, 1),
        life: random(250, 700),
        max: 700,
        size: random(2, 5),
        color
      });
    }
  }

  function damagePlayer() {
    if (player.invuln > 0 || state !== "playing") return;

    player.hp--;
    player.invuln = 1100;
    player.vx = -player.facing * 4;
    player.vy = -4;

    particlesBurst(
      player.x + player.w / 2,
      player.y + 20,
      "#ff8bb8",
      12
    );

    updateHUD();

    if (player.hp <= 0) {
      stats.deaths++;
      showScreen("gameOver");
    }
  }

  function swordAttack() {
    if (
      state !== "playing" ||
      player.attackCooldown > 0
    ) return;

    player.attackCooldown = 380;
    player.attackTimer = 160;

    const attackBox = {
      x: player.facing > 0
        ? player.x + player.w - 2
        : player.x - 44,
      y: player.y + 8,
      w: 46,
      h: 36
    };

    enemies.forEach(enemy => {
      if (enemy.alive && collision(attackBox, enemy)) {
        enemy.hp--;
        enemy.hurt = 200;
        enemy.x += player.facing * 14;

        particlesBurst(
          enemy.x + enemy.w / 2,
          enemy.y + 15,
          "#f7c8ff",
          8
        );

        if (enemy.hp <= 0) {
          enemy.alive = false;
          stats.enemies++;
        }
      }
    });

    if (boss && boss.alive && collision(attackBox, boss)) {
      if (boss.vulnerable > 0) {
        boss.hp--;
        boss.hurtTimer = 240;

        particlesBurst(
          boss.x + boss.w / 2,
          boss.y + 30,
          "#ffb8df",
          12
        );

        if (boss.hp <= 0) defeatBoss();
        updateHUD();
      } else {
        toast("¡Espera a que la bruja brille para atacarla!");
      }
    }
  }

  function magicAttack() {
    if (!magicUnlocked) {
      toast("Derrota a la primera bruja para desbloquear la magia.");
      return;
    }

    if (player.magicCooldown > 0 || state !== "playing") return;

    player.magicCooldown = 900;

    projectiles.push({
      x: player.facing > 0
        ? player.x + player.w
        : player.x - 18,
      y: player.y + 18,
      w: 18,
      h: 18,
      vx: player.facing * 7,
      vy: 0,
      friendly: true,
      life: 1200
    });

    particlesBurst(
      player.x + player.w / 2,
      player.y + 25,
      "#d4b8ff",
      5
    );
  }

  function defeatBoss() {
    if (!boss || !boss.alive) return;

    boss.alive = false;
    gateOpen = true;
    totalSeals++;
    stats.bosses++;

    if (levelIndex === 0) magicUnlocked = true;

    particlesBurst(
      boss.x + boss.w / 2,
      boss.y + 30,
      "#f7c8ff",
      30
    );

    updateHUD();

    dialogue([
      `${boss.name}: derrotada.`,
      levelIndex === 0
        ? "¡Has desbloqueado la magia! Usa K o el botón ✦."
        : "Has conseguido un sello mágico.",
      "El portal está abierto. Avanza hasta él para continuar."
    ]);
  }

  function collectMemory(memory) {
    memory.got = true;
    totalMemories++;

    particlesBurst(
      memory.x + 14,
      memory.y + 15,
      level.accent,
      16
    );

    updateHUD();
    dialogue(memory.text);
  }

  function respawn() {
    player.hp = 5;
    player.x = checkpointX;
    player.y = 320;
    player.vx = 0;
    player.vy = 0;
    player.invuln = 1300;
    projectiles = [];

    toast("Vuelve a intentarlo 🖤");
    updateHUD();
  }

  function update(dt) {
    elapsed += dt;

    if (toastTimer > 0) {
      toastTimer -= dt;

      if (toastTimer <= 0 && ui.toast) {
        ui.toast.classList.add("hidden");
      }
    }

    particles = particles.filter(p => {
      p.life -= dt;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.025 * dt;
      return p.life > 0;
    });

    if (state !== "playing") return;

    const d = dt / 16.67;

    const left =
      keys.ArrowLeft || keys.KeyA || touch.left;
    const right =
      keys.ArrowRight || keys.KeyD || touch.right;
    const jump =
      keys.Space || keys.ArrowUp || keys.KeyW || touch.jump;
    const attack =
      keys.KeyJ || touch.attack;
    const magic =
      keys.KeyK || touch.magic;

    if (left) {
      player.vx = -player.speed;
      player.facing = -1;
    } else if (right) {
      player.vx = player.speed;
      player.facing = 1;
    } else {
      player.vx *= 0.78;
    }

    if (jump && player.grounded && !jumpPressed) {
      player.vy = -player.jump;
      player.grounded = false;
      particlesBurst(
        player.x + player.w / 2,
        player.y + player.h,
        "#d4b8ff",
        4
      );
    }

    jumpPressed = !!jump;

    if (attack && !attackPressed) swordAttack();
    attackPressed = !!attack;

    if (magic && !magicPressed) magicAttack();
    magicPressed = !!magic;

    player.attackCooldown = Math.max(0, player.attackCooldown - dt);
    player.attackTimer = Math.max(0, player.attackTimer - dt);
    player.magicCooldown = Math.max(0, player.magicCooldown - dt);
    player.invuln = Math.max(0, player.invuln - dt);

    player.x += player.vx * d;
    player.x = clamp(player.x, 0, level.length - player.w);

    player.vy += 0.48 * d;
    player.y += player.vy * d;
    player.grounded = false;

    for (const p of platforms) {
      if (
        player.vy >= 0 &&
        player.x + player.w > p.x &&
        player.x < p.x + p.w &&
        player.y + player.h >= p.y &&
        player.y + player.h - player.vy * d <= p.y + 10
      ) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.grounded = true;
      }
    }

    if (player.y > H + 180) respawn();

    if (
      player.x > level.length * 0.52 &&
      checkpointX < level.length * 0.5
    ) {
      checkpointX = Math.floor(level.length * 0.52);
      toast("Punto de control activado");
    }

    memories.forEach(memory => {
      if (!memory.got && collision(player, {
        x: memory.x,
        y: memory.y,
        w: memory.w,
        h: memory.h
      })) {
        collectMemory(memory);
      }
    });

    enemies.forEach(enemy => {
      if (!enemy.alive) return;

      enemy.hurt = Math.max(0, enemy.hurt - dt);
      enemy.x += enemy.vx * d;

      if (Math.abs(enemy.x - enemy.baseX) > 100) {
        enemy.vx *= -1;
      }

      if (enemy.x < 0 || enemy.x > level.length - 40) {
        enemy.vx *= -1;
      }

      if (collision(player, enemy)) damagePlayer();
    });

    if (boss && boss.alive) {
      boss.hurtTimer = Math.max(0, boss.hurtTimer - dt);
      boss.vulnerable = Math.max(0, boss.vulnerable - dt);
      boss.attackTimer -= dt;

      const distance = centerX(player) - centerX(boss);
      const direction = distance < 0 ? -1 : 1;

      if (boss.type === "queen" && boss.hp <= boss.maxHp * 0.45) {
        boss.phase = 2;
      }

      if (boss.attackTimer <= 0) {
        boss.attackTimer =
          boss.type === "queen" && boss.phase === 2
            ? 950
            : 1450;

        boss.vulnerable =
          boss.type === "forest" ? 850 :
          boss.type === "mirror" ? 620 : 500;

        projectiles.push({
          x: boss.x + boss.w / 2,
          y: boss.y + 28,
          w: 20,
          h: 20,
          vx: direction * (
            boss.type === "queen" && boss.phase === 2 ? 4.5 : 3.3
          ),
          vy: -1.2,
          friendly: false,
          life: 2200
        });

        if (boss.type === "mirror") {
          projectiles.push({
            x: boss.x + boss.w / 2,
            y: boss.y + 45,
            w: 18,
            h: 18,
            vx: -direction * 3,
            vy: -0.5,
            friendly: false,
            life: 1900
          });
        }

        toast("¡Esquiva el ataque y contraataca cuando brille!");
      }

      if (boss.vulnerable > 0) {
        boss.x += Math.sign(distance) * 0.25 * d;
      }

      if (collision(player, boss)) damagePlayer();
    }

    projectiles = projectiles.filter(p => {
      p.life -= dt;
      p.x += p.vx * d;
      p.y += p.vy * d;

      if (p.friendly) {
        for (const enemy of enemies) {
          if (enemy.alive && collision(p, enemy)) {
            enemy.hp -= 2;
            enemy.hurt = 180;

            particlesBurst(
              enemy.x + enemy.w / 2,
              enemy.y + 10,
              "#d4b8ff",
              8
            );

            if (enemy.hp <= 0) {
              enemy.alive = false;
              stats.enemies++;
            }

            return false;
          }
        }

        if (boss && boss.alive && collision(p, boss)) {
          if (boss.vulnerable > 0) {
            boss.hp -= 2;
            boss.hurtTimer = 250;

            particlesBurst(
              boss.x + boss.w / 2,
              boss.y + 20,
              "#d4b8ff",
              10
            );

            if (boss.hp <= 0) defeatBoss();
            updateHUD();
          } else {
            toast("La bruja está protegida.");
          }

          return false;
        }
      } else if (collision(p, player)) {
        damagePlayer();
        return false;
      }

      return (
        p.life > 0 &&
        p.x > cameraX - 100 &&
        p.x < cameraX + W + 100
      );
    });

    if (
      player.x + player.w > level.gateX &&
      player.x < level.gateX + 90
    ) {
      if (gateOpen) {
        if (levelIndex < levels.length - 1) {
          startLevel(levelIndex + 1);
          dialogue(
            levelIndex === 1
              ? "El pantano quedó atrás. La Reina de las Brujas te espera."
              : "Has llegado al último reino. Sigue adelante por Jeimer."
          );
        } else {
          finishGame();
        }
      } else {
        player.x = level.gateX - player.w - 4;
        toast("El portal está sellado. Derrota a la bruja.");
      }
    }

    cameraX = clamp(player.x - W * 0.38, 0, level.length - W);
    updateHUD();
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, level.sky1);
    gradient.addColorStop(1, level.sky2);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(242,220,255,.7)";
    ctx.beginPath();
    ctx.arc(W - 115, 85, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = level.sky1;
    ctx.beginPath();
    ctx.arc(W - 100, 74, 30, 0, Math.PI * 2);
    ctx.fill();

    const spacing = [150, 115, 90];
    const heights = [95, 145, 190];
    const colors = [
      "rgba(8,15,27,.28)",
      "rgba(8,13,23,.42)",
      "rgba(5,10,18,.58)"
    ];

    for (let layer = 0; layer < 3; layer++) {
      ctx.fillStyle = colors[layer];
      const gap = spacing[layer];
      const shift = -(cameraX * [0.12, 0.24, 0.42][layer]) % gap;

      for (let x = shift - gap; x < W + gap; x += gap) {
        const h = heights[layer] + Math.sin(x * 0.07 + layer) * 22;

        ctx.beginPath();
        ctx.moveTo(x, H - 75);
        ctx.lineTo(x + gap * 0.48, H - 75 - h);
        ctx.lineTo(x + gap, H - 75);
        ctx.closePath();
        ctx.fill();
      }
    }

    for (let i = 0; i < 34; i++) {
      const x = (
        (i * 137 + elapsed * (0.012 + (i % 3) * 0.006) - cameraX * 0.15)
        % (W + 40) + W + 40
      ) % (W + 40);

      const y = 95 + (i * 53 % 330) + Math.sin(elapsed * 0.002 + i) * 12;

      ctx.globalAlpha = 0.35 + (Math.sin(elapsed * 0.004 + i) + 1) * 0.25;
      ctx.fillStyle = i % 3 === 0 ? level.accent : "#fff0ff";
      ctx.beginPath();
      ctx.arc(x, y, i % 4 === 0 ? 2.5 : 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function drawPlayer() {
    const img = avatars[selectedAvatar];
    const blinking =
      player.invuln > 0 &&
      Math.floor(player.invuln / 90) % 2 === 0;

    if (blinking) ctx.globalAlpha = 0.45;

    if (img && img.complete && img.naturalWidth > 0) {
      if (player.facing < 0) {
        ctx.save();
        ctx.translate(player.x + player.w, player.y);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, player.w, player.h);
        ctx.restore();
      } else {
        ctx.drawImage(
          img,
          player.x,
          player.y,
          player.w,
          player.h
        );
      }
    } else {
      ctx.fillStyle = "#e5c3ee";
      ctx.fillRect(player.x + 5, player.y + 15, player.w - 10, player.h - 15);

      ctx.fillStyle = "#25162e";
      ctx.fillRect(player.x + 3, player.y + 4, player.w - 6, 20);

      ctx.fillStyle = "#fff";
      ctx.fillRect(player.x + 10, player.y + 15, 4, 4);
      ctx.fillRect(player.x + 22, player.y + 15, 4, 4);
    }

    ctx.globalAlpha = 1;
  }

  function drawWorld() {
    drawBackground();
    ctx.save();
    ctx.translate(-cameraX, 0);

    ctx.fillStyle = level.bg || "#171322";
    ctx.fillRect(0, 455, level.length, 100);

    platforms.forEach(p => {
      ctx.fillStyle = level.ground;
      ctx.fillRect(p.x, p.y, p.w, p.h);

      ctx.fillStyle = level.accent;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(p.x, p.y, p.w, 4);
      ctx.globalAlpha = 1;

      for (let x = p.x + 10; x < p.x + p.w; x += 35) {
        ctx.fillStyle = "rgba(0,0,0,.14)";
        ctx.fillRect(x, p.y + 12, 13, 3);
      }
    });

    // Punto de control
    ctx.fillStyle = "#f5b9e7";
    ctx.fillRect(level.length * 0.52, 365, 5, 90);
    ctx.beginPath();
    ctx.moveTo(level.length * 0.52 + 5, 367);
    ctx.lineTo(level.length * 0.52 + 42, 382);
    ctx.lineTo(level.length * 0.52 + 5, 398);
    ctx.fill();

    memories.forEach(m => {
      if (m.got) return;

      const bob = Math.sin(elapsed * 0.004 + m.x) * 5;

      ctx.save();
      ctx.translate(m.x + 13, m.y + 13 + bob);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = level.accent;
      ctx.shadowColor = level.accent;
      ctx.shadowBlur = 16;
      ctx.fillRect(-9, -9, 18, 18);
      ctx.shadowBlur = 0;
      ctx.restore();

      ctx.fillStyle = "#fff";
      ctx.font = "12px sans-serif";
      ctx.fillText("♥", m.x + 7, m.y - 4 + bob);
    });

    enemies.forEach(e => {
      if (!e.alive) return;

      ctx.fillStyle = e.hurt > 0
        ? "#fff"
        : ["#76658f", "#4b657a", "#8b4d73"][e.type];

      ctx.fillRect(e.x, e.y, e.w, e.h);

      ctx.fillStyle = "#f5d8ff";
      ctx.fillRect(e.x + 7, e.y + 11, 5, 5);
      ctx.fillRect(e.x + 22, e.y + 11, 5, 5);

      ctx.fillStyle = "#1b1426";
      ctx.fillRect(e.x + 8, e.y + 12, 2, 3);
      ctx.fillRect(e.x + 23, e.y + 12, 2, 3);
    });

    if (boss && boss.alive) {
      const glowing = boss.vulnerable > 0;

      ctx.fillStyle = boss.hurtTimer > 0
        ? "#fff"
        : glowing ? "#e8caff" : "#63395f";

      ctx.shadowColor = glowing ? "#f6c8ff" : "#9c6bb4";
      ctx.shadowBlur = glowing ? 24 : 9;
      ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#21142c";
      ctx.fillRect(boss.x + 7, boss.y + 18, boss.w - 14, boss.h - 18);

      ctx.fillStyle = "#f9d8ff";
      ctx.fillRect(boss.x + 13, boss.y + 24, 7, 6);
      ctx.fillRect(boss.x + boss.w - 20, boss.y + 24, 7, 6);

      ctx.fillStyle = "#dba6f7";
      ctx.beginPath();
      ctx.moveTo(boss.x + 8, boss.y + 4);
      ctx.lineTo(boss.x + 15, boss.y - 12);
      ctx.lineTo(boss.x + 26, boss.y + 2);
      ctx.lineTo(boss.x + 39, boss.y - 12);
      ctx.lineTo(boss.x + boss.w - 5, boss.y + 5);
      ctx.closePath();
      ctx.fill();

      if (glowing) {
        ctx.strokeStyle = "#fff0ff";
        ctx.lineWidth = 3;
        ctx.strokeRect(boss.x - 4, boss.y - 4, boss.w + 8, boss.h + 8);
      }
    }

    // Portal
    ctx.fillStyle = gateOpen ? "#e8c4ff" : "#55415f";
    ctx.shadowColor = gateOpen ? "#d5a6ff" : "#6e5a78";
    ctx.shadowBlur = gateOpen ? 22 : 4;
    ctx.beginPath();
    ctx.ellipse(level.gateX + 28, 414, 29, 47, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#171322";
    ctx.beginPath();
    ctx.ellipse(level.gateX + 28, 414, 20, 38, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!gateOpen) {
      ctx.fillStyle = "#f2d4ff";
      ctx.font = "20px sans-serif";
      ctx.fillText("✦", level.gateX + 20, 420);
    }

    projectiles.forEach(p => {
      ctx.fillStyle = p.friendly ? "#e9c7ff" : "#ff8ab7";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    drawPlayer();

    if (player.attackTimer > 0) {
      ctx.strokeStyle = "#fff0ff";
      ctx.lineWidth = 4;

      const sx = player.facing > 0
        ? player.x + player.w + 4
        : player.x - 7;

      ctx.beginPath();
      ctx.arc(
        sx,
        player.y + 27,
        25,
        player.facing > 0 ? -1.15 : Math.PI - 1.15,
        player.facing > 0 ? 1.15 : Math.PI + 1.15
      );
      ctx.stroke();
    }

    particles.forEach(p => {
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.fillStyle = "rgba(7,6,15,.52)";
    ctx.fillRect(12, 12, 280, 34);

    ctx.fillStyle = "#f4d9ff";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(`${levelIndex + 1}/3 · ${level.name}`, 23, 34);

    if (boss && boss.alive && Math.abs(centerX(player) - centerX(boss)) < 500) {
      ctx.fillStyle = "rgba(8,6,15,.55)";
      ctx.fillRect(W / 2 - 150, 54, 300, 8);

      ctx.fillStyle = level.accent;
      ctx.fillRect(
        W / 2 - 150,
        54,
        300 * boss.hp / boss.maxHp,
        8
      );
    }
  }

  function finishGame() {
    showScreen("endingScreen");

    if (ui.endingStats) {
      ui.endingStats.textContent =
        `Recuerdos encontrados: ${totalMemories}/9 · ` +
        `Sellos obtenidos: ${totalSeals}/3 · ` +
        `Enemigos vencidos: ${stats.enemies}`;
    }

    if (ui.dialogue) ui.dialogue.classList.add("hidden");
  }

  function bind(id, fn) {
    if ($(id)) $(id).addEventListener("click", fn);
  }

  bind("startBtn", () => showScreen("selection"));
  bind("playBtn", () => {
    checkpointX = 70;
    startLevel(0, true);
  });
  bind("backBtn", () => showScreen("menu"));
  bind("pauseBtn", () => {
    if (state === "playing") showScreen("pauseScreen");
  });
  bind("resumeBtn", () => {
    showScreen("gameScreen");
    state = "playing";
  });
  bind("pauseMenuBtn", () => showScreen("menu"));
  bind("gameOverMenu", () => showScreen("menu"));
  bind("retryBtn", () => startLevel(levelIndex));
  bind("replayBtn", () => {
    checkpointX = 70;
    startLevel(0, true);
  });
  bind("endingMenuBtn", () => showScreen("menu"));
  bind("dialogueNext", nextDialogue);

  document.querySelectorAll("[data-avatar]").forEach(el => {
    el.addEventListener("click", () => {
      selectedAvatar = clamp(Number(el.dataset.avatar) || 0, 0, avatars.length - 1);

      document.querySelectorAll("[data-avatar]").forEach(card => {
        card.classList.toggle("selected", card === el);
      });
    });
  });

  window.addEventListener("keydown", e => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(e.code)) {
      e.preventDefault();
    }

    keys[e.code] = true;

    if (e.code === "Escape" || e.code === "KeyP") {
      if (state === "playing") {
        showScreen("pauseScreen");
      } else if (state === "pauseScreen") {
        showScreen("gameScreen");
        state = "playing";
      }
    }

    if ((e.code === "Enter" || e.code === "Space") && state === "dialogue") {
      e.preventDefault();
      nextDialogue();
    }
  });

  window.addEventListener("keyup", e => {
    keys[e.code] = false;
  });

  window.addEventListener("blur", () => {
    Object.keys(keys).forEach(k => keys[k] = false);
    Object.keys(touch).forEach(k => touch[k] = false);
  });

  document.querySelectorAll("[data-control]").forEach(btn => {
    const control = btn.dataset.control;
    if (!(control in touch)) return;

    const down = e => {
      e.preventDefault();
      touch[control] = true;

      try {
        btn.setPointerCapture(e.pointerId);
      } catch (_) {}
    };

    const up = e => {
      e.preventDefault();
      touch[control] = false;
    };

    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
    btn.addEventListener("lostpointercapture", up);
    btn.addEventListener("contextmenu", e => e.preventDefault());

    btn.style.touchAction = "none";
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      Object.keys(keys).forEach(k => keys[k] = false);
      Object.keys(touch).forEach(k => touch[k] = false);
    }
  });

  function frame(now) {
    const dt = Math.min(34, now - (lastTime || now));
    lastTime = now;

    if (level && player) {
      update(dt);
      drawWorld();
    }

    requestAnimationFrame(frame);
  }

  // Preparación inicial.
  if (ui.dialogue) ui.dialogue.classList.add("hidden");
  if (ui.bossHud) ui.bossHud.classList.add("hidden");
  if (ui.toast) ui.toast.classList.add("hidden");

player = createPlayer();
  showScreen("menu");
  requestAnimationFrame(frame);
})();