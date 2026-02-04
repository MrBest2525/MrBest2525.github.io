const CONFIG = {
    minCount: 1, speedFactor: 50, maxAdditional: 15, spreadRange: 15, baseStarSize: 3.5, 
    gravity: 0.0, globalMax: 500, frontRatio: 0.35,  
    lifeTimeSec: 2.8, lifeTimeRandomSec: 1.2, fullLifeTimeRatio: 0.5 
};

const observerOptions = { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); 
        }
    });
}, observerOptions);

document.querySelectorAll('.glass-block').forEach(block => observer.observe(block));

const cFront = document.getElementById('canvas-front');
const cBack = document.getElementById('canvas-back');
const ctxF = cFront.getContext('2d');
const ctxB = cBack.getContext('2d');
let particlesFront = [], particlesBack = [];
let isFirstMove = true, lastMouseX = 0, lastMouseY = 0, lastScrollY = window.scrollY;

function resize() {
    cFront.width = cBack.width = window.innerWidth;
    cFront.height = cBack.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function drawStar(ctx, x, y, spikes, outerRadius, innerRadius) {
    let rot = Math.PI/2*3, cx=x, cy=y, step=Math.PI/spikes;
    ctx.beginPath(); ctx.moveTo(x, y - outerRadius);
    for(let i=0;i<spikes;i++){
        x=cx+Math.cos(rot)*outerRadius; y=cy+Math.sin(rot)*outerRadius; ctx.lineTo(x,y); rot+=step;
        x=cx+Math.cos(rot)*innerRadius; y=cy+Math.sin(rot)*innerRadius; ctx.lineTo(x,y); rot+=step;
    }
    ctx.closePath();
}

class Particle {
    constructor(x, y, isFront, vyBoost = 0) {
        this.isFront = isFront;
        this.x = x + (Math.random()-0.5)*CONFIG.spreadRange;
        this.y = y + (Math.random()-0.5)*CONFIG.spreadRange;
        this.vx = (Math.random()-0.5)*1.8;
        this.vy = (Math.random()-0.5)*1.8 + vyBoost;
        const sizeVariation = 0.4 + Math.random() * 1.1;
        this.outerRadius = CONFIG.baseStarSize * sizeVariation * (isFront ? 1.0 : 0.6);
        this.innerRadius = this.outerRadius / 2;
        const actualLifeTime = CONFIG.lifeTimeSec + (Math.random() * 2 - 1) * CONFIG.lifeTimeRandomSec;
        this.decay = 1.0 / (60 * Math.max(0.1, actualLifeTime));
        this.life = 1.0;
        this.angle = Math.random()*Math.PI*2;
        this.vAngle = (Math.random()-0.5)*0.06;
        this.hue = 200; this.sat = 80; this.light = 85; 
    }
    update() { 
        this.vx *= 0.98; this.vy += CONFIG.gravity; 
        this.x += this.vx; this.y += this.vy; 
        this.angle += this.vAngle; this.life -= this.decay; 
    }
    draw(ctx) {
        let alpha = this.life > (1.0 - CONFIG.fullLifeTimeRatio) ? 1.0 : Math.max(0, this.life / (1.0 - CONFIG.fullLifeTimeRatio));
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        const brightness = this.isFront ? this.light : this.light - 10;
        ctx.fillStyle = `hsla(${this.hue}, ${this.sat}%, ${brightness}%, ${alpha})`;
        if(this.isFront) { 
            ctx.shadowBlur = 10 * alpha; 
            ctx.shadowColor = `hsla(${this.hue}, ${this.sat}%, 95%, ${alpha})`; 
        }
        drawStar(ctx, 0, 0, 5, this.outerRadius, this.innerRadius); ctx.fill(); ctx.restore();
    }
}

function spawn(x, y, vyBoost = 0) {
    const isFront = Math.random() < CONFIG.frontRatio;
    const p = new Particle(x, y, isFront, vyBoost);
    const target = isFront ? particlesFront : particlesBack;
    target.push(p);
    if (target.length > CONFIG.globalMax * (isFront ? CONFIG.frontRatio : 1-CONFIG.frontRatio)) target.shift();
}

function animate() {
    ctxF.clearRect(0,0,cFront.width,cFront.height);
    ctxB.clearRect(0,0,cBack.width,cBack.height);
    [particlesBack, particlesFront].forEach((arr, idx) => {
        const ctx = idx === 0 ? ctxB : ctxF;
        arr.forEach((p, i) => {
            p.update(); p.draw(ctx);
            if(p.life <= 0) { arr.splice(i, 1); i--; }
        });
    });
    requestAnimationFrame(animate);
}

window.addEventListener('mousemove', (e) => {
    if (isFirstMove) { lastMouseX = e.clientX; lastMouseY = e.clientY; isFirstMove = false; return; }
    const d = Math.sqrt(Math.pow(e.clientX-lastMouseX,2)+Math.pow(e.clientY-lastMouseY,2));
    let count = d < CONFIG.speedFactor ? (Math.random() < d/CONFIG.speedFactor ? CONFIG.minCount : 0) : CONFIG.minCount + Math.min(Math.floor(d/CONFIG.speedFactor), CONFIG.maxAdditional);
    for(let i=0; i<count; i++) spawn(lastMouseX+(e.clientX-lastMouseX)*Math.random(), lastMouseY+(e.clientY-lastMouseY)*Math.random());
    lastMouseX = e.clientX; lastMouseY = e.clientY;
});

window.addEventListener('scroll', () => {
    const diff = window.scrollY - lastScrollY;
    if (Math.abs(diff) > 2) {
        const count = Math.min(Math.floor(Math.abs(diff)/10), 8);
        const spawnY = diff > 0 ? window.innerHeight - 5 : 5;
        for(let i=0; i<count; i++) spawn(Math.random() * window.innerWidth, spawnY, diff > 0 ? -0.8 : 0.8);
    }
    lastScrollY = window.scrollY;
});

animate();