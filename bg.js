const canvas = document.getElementById("bg-canvas");

if (canvas) {
  const ctx = canvas.getContext("2d");

  if (ctx) {
    let w = 0;
    let h = 0;
    let dpr = 1;
    let diamonds = [];
    let embers = [];
    let lastTime = 0;

    function targetCount() {
      const areaCount = Math.round((w * h) / 60000);
      const cap = w < 760 ? 27 : 38;
      return Math.max(14, Math.min(cap, areaCount));
    }

    function targetEmberCount() {
      const areaCount = Math.round((w * h) / 130000);
      const cap = w < 760 ? 16 : 24;
      return Math.max(6, Math.min(cap, areaCount));
    }

    function syncDiamondCount() {
      const nextCount = targetCount();

      if (diamonds.length > nextCount) {
        diamonds.length = nextCount;
        return;
      }

      while (diamonds.length < nextCount) {
        diamonds.push(new Diamond());
      }
    }

    function syncEmberCount() {
      const nextCount = targetEmberCount();

      if (embers.length > nextCount) {
        embers.length = nextCount;
        return;
      }

      while (embers.length < nextCount) {
        embers.push(new Ember());
      }
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      syncDiamondCount();
      syncEmberCount();
    }

    class Diamond {
      constructor() {
        this.reset(false);
      }

      reset(spawnFromBottom) {
        this.size = 16 + Math.random() * 44;
        this.speed = 0.012 + Math.random() * 0.045;
        this.alpha = 0.011 + Math.random() * 0.027;
        this.lineWidth = 0.6 + Math.random() * 0.6;
        this.hue = 34 + Math.random() * 11;
        this.drift = (Math.random() - 0.5) * 0.03;
        this.phase = Math.random() * Math.PI * 2;
        this.swayAmp = 4 + Math.random() * 12;
        this.x = Math.random() * w;
        this.y = spawnFromBottom ? h + this.size + Math.random() * (h * 0.2) : Math.random() * h;
      }

      update(deltaMs) {
        const delta = deltaMs / 16.67;

        this.y -= this.speed * delta * 10;
        this.phase += 0.008 * delta;
        this.x += this.drift * delta;

        if (this.x < -this.size) this.x = w + this.size;
        if (this.x > w + this.size) this.x = -this.size;

        if (this.y < -this.size * 1.5) {
          this.reset(true);
        }
      }

      draw() {
        const sx = this.x + Math.sin(this.phase) * this.swayAmp;
        const sy = this.y + Math.cos(this.phase * 0.85) * (this.swayAmp * 0.45);
        const flicker = 0.9 + Math.sin(this.phase * 0.7) * 0.07;

        ctx.beginPath();
        ctx.moveTo(sx, sy - this.size);
        ctx.lineTo(sx + this.size, sy);
        ctx.lineTo(sx, sy + this.size);
        ctx.lineTo(sx - this.size, sy);
        ctx.closePath();

        ctx.strokeStyle = `hsla(${this.hue}, 70%, 67%, ${this.alpha * flicker})`;
        ctx.lineWidth = this.lineWidth;
        ctx.stroke();
      }
    }

    class Ember {
      constructor() {
        this.reset(false);
      }

      reset(spawnFromBottom) {
        this.size = 0.75 + Math.random() * 2.05;
        this.speed = 0.02 + Math.random() * 0.085;
        this.alpha = 0.11 + Math.random() * 0.22;
        this.hue = 28 + Math.random() * 22;
        this.drift = (Math.random() - 0.5) * 0.08;
        this.swayAmp = 1.5 + Math.random() * 4;
        this.phase = Math.random() * Math.PI * 2;
        this.x = Math.random() * w;
        this.y = spawnFromBottom ? h + 10 + Math.random() * (h * 0.25) : Math.random() * h;
      }

      update(deltaMs) {
        const delta = deltaMs / 16.67;

        this.y -= this.speed * delta * 10;
        this.phase += 0.018 * delta;
        this.x += this.drift * delta;

        if (this.x < -6) this.x = w + 6;
        if (this.x > w + 6) this.x = -6;

        if (this.y < -12) {
          this.reset(true);
        }
      }

      draw() {
        const sx = this.x + Math.sin(this.phase) * this.swayAmp;
        const sy = this.y + Math.cos(this.phase * 0.9) * (this.swayAmp * 0.35);
        const flicker = 0.84 + Math.sin(this.phase * 1.9) * 0.16;
        const glowRadius = this.size * 4.8;

        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowRadius);
        glow.addColorStop(0, `hsla(${this.hue}, 96%, 66%, ${this.alpha * flicker * 0.5})`);
        glow.addColorStop(1, `hsla(${this.hue}, 96%, 66%, 0)`);

        ctx.beginPath();
        ctx.arc(sx, sy, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(sx, sy, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 100%, 74%, ${this.alpha * flicker})`;
        ctx.fill();
      }
    }

    function animate(time) {
      if (!lastTime) lastTime = time;
      const deltaMs = Math.min(32, time - lastTime);
      lastTime = time;

      // Higher fill alpha reduces long trails, which makes movement feel calmer.
      ctx.fillStyle = "rgba(5, 5, 7, 0.43)";
      ctx.fillRect(0, 0, w, h);

      diamonds.forEach((diamond) => {
        diamond.update(deltaMs);
        diamond.draw();
      });

      embers.forEach((ember) => {
        ember.update(deltaMs);
        ember.draw();
      });

      requestAnimationFrame(animate);
    }

    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(animate);
  }
}
