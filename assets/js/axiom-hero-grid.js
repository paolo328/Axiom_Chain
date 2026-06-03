/**
 * Hero isometric grid + rolling cube visual (static-site port of HomeRollingCubeGrid).
 */
(function () {
  var DIRS = [
    { dc: 1, dr: -1 },
    { dc: -1, dr: -1 },
    { dc: 1, dr: 1 },
    { dc: -1, dr: 1 },
  ];

  var COLORS = {
    dark: {
      faceTop: '#7b3ff2',
      faceLeft: '#4f0ce5',
      faceRight: '#3a09ab',
      stroke: 'rgba(255,255,255,0.25)',
      grid: 'rgba(255,255,255,0.07)',
      snake: '#4f0ce5',
    },
    light: {
      faceTop: '#5dffc0',
      faceLeft: '#00ef9f',
      faceRight: '#00b877',
      stroke: 'rgba(0,100,60,0.3)',
      grid: 'rgba(0,0,0,0.07)',
      snake: '#00ef9f',
    },
  };

  var MAX_SNAKES = 12;
  var PATH_LENGTH = 80;
  var LINE_SPACING = 60;
  var ANGLE = 30;
  var CUBE_BOUNDS = { colMin: -4, colMax: 4, rowMin: -4, rowMax: 4 };
  var VIEW_DIR = { x: -1, y: -1, z: 1 };

  var CUBE_VERTICES = {
    v000: { x: 0, y: 0, z: 0 },
    v100: { x: 1, y: 0, z: 0 },
    v010: { x: 0, y: 1, z: 0 },
    v110: { x: 1, y: 1, z: 0 },
    v001: { x: 0, y: 0, z: 1 },
    v101: { x: 1, y: 0, z: 1 },
    v011: { x: 0, y: 1, z: 1 },
    v111: { x: 1, y: 1, z: 1 },
  };

  var CUBE_FACES = [
    { fill: 'faceTop', normal: { x: 0, y: 0, z: 1 }, vertices: ['v111', 'v011', 'v001', 'v101'] },
    { fill: 'faceLeft', normal: { x: -1, y: 0, z: 0 }, vertices: ['v010', 'v000', 'v001', 'v011'] },
    { fill: 'faceRight', normal: { x: 0, y: -1, z: 0 }, vertices: ['v000', 'v100', 'v101', 'v001'] },
    { fill: 'faceRight', normal: { x: 1, y: 0, z: 0 }, vertices: ['v110', 'v111', 'v101', 'v100'] },
    { fill: 'faceLeft', normal: { x: 0, y: 1, z: 0 }, vertices: ['v110', 'v010', 'v011', 'v111'] },
    { fill: 'faceBottom', normal: { x: 0, y: 0, z: -1 }, vertices: ['v010', 'v110', 'v100', 'v000'] },
  ];

  function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  function rotateVec(v, axis, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    if (axis === 'x') {
      return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
    }
    return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
  }

  function dirsEqual(a, b) {
    return a.dc === b.dc && a.dr === b.dr;
  }

  function dirInList(dir, list) {
    for (var i = 0; i < list.length; i++) {
      if (dirsEqual(list[i], dir)) return true;
    }
    return false;
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function getRollPivot(dir) {
    if (dir.dc === 1 && dir.dr === -1) {
      return { angle: Math.PI / 2, axis: 'y', pivot: { x: 1, y: 0, z: 0 }, delta: dir };
    }
    if (dir.dc === -1 && dir.dr === 1) {
      return { angle: -Math.PI / 2, axis: 'y', pivot: { x: 0, y: 0, z: 0 }, delta: dir };
    }
    if (dir.dc === -1 && dir.dr === -1) {
      return { angle: -Math.PI / 2, axis: 'x', pivot: { x: 0, y: 1, z: 0 }, delta: dir };
    }
    return { angle: Math.PI / 2, axis: 'x', pivot: { x: 0, y: 0, z: 0 }, delta: dir };
  }

  function pickNextDir(current, col, row) {
    var options = DIRS.filter(function (d) {
      return d.dc !== -current.dc || d.dr !== -current.dr;
    }).filter(function (d) {
      var nc = col + d.dc;
      var nr = row + d.dr;
      return (
        nc >= CUBE_BOUNDS.colMin &&
        nc <= CUBE_BOUNDS.colMax &&
        nr >= CUBE_BOUNDS.rowMin &&
        nr <= CUBE_BOUNDS.rowMax
      );
    });

    if (!options.length) {
      options = [
        DIRS.find(function (d) {
          return d.dc === -current.dc && d.dr === -current.dr;
        }) || current,
      ];
    }

    if (Math.random() < 0.7 && dirInList(current, options)) return current;
    return options[Math.floor(Math.random() * options.length)];
  }

  function cubePalette() {
    var pal = colors();
    if (!isDark()) {
      return {
        faceTop: pal.faceLeft,
        faceLeft: pal.faceLeft,
        faceRight: pal.faceLeft,
        faceBottom: pal.faceLeft,
        stroke: pal.stroke,
      };
    }
    return {
      faceTop: pal.faceTop,
      faceLeft: pal.faceLeft,
      faceRight: pal.faceRight,
      faceBottom: pal.faceRight,
      stroke: pal.stroke,
    };
  }

  function isDark() {
    return document.documentElement.classList.contains('dark');
  }

  function colors() {
    return isDark() ? COLORS.dark : COLORS.light;
  }

  function GridCanvas(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'axiom-hero-grid__canvas';
    container.appendChild(this.canvas);

    this.gridCache = null;
    this.snakes = [];
    this.cubeState = {
      col: 4,
      row: 4,
      direction: DIRS[0],
      roll: null,
      pauseRemaining: 0.5,
    };
    this.raf = 0;
    this.snakeTimer = 0;
    this.snakeInterval = 800;
    this.lastTs = 0;
    this.running = false;

    this.hw = LINE_SPACING / (2 * Math.tan((ANGLE * Math.PI) / 180));
    this.hh = LINE_SPACING / 2;
    this.layout = { ox: 0, oy: 0, w: 0, h: 0 };

    var self = this;
    this._resize = function () {
      self.resize();
    };
  }

  GridCanvas.prototype.resize = function () {
    var w = this.container.clientWidth;
    var h = this.container.clientHeight;
    if (!w || !h) return;

    this.layout.w = w;
    this.layout.h = h;
    this.layout.ox = Math.floor(w / 2);
    this.layout.oy = Math.floor(h / 2);

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';

    var ctx = this.canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    this.gridCache = null;
    this.draw();
  };

  GridCanvas.prototype.toScreen = function (c, r) {
    return {
      cx: this.layout.ox + c * this.hw,
      cy: this.layout.oy + r * this.hh,
    };
  };

  GridCanvas.prototype.drawGrid = function (ctx) {
    var pal = colors();
    var w = this.layout.w;
    var h = this.layout.h;
    var hw = this.hw;
    var hh = this.hh;
    var ox = this.layout.ox;
    var oy = this.layout.oy;
    var diag = Math.sqrt(w * w + h * h);
    var len = Math.sqrt(hw * hw + hh * hh);
    var sx = hw / len;
    var sy = hh / len;
    var count = Math.ceil(diag / (2 * hw)) + 10;

    ctx.save();
    ctx.strokeStyle = pal.grid;
    ctx.lineWidth = 1;
    for (var t = -count; t <= count; t++) {
      var x = ox + 2 * t * hw;
      ctx.beginPath();
      ctx.moveTo(x - sx * diag, oy - sy * diag);
      ctx.lineTo(x + sx * diag, oy + sy * diag);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - sx * diag, oy + sy * diag);
      ctx.lineTo(x + sx * diag, oy - sy * diag);
      ctx.stroke();
    }
    ctx.restore();
  };

  GridCanvas.prototype.beginCubeRoll = function () {
    var nextDir = pickNextDir(this.cubeState.direction, this.cubeState.col, this.cubeState.row);
    this.cubeState.direction = nextDir;
    var pivot = getRollPivot(nextDir);
    this.cubeState.roll = {
      angle: pivot.angle,
      axis: pivot.axis,
      pivot: pivot.pivot,
      delta: pivot.delta,
      progress: 0,
      duration: 0.78 + Math.random() * 0.16,
      elapsed: 0,
    };
  };

  GridCanvas.prototype.updateCube = function (dt) {
    if (this.cubeState.pauseRemaining > 0) {
      this.cubeState.pauseRemaining -= dt;
      return true;
    }

    if (!this.cubeState.roll) {
      this.beginCubeRoll();
      return true;
    }

    var roll = this.cubeState.roll;
    roll.elapsed += dt;
    var t = Math.min(1, roll.elapsed / roll.duration);
    roll.progress = easeInOut(t);

    if (t >= 1) {
      this.cubeState.col += roll.delta.dc;
      this.cubeState.row += roll.delta.dr;
      this.cubeState.direction = roll.delta;
      this.cubeState.roll = null;
      this.cubeState.pauseRemaining = 0.1 + Math.random() * 0.12;
    }

    return true;
  };

  GridCanvas.prototype.drawCube = function (ctx) {
    var pal = cubePalette();
    var hw = this.hw;
    var hh = this.hh;
    var h = LINE_SPACING;
    var screen = this.toScreen(this.cubeState.col, this.cubeState.row);
    var roll = this.cubeState.roll;
    var progress = roll ? roll.progress : 0;
    var rollAnim = roll
      ? { angle: roll.angle, axis: roll.axis, pivot: roll.pivot }
      : null;
    var polygons = [];

    for (var fi = 0; fi < CUBE_FACES.length; fi++) {
      var face = CUBE_FACES[fi];
      var normal = face.normal;
      if (rollAnim && progress !== 0) {
        normal = rotateVec(normal, rollAnim.axis, rollAnim.angle * progress);
      }
      if (dot(normal, VIEW_DIR) <= 0) continue;

      var verts3d = face.vertices.map(function (key) {
        var v = CUBE_VERTICES[key];
        if (!rollAnim || progress === 0) return v;
        var rel = {
          x: v.x - rollAnim.pivot.x,
          y: v.y - rollAnim.pivot.y,
          z: v.z - rollAnim.pivot.z,
        };
        var rot = rotateVec(rel, rollAnim.axis, rollAnim.angle * progress);
        return {
          x: rot.x + rollAnim.pivot.x,
          y: rot.y + rollAnim.pivot.y,
          z: rot.z + rollAnim.pivot.z,
        };
      });

      var points = verts3d.map(function (v) {
        return [
          screen.cx + (v.x - v.y) * hw,
          screen.cy - (v.x + v.y) * hh - v.z * h,
        ];
      });

      var avgZ =
        verts3d.reduce(function (sum, v) {
          return sum + dot(v, VIEW_DIR);
        }, 0) / verts3d.length;
      var avgY =
        points.reduce(function (sum, p) {
          return sum + p[1];
        }, 0) / points.length;
      var avgX =
        points.reduce(function (sum, p) {
          return sum + p[0];
        }, 0) / points.length;

      polygons.push({
        points: points,
        fill: pal[face.fill] || pal.faceLeft,
        depth: 1000 * avgZ + avgY + avgX / 1000,
      });
    }

    polygons.sort(function (a, b) {
      return a.depth - b.depth;
    });

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 1;
    for (var pi = 0; pi < polygons.length; pi++) {
      var poly = polygons[pi];
      ctx.beginPath();
      ctx.moveTo(poly.points[0][0], poly.points[0][1]);
      for (var pj = 1; pj < poly.points.length; pj++) {
        ctx.lineTo(poly.points[pj][0], poly.points[pj][1]);
      }
      ctx.closePath();
      ctx.fillStyle = poly.fill;
      ctx.fill();
      ctx.strokeStyle = pal.stroke;
      ctx.stroke();
    }
    ctx.restore();
  };

  GridCanvas.prototype.spawnSnake = function () {
    var active = 0;
    var slot = -1;
    for (var i = 0; i < this.snakes.length; i++) {
      if (this.snakes[i].active) active++;
      else if (slot === -1) slot = i;
    }
    if (active >= 12 || slot === -1) return;

    var snake = this.snakes[slot];
    var c = Math.floor((Math.random() - 0.5) * 60);
    var r = Math.floor((Math.random() - 0.5) * 60);
    if (Math.abs(c % 2) !== Math.abs(r % 2)) r += 1;

    snake.active = true;
    snake.progress = Math.random() * (PATH_LENGTH / 2);
    snake.length = 6 + Math.random() * 8;
    snake.speed = 3 + Math.random() * 4;

    var dir = DIRS[Math.floor(Math.random() * DIRS.length)];
    snake.path[0].c = c;
    snake.path[0].r = r;
    for (var j = 1; j < PATH_LENGTH; j++) {
      if (Math.random() > 0.8) {
        var options = DIRS.filter(function (d) {
          return d.dc !== -dir.dc || d.dr !== -dir.dr;
        });
        dir = options[Math.floor(Math.random() * options.length)];
      }
      c += dir.dc;
      r += dir.dr;
      snake.path[j].c = c;
      snake.path[j].r = r;
    }
  };

  GridCanvas.prototype.drawSnakes = function (ctx) {
    var pal = colors();
    var hasActive = false;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 1.5;

    for (var s = 0; s < this.snakes.length; s++) {
      var snake = this.snakes[s];
      if (!snake.active) continue;
      hasActive = true;

      var start = snake.progress - snake.length;
      var i0 = Math.max(0, Math.floor(start));
      var i1 = Math.min(PATH_LENGTH - 2, Math.floor(snake.progress));

      for (var i = i0; i <= i1; i++) {
        var p0 = snake.path[i];
        var p1 = snake.path[i + 1];
        var segStart = Math.max(start, i);
        var segEnd = Math.min(snake.progress, i + 1);
        if (segStart >= segEnd) continue;

        var a = this.toScreen(p0.c, p0.r);
        var b = this.toScreen(p1.c, p1.r);
        var t0 = segStart - i;
        var t1 = segEnd - i;
        var x0 = a.cx + (b.cx - a.cx) * t0;
        var y0 = a.cy + (b.cy - a.cy) * t0;
        var x1 = a.cx + (b.cx - a.cx) * t1;
        var y1 = a.cy + (b.cy - a.cy) * t1;
        var alpha = 1 - (snake.progress - (segStart + segEnd) / 2) / snake.length;

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = pal.snake;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.shadowColor = pal.snake;
        ctx.shadowBlur = 8 * Math.max(0, alpha);
        ctx.stroke();
      }
    }

    ctx.restore();
    return hasActive;
  };

  GridCanvas.prototype.draw = function () {
    var ctx = this.canvas.getContext('2d');
    if (!ctx || !this.layout.w || !this.layout.h) return;

    ctx.clearRect(0, 0, this.layout.w, this.layout.h);

    if (!this.gridCache) {
      this.gridCache = document.createElement('canvas');
    }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (this.gridCache.width !== this.layout.w * dpr || this.gridCache.height !== this.layout.h * dpr) {
      this.gridCache.width = this.layout.w * dpr;
      this.gridCache.height = this.layout.h * dpr;
      var gctx = this.gridCache.getContext('2d');
      gctx.setTransform(1, 0, 0, 1, 0, 0);
      gctx.scale(dpr, dpr);
      this.drawGrid(gctx);
    }
    ctx.drawImage(this.gridCache, 0, 0, this.layout.w, this.layout.h);

    this.drawSnakes(ctx);
    this.drawCube(ctx);
  };

  GridCanvas.prototype.tick = function (ts) {
    if (!this.running) return;
    var dt = this.lastTs ? Math.min((ts - this.lastTs) / 1000, 0.05) : 0;
    this.lastTs = ts;

    var animating = this.updateCube(dt);
    for (var i = 0; i < this.snakes.length; i++) {
      var snake = this.snakes[i];
      if (!snake.active) continue;
      snake.progress += snake.speed * dt;
      if (snake.progress > PATH_LENGTH + snake.length) snake.active = false;
      else animating = true;
    }

    if (this.running) this.draw();
    this.raf = requestAnimationFrame(this._tick);
  };

  GridCanvas.prototype.start = function () {
    this.stop();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.draw();
      return;
    }

    this.snakes = [];
    for (var i = 0; i < MAX_SNAKES; i++) {
      this.snakes.push({
        active: false,
        path: Array.from({ length: PATH_LENGTH }, function () {
          return { c: 0, r: 0 };
        }),
        progress: 0,
        speed: 0,
        length: 0,
      });
    }

    var self = this;
    var initial = Math.floor(12 / 1.5);
    for (var j = 0; j < initial; j++) this.spawnSnake();

    this.running = true;
    this.lastTs = 0;
    this.cubeState = {
      col: 4,
      row: 4,
      direction: DIRS[0],
      roll: null,
      pauseRemaining: 0.5,
    };
    this.snakeTimer = window.setInterval(function () {
      if (document.hidden) return;
      self.spawnSnake();
    }, this.snakeInterval);

    this._tick = function (ts) {
      self.tick(ts);
    };
    this.raf = requestAnimationFrame(this._tick);
  };

  GridCanvas.prototype.stop = function () {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.snakeTimer) clearInterval(this.snakeTimer);
  };

  GridCanvas.prototype.setTheme = function () {
    this.gridCache = null;
    this.draw();
  };

  function buildMarkup() {
    return (
      '<div class="axiom-hero-grid">' +
      '<div class="axiom-hero-grid__fade" aria-hidden="true"></div>' +
      '<div class="axiom-hero-grid__stage"></div>' +
      '</div>'
    );
  }

  function findHeroHost() {
    var headers = document.querySelectorAll('header');
    for (var i = 0; i < headers.length; i++) {
      if (!headers[i].className.includes('100dvh')) continue;
      var candidate = headers[i].querySelector('[class*="md:left-1/2"]');
      if (candidate) return candidate;
    }
    return null;
  }

  function init() {
    if (!window.matchMedia('(min-width: 768px)').matches) return;

    var host = findHeroHost();
    if (!host || host.dataset.axiomHeroGridBound) return;
    host.dataset.axiomHeroGridBound = '1';

    host.innerHTML = buildMarkup();
    var stage = host.querySelector('.axiom-hero-grid__stage');
    var grid = new GridCanvas(stage);

    var ro = new ResizeObserver(function () {
      grid.resize();
    });
    ro.observe(stage);
    window.addEventListener('resize', grid._resize);

    grid.resize();
    grid.start();

    new MutationObserver(function () {
      grid.setTheme();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        grid.stop();
      } else {
        grid.start();
        grid.resize();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
