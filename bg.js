const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");

let w, h;
let diamonds = [];

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

class Diamond {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.size = 20 + Math.random() * 60;
    this.speed = 0.05 + Math.random() * 0.15;
    this.alpha = 0.03 + Math.random() * 0.05;
  }

  update() {
    this.y -= this.speed;
    if (this.y < -50) {
      this.reset();
      this.y = h + 50;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.size);
    ctx.lineTo(this.x + this.size, this.y);
    ctx.lineTo(this.x, this.y + this.size);
    ctx.lineTo(this.x - this.size, this.y);
    ctx.closePath();

    ctx.strokeStyle = `rgba(230, 194, 0, ${this.alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

for (let i = 0; i < 60; i++) {
  diamonds.push(new Diamond());
}

function animate() {
  ctx.fillStyle = "rgba(5,5,7,0.25)";
  ctx.fillRect(0, 0, w, h);

  diamonds.forEach(d => {
    d.update();
    d.draw();
  });

  requestAnimationFrame(animate);
}

animate();
