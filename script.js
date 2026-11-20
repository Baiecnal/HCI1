(function () {
  "use strict";

  var $ = function (selector) {
    return document.querySelector(selector);
  };

  var root = document.documentElement;

  var store = {
    get: function (key) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        return null;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {}
    }
  };

  /* THEME AND PROFILE CARD */

  var themeBtn = $("#themeBtn");
  var themeLabel = $("#themeLabel");
  var photoImg = $("#photoImg");
  var profileName = $("#profileName");
  var profileLabel = $("#profileLabel");
  var profileValue = $("#profileValue");
  var superpowerValue = $("#superpowerValue");

  function setTheme(theme) {
    var isDark = theme === "dark";

    root.setAttribute("data-theme", theme);

    themeLabel.textContent = isDark ? "Light mode" : "Dark mode";
    themeBtn.setAttribute("aria-pressed", String(isDark));

    if (isDark) {
      photoImg.src = "mcdo.jpeg";
      photoImg.alt = "BAIII, service crew";

      profileName.textContent = "BAIII";
      profileLabel.textContent = "ROLE";
      profileValue.textContent = "Service Crew";
      superpowerValue.textContent = "Silent hustler";
    } else {
      photoImg.src = "normal.jpeg";
      photoImg.alt = "Lance Cyril R. Cariliman";

      profileName.textContent = "LANCE CYRIL R. CARILIMAN";
      profileLabel.textContent = "COURSE";
      profileValue.textContent = "BSIT 3";
      superpowerValue.textContent = "None";
    }

    store.set("lc-theme", theme);
  }

  var savedTheme = store.get("lc-theme");

  setTheme(
    savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : "dark"
  );

  themeBtn.addEventListener("click", function () {
    var currentTheme = root.getAttribute("data-theme");

    setTheme(currentTheme === "dark" ? "light" : "dark");
  });

  /* MOBILE NAVIGATION */

  var menuToggle = $("#menuToggle");
  var nav = $("#nav");

  menuToggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation"
    );

    menuToggle.textContent = open ? "×" : "☰";
  });

  Array.prototype.forEach.call(nav.querySelectorAll("a"), function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      menuToggle.textContent = "☰";
    });
  });

  /* READING PROGRESS */

  var progress = $("#progress");
  var navLinks = Array.prototype.slice.call(
    nav.querySelectorAll("a")
  );

  function onScroll() {
    var max =
      document.documentElement.scrollHeight - window.innerHeight;

    progress.style.width =
      (max > 0
        ? Math.min(100, window.scrollY / max * 100)
        : 0) + "%";

    var current = "";

    navLinks.forEach(function (link) {
      var section = document.querySelector(
        link.getAttribute("href")
      );

      if (section && section.getBoundingClientRect().top <= 130) {
        current = link.getAttribute("href");
      }
    });

    navLinks.forEach(function (link) {
      if (link.getAttribute("href") === current) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* SWITCH UP GAME */

  var POOL = [
    "Push-ups", "Squats", "Plank", "Lunges", "Sit-ups",
    "Jacks", "Burpees", "Crunches", "Climbers", "Dips",
    "High knees", "Wall sit"
  ];

  var DURATION = 30000;
  var SWITCH_AT = [8000, 16000, 24000];
  var WARNING = 1200;

  var board = $("#board");
  var startBtn = $("#start");
  var promptEl = $("#prompt");
  var ruleEl = $("#rule");
  var targetEl = $("#target");
  var hintEl = $("#hint");

  var timeEl = $("#time");
  var scoreEl = $("#score");
  var comboEl = $("#combo");
  var bestEl = $("#best");
  var barEl = $("#bar");
  var feedEl = $("#feed");
  var resultEl = $("#result");

  var tileEls = [];
  var bestScore = parseInt(store.get("lc-best") || "0", 10) || 0;

  bestEl.textContent = bestScore;

  for (var i = 0; i < 9; i++) {
    var tile = document.createElement("button");

    tile.type = "button";
    tile.className = "tile";
    tile.innerHTML =
      '<span class="n">' + (i + 1) +
      '</span><span class="t"></span>';

    (function (index) {
      tile.addEventListener("click", function () {
        tap(index);
      });
    })(i);

    board.appendChild(tile);
    tileEls.push(tile);
  }

  var game = {
    on: false,
    start: 0,
    penalty: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    taps: 0,
    hits: 0,
    rule: "tap",
    target: "Squats",
    tiles: [],
    switchIndex: 0,
    warned: false,
    afterSwitchTaps: 0,
    afterSwitchHits: 0,
    raf: 0
  };

  function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];

      array[i] = array[j];
      array[j] = temp;
    }

    return array;
  }

  function pick(exclude) {
    var list = POOL.filter(function (item) {
      return item !== exclude;
    });

    return list[Math.floor(Math.random() * list.length)];
  }

  function deal() {
    var others = shuffle(
      POOL.filter(function (item) {
        return item !== game.target;
      })
    );

    var tiles = game.rule === "tap"
      ? [game.target].concat(others.slice(0, 8))
      : [game.target, game.target, game.target].concat(
          others.slice(0, 6)
        );

    game.tiles = shuffle(tiles);

    tileEls.forEach(function (element, index) {
      element.querySelector(".t").textContent = game.tiles[index];
      element.classList.remove("ok", "no");
    });

    board.setAttribute("data-rule", game.rule);
  }

  function setPrompt() {
    promptEl.setAttribute(
      "data-mode",
      game.rule === "tap" ? "tap" : "avoid"
    );

    ruleEl.textContent = game.rule === "tap" ? "TAP" : "NOT";
    targetEl.textContent = game.target;

    hintEl.textContent = game.rule === "tap"
      ? "Tap the " + game.target + " tile."
      : "Tap any tile except " + game.target + ".";
  }

  function feed(message, kind) {
    feedEl.textContent = message;
    feedEl.className = "game-feed" + (kind ? " " + kind : "");
  }

  function updateHud() {
    scoreEl.textContent = game.score;
    comboEl.textContent = game.combo;
  }

  function tap(index) {
    if (!game.on) return;

    var isTarget = game.tiles[index] === game.target;

    var correct = game.rule === "tap"
      ? isTarget
      : !isTarget;

    game.taps++;

    if (game.afterSwitchTaps < 3) {
      game.afterSwitchTaps++;
      game.afterSwitchHits += correct ? 1 : 0;
    }

    var element = tileEls[index];

    if (correct) {
      game.hits++;
      game.combo++;

      game.bestCombo = Math.max(
        game.bestCombo,
        game.combo
      );

      var points = 10 * (1 + Math.floor(game.combo / 5));

      game.score += points;

      feed(
        "+" + points +
        (game.combo >= 5 ? " / COMBO" : ""),
        "ok"
      );
    } else {
      game.combo = 0;
      game.penalty += 1000;
      feed("Wrong move. One second deducted.", "no");
    }

    element.classList.remove("ok", "no");
    void element.offsetWidth;
    element.classList.add(correct ? "ok" : "no");

    window.setTimeout(function () {
      element.classList.remove("ok", "no");
    }, 240);

    deal();
    updateHud();
  }

  function switchRule() {
    game.rule = game.rule === "tap" ? "avoid" : "tap";
    game.target = pick(game.target);
    game.afterSwitchTaps = 0;

    deal();
    setPrompt();

    promptEl.classList.remove("flash");
    void promptEl.offsetWidth;
    promptEl.classList.add("flash");
  }

  function frame() {
    if (!game.on) return;

    var elapsed = performance.now() - game.start;
    var remaining = DURATION - elapsed - game.penalty;

    if (remaining <= 0) {
      endGame();
      return;
    }

    var switchTime = SWITCH_AT[game.switchIndex];

    if (switchTime !== undefined) {
      if (
        !game.warned &&
        elapsed >= switchTime - WARNING
      ) {
        game.warned = true;
        board.setAttribute("data-warn", "");
        hintEl.textContent = "The rule changes soon!";
      }

      if (elapsed >= switchTime) {
        game.switchIndex++;
        game.warned = false;
        board.removeAttribute("data-warn");
        switchRule();
      }
    }

    timeEl.textContent = Math.max(
      0,
      remaining / 1000
    ).toFixed(1);

    barEl.style.width =
      Math.max(0, remaining / DURATION * 100) + "%";

    game.raf = requestAnimationFrame(frame);
  }

  function rankFor(score) {
    if (score < 200) return "Warm-up";
    if (score < 400) return "On the floor";
    if (score < 600) return "Shift lead";

    return "Unstoppable";
  }

  function startGame() {
    cancelAnimationFrame(game.raf);

    Object.assign(game, {
      on: true,
      start: 0,
      penalty: 0,
      score: 0,
      combo: 0,
      bestCombo: 0,
      taps: 0,
      hits: 0,
      rule: "tap",
      target: pick(""),
      switchIndex: 0,
      warned: false,
      afterSwitchTaps: 0,
      afterSwitchHits: 0
    });

    resultEl.hidden = true;
    board.setAttribute("data-state", "play");
    board.removeAttribute("data-warn");

    startBtn.textContent = "Restart challenge ↻";

    deal();
    setPrompt();
    updateHud();
    feed("Go! Follow the instruction.", "");

    game.start = performance.now();
    game.raf = requestAnimationFrame(frame);
  }

  function endGame() {
    game.on = false;
    cancelAnimationFrame(game.raf);

    board.setAttribute("data-state", "done");
    board.removeAttribute("data-warn");

    timeEl.textContent = "0.0";
    barEl.style.width = "0%";

    startBtn.textContent = "Play again ↗";

    promptEl.setAttribute("data-mode", "idle");
    ruleEl.textContent = "ROUND COMPLETE";
    targetEl.textContent = "Nice effort.";
    hintEl.textContent = "Check your results and try again.";

    if (game.score > bestScore) {
      bestScore = game.score;
      store.set("lc-best", String(bestScore));
    }

    bestEl.textContent = bestScore;

    $("#rScore").textContent = game.score;
    $("#rRank").textContent = rankFor(game.score);

    $("#rAcc").textContent =
      (game.taps
        ? Math.round(game.hits / game.taps * 100)
        : 0) + "%";

    $("#rCombo").textContent = game.bestCombo;

    $("#rSwitch").textContent = game.afterSwitchTaps
      ? Math.round(
          game.afterSwitchHits / game.afterSwitchTaps * 100
        ) + "%"
      : "n/a";

    $("#rBest").textContent = bestScore;
    resultEl.hidden = false;

    feed("Final score: " + game.score + " / " + rankFor(game.score), "");
  }

  startBtn.addEventListener("click", startGame);

  document.addEventListener("keydown", function (event) {
    if (
      !game.on ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }

    var activeTag = document.activeElement.tagName;

    if (
      /^[1-9]$/.test(event.key) &&
      !/INPUT|TEXTAREA|BUTTON/.test(activeTag)
    ) {
      event.preventDefault();
      tap(Number(event.key) - 1);
    }
  });

  deal();

  /* SIDE-QUEST GENERATOR */

  var IDEAS = [
    ["MOVE", "Hold a plank for one full song, then try a side plank on each arm."],
    ["MOVE", "Try a 10-minute home workout you have never done before."],
    ["MOVE", "Learn a short stretching flow and try it before bed."],
    ["MOVE", "Try shadow boxing for three rounds of one minute."],
    ["MOVE", "Walk a different route and notice three things you usually miss."],
    ["FOOD", "Cook one dish from a cuisine you have never made."],
    ["FOOD", "Order the item on the menu you always skip."],
    ["FOOD", "Swap your usual snack for something you have never tried."],
    ["FOOD", "Make a drink at home that you normally buy."],
    ["SKILL", "Learn five phrases in a language you do not speak."],
    ["SKILL", "Teach yourself the first layer of a Rubik's cube."],
    ["SKILL", "Draw your room from memory, then check what you missed."],
    ["SKILL", "Learn to juggle with three rolled-up socks."],
    ["SKILL", "Learn the first minute of a song."],
    ["MIND", "Read a chapter from a genre you never open."],
    ["MIND", "Write down ten things you have never tried and pick one."],
    ["MIND", "Watch a documentary on a topic you know nothing about."],
    ["PEOPLE", "Ask someone at work what they enjoy on their day off."],
    ["PEOPLE", "Start a conversation with someone you usually just nod at."],
    ["PEOPLE", "Invite a friend to try something neither of you has done."]
  ];

  var rollBtn = $("#rollBtn");
  var triedBtn = $("#triedBtn");
  var rollCat = $("#rollCat");
  var rollIdea = $("#rollIdea");
  var triedCount = $("#triedCount");
  var ideaNumber = $("#ideaNumber");
  var ideaFootnote = $("#ideaFootnote");

  var lastIdea = -1;
  var triedTotal = 0;
  var currentTried = false;
  var rolling = false;
  var currentIdea = -1;

  function randomIdea() {
    var number;

    do {
      number = Math.floor(Math.random() * IDEAS.length);
    } while (number === lastIdea && IDEAS.length > 1);

    return number;
  }

  function showIdea(index) {
    currentIdea = index;

    rollCat.textContent = IDEAS[index][0] + " / SIDE QUEST";

    ideaNumber.textContent =
      String(index + 1).padStart(2, "0") +
      " / " + IDEAS.length;

    rollIdea.textContent = IDEAS[index][1];

    rollIdea.classList.remove("pop");
    void rollIdea.offsetWidth;
    rollIdea.classList.add("pop");

    ideaFootnote.textContent =
      "No pressure. Just pick something that sounds fun.";
  }

  rollBtn.addEventListener("click", function () {
    if (rolling) return;

    rolling = true;
    rollBtn.disabled = true;
    triedBtn.disabled = true;
    currentTried = false;

    triedBtn.textContent = "✓ Mark as tried";

    var finalIndex = randomIdea();
    var steps = 0;

    var timer = window.setInterval(function () {
      showIdea(Math.floor(Math.random() * IDEAS.length));
      steps++;

      if (steps >= 7) {
        window.clearInterval(timer);

        lastIdea = finalIndex;
        showIdea(finalIndex);

        rolling = false;
        rollBtn.disabled = false;
        triedBtn.disabled = false;
      }
    }, 65);
  });

  triedBtn.addEventListener("click", function () {
    if (currentIdea < 0 || currentTried) return;

    currentTried = true;
    triedTotal++;

    triedCount.textContent = triedTotal;
    triedBtn.textContent = "✓ Quest completed";
    triedBtn.disabled = true;

    ideaFootnote.textContent =
      "Nice! One more new experience added to your list.";
  });
})();