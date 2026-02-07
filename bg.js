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

    const handFx = createHandFxLayer();

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

      if (handFx) {
        handFx.resize(w, h, dpr);
      }
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
      ctx.fillStyle = "rgba(8, 10, 14, 0.34)";
      ctx.fillRect(0, 0, w, h);

      diamonds.forEach((diamond) => {
        diamond.update(deltaMs);
        diamond.draw();
      });

      embers.forEach((ember) => {
        ember.update(deltaMs);
        ember.draw();
      });

      if (handFx) {
        handFx.render(time * 0.001);
      }

      requestAnimationFrame(animate);
    }

    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(animate);
  }
}

function createHandFxLayer() {
  const webglCanvas = document.createElement("canvas");
  webglCanvas.id = "hand-fx-canvas";
  document.body.prepend(webglCanvas);

  const gl = webglCanvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false
  });

  if (!gl) {
    webglCanvas.remove();
    return null;
  }

  const vertexSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;

    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision mediump float;

    varying vec2 v_uv;

    uniform sampler2D u_tex;
    uniform float u_time;
    uniform float u_intensity;

    uniform vec2 u_centerA;
    uniform vec2 u_centerB;
    uniform vec2 u_centerC;

    uniform vec2 u_scaleA;
    uniform vec2 u_scaleB;
    uniform vec2 u_scaleC;

    uniform float u_rotA;
    uniform float u_rotB;
    uniform float u_rotC;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);

      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(a, b, u.x) +
             (c - a) * u.y * (1.0 - u.x) +
             (d - b) * u.x * u.y;
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amp = 0.5;

      for (int i = 0; i < 4; i++) {
        value += amp * noise(p);
        p *= 2.0;
        amp *= 0.5;
      }

      return value;
    }

    vec2 rotate2d(vec2 p, float a) {
      float s = sin(a);
      float c = cos(a);
      return mat2(c, -s, s, c) * p;
    }

    vec4 composite(vec4 base, vec4 layer) {
      vec4 outColor = base;
      outColor.rgb += layer.rgb * layer.a * (1.0 - outColor.a);
      outColor.a += layer.a * (1.0 - outColor.a);
      return outColor;
    }

    vec4 sampleHand(vec2 center, vec2 scale, float rot, float phase) {
      vec2 p = (v_uv - center) / scale + vec2(0.5);
      p = rotate2d(p - 0.5, rot) + 0.5;

      if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) {
        return vec4(0.0);
      }

      float n = fbm(p * 5.4 + vec2(phase * 3.6, phase * 2.2) + u_time * 0.24);
      vec2 fromCenter = p - 0.5;
      float radius = length(fromCenter);
      vec2 dir = radius > 0.0001 ? fromCenter / radius : vec2(0.0, 1.0);

      // Keep a faint radial component, but bias toward low-amplitude surface crawl.
      float rippleA = sin(radius * 34.0 - u_time * 1.1 + phase * 7.0);
      float rippleB = sin(radius * 56.0 - u_time * 1.6 + phase * 4.0);
      float ripple = rippleA * 0.6 + rippleB * 0.4;

      float envelope = smoothstep(0.58, 0.02, radius);

      vec2 crawlA = vec2(
        noise(p * 12.5 + vec2(u_time * 0.34, -u_time * 0.3) + phase),
        noise(p.yx * 12.5 + vec2(-u_time * 0.29, u_time * 0.33) + phase)
      ) - 0.5;

      vec2 crawlB = vec2(
        noise(p * 20.0 + vec2(u_time * 0.46, u_time * 0.41) + phase * 1.3),
        noise(p.yx * 20.0 + vec2(-u_time * 0.39, -u_time * 0.43) + phase * 1.3)
      ) - 0.5;

      vec2 crawl = crawlA * 0.7 + crawlB * 0.3;

      vec2 warp = dir * ripple * (0.0023 * u_intensity * envelope);
      warp += crawl * (0.0058 * u_intensity);

      vec2 uv = clamp(p + warp, 0.0, 1.0);
      vec4 sampleTex = texture2D(u_tex, uv);

      float alpha = sampleTex.a;
      if (alpha < 0.01) {
        return vec4(0.0);
      }

      float pulse = 0.965 + 0.035 * sin(u_time * 0.95 + phase * 6.283 + n * 1.8);
      vec3 color = sampleTex.rgb * (0.94 + 0.01 * n);

      return vec4(color, alpha * pulse * 0.66);
    }

    void main() {
      vec4 color = vec4(0.0);

      color = composite(color, sampleHand(u_centerA, u_scaleA, u_rotA, 0.11));
      color = composite(color, sampleHand(u_centerB, u_scaleB, u_rotB, 0.53));
      color = composite(color, sampleHand(u_centerC, u_scaleC, u_rotC, 0.89));

      color.a *= 0.88;
      gl_FragColor = color;
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  function createProgram(vertex, fragment) {
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertex);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragment);

    if (!vertexShader || !fragmentShader) {
      return null;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  const program = createProgram(vertexSource, fragmentSource);

  if (!program) {
    webglCanvas.remove();
    return null;
  }

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1
    ]),
    gl.STATIC_DRAW
  );

  const aPosition = gl.getAttribLocation(program, "a_position");
  const uTex = gl.getUniformLocation(program, "u_tex");
  const uTime = gl.getUniformLocation(program, "u_time");
  const uIntensity = gl.getUniformLocation(program, "u_intensity");

  const uCenterA = gl.getUniformLocation(program, "u_centerA");
  const uCenterB = gl.getUniformLocation(program, "u_centerB");
  const uCenterC = gl.getUniformLocation(program, "u_centerC");

  const uScaleA = gl.getUniformLocation(program, "u_scaleA");
  const uScaleB = gl.getUniformLocation(program, "u_scaleB");
  const uScaleC = gl.getUniformLocation(program, "u_scaleC");

  const uRotA = gl.getUniformLocation(program, "u_rotA");
  const uRotB = gl.getUniformLocation(program, "u_rotB");
  const uRotC = gl.getUniformLocation(program, "u_rotC");

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0])
  );

  let textureReady = false;
  const layout = {
    centerA: [0.31, 0.86],
    centerB: [0.69, 0.86],
    centerC: [0.5, 0.38],
    scaleA: [0.46, 0.46],
    scaleB: [0.46, 0.46],
    scaleC: [0.46, 0.46],
    rotA: -0.06,
    rotB: 0.06,
    rotC: 0.0
  };

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    textureReady = true;
    document.body.classList.add("webgl-hands-active");
  };
  image.src = "/assets/logo/logo_transparent.webp";

  function updateLayout(width, height) {
    const mobile = width < 760;
    const size = mobile ? Math.min(width * 0.64, 360) : Math.min(width * 0.35, 515);
    const sx = (size / width) * 1.14;
    const sy = size / height;

    if (mobile) {
      layout.centerA = [0.27, 0.87];
      layout.centerB = [0.73, 0.87];
      layout.centerC = [0.5, 0.41];
    } else {
      layout.centerA = [0.31, 0.86];
      layout.centerB = [0.69, 0.86];
      layout.centerC = [0.5, 0.38];
    }

    layout.scaleA = [sx, sy];
    layout.scaleB = [sx, sy];
    layout.scaleC = [sx, sy];
  }

  function resize(width, height, dpr) {
    webglCanvas.width = Math.floor(width * dpr);
    webglCanvas.height = Math.floor(height * dpr);
    webglCanvas.style.width = `${width}px`;
    webglCanvas.style.height = `${height}px`;

    gl.viewport(0, 0, webglCanvas.width, webglCanvas.height);
    updateLayout(width, height);
  }

  function render(time) {
    if (!textureReady) {
      return;
    }

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    if (uTex) gl.uniform1i(uTex, 0);
    if (uTime) gl.uniform1f(uTime, time);
    if (uIntensity) gl.uniform1f(uIntensity, 1.0);

    const toGlY = (y) => 1.0 - y;
    if (uCenterA) gl.uniform2f(uCenterA, layout.centerA[0], toGlY(layout.centerA[1]));
    if (uCenterB) gl.uniform2f(uCenterB, layout.centerB[0], toGlY(layout.centerB[1]));
    if (uCenterC) gl.uniform2f(uCenterC, layout.centerC[0], toGlY(layout.centerC[1]));

    if (uScaleA) gl.uniform2f(uScaleA, layout.scaleA[0], layout.scaleA[1]);
    if (uScaleB) gl.uniform2f(uScaleB, layout.scaleB[0], layout.scaleB[1]);
    if (uScaleC) gl.uniform2f(uScaleC, layout.scaleC[0], layout.scaleC[1]);

    if (uRotA) gl.uniform1f(uRotA, layout.rotA);
    if (uRotB) gl.uniform1f(uRotB, layout.rotB);
    if (uRotC) gl.uniform1f(uRotC, layout.rotC);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  return {
    resize,
    render
  };
}
