// ============================================================
//  Cloudscape — fond nuages animé WebGL (port vanilla).
//  Monte sur #heroClouds (hero) et tout canvas #contactClouds (sections).
//  Couleurs via data-attributes ; data-fixed="true" => plein viewport.
// ============================================================
(function () {
    function mount(canvas) {
        if (!canvas) return;
        const fixed = canvas.dataset.fixed === 'true';
        const host = canvas.parentElement;
        const gl = canvas.getContext('webgl', { antialias: true, alpha: true });
        if (!gl) return;

        const cfg = {
            colorBottom: canvas.dataset.bottom || '#5a9e82',
            colorMid: canvas.dataset.mid || '#a9d7c3',
            colorTop: canvas.dataset.top || '#f2faf6',
            speed: parseFloat(canvas.dataset.speed || '1'),
        };

        const vert = `attribute vec2 position;void main(){gl_Position=vec4(position,0.0,1.0);}`;
        const frag = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_colorBottom;
uniform vec3 u_colorMid;
uniform vec3 u_colorTop;
uniform float u_speed;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p);vec2 f=fract(p);
  float a=hash(i);float b=hash(i+vec2(1.0,0.0));float c=hash(i+vec2(0.0,1.0));float d=hash(i+vec2(1.0,1.0));
  vec2 u=f*f*(3.0-2.0*f);
  return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
}
float fbm(vec2 p,float t){
  float v=0.0;float a=0.5;float fi=0.0;
  mat2 rot=mat2(0.86,0.51,-0.51,0.86);
  for(int i=0;i<6;i++){
    vec2 morph=vec2(sin(t*0.5+fi),cos(t*0.3-fi))*0.05;
    v+=a*noise(p+morph);
    p=rot*p*2.0;a*=0.5;fi+=1.0;
  }
  return v;
}
void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution;
  float t=u_time*u_speed;
  vec2 aspect=vec2(u_resolution.x/max(u_resolution.y,1.0),1.0);
  vec2 p=(uv-0.5)*aspect;
  vec2 wind=vec2(t*0.1,t*0.02);
  float pattern=fbm(p*2.2-wind,t);
  float bandLow=smoothstep(0.3,0.65,pattern);
  float bandHigh=smoothstep(0.7,0.95,pattern);
  vec3 color=mix(u_colorBottom,u_colorMid,bandLow);
  color=mix(color,u_colorTop,bandHigh);
  gl_FragColor=vec4(color,1.0);
}`;

        const compile = (type, src) => {
            const s = gl.createShader(type);
            gl.shaderSource(s, src); gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; }
            return s;
        };
        const vs = compile(gl.VERTEX_SHADER, vert), fs = compile(gl.FRAGMENT_SHADER, frag);
        if (!vs || !fs) return;
        const prog = gl.createProgram();
        gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return; }
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const pos = gl.getAttribLocation(prog, 'position');
        gl.enableVertexAttribArray(pos);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

        const uRes = gl.getUniformLocation(prog, 'u_resolution');
        const uTime = gl.getUniformLocation(prog, 'u_time');
        const uCB = gl.getUniformLocation(prog, 'u_colorBottom');
        const uCM = gl.getUniformLocation(prog, 'u_colorMid');
        const uCT = gl.getUniformLocation(prog, 'u_colorTop');
        const uSpeed = gl.getUniformLocation(prog, 'u_speed');

        const hex = (h) => { const c = h.replace('#', ''); return [parseInt(c.slice(0, 2), 16) / 255, parseInt(c.slice(2, 4), 16) / 255, parseInt(c.slice(4, 6), 16) / 255]; };
        const cb = hex(cfg.colorBottom), cm = hex(cfg.colorMid), ct = hex(cfg.colorTop);

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            let w, h;
            if (fixed) { w = window.innerWidth; h = window.innerHeight; }
            else { const r = host.getBoundingClientRect(); w = r.width; h = r.height; }
            canvas.width = Math.max(1, Math.floor(w * dpr));
            canvas.height = Math.max(1, Math.floor(h * dpr));
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform2f(uRes, canvas.width, canvas.height);
        };
        resize();
        if (fixed) window.addEventListener('resize', resize, { passive: true });
        else new ResizeObserver(resize).observe(host);

        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let raf = 0, visible = true;
        const start = performance.now();
        const draw = (now) => {
            gl.uniform1f(uTime, (now - start) / 1000);
            gl.uniform3f(uCB, cb[0], cb[1], cb[2]);
            gl.uniform3f(uCM, cm[0], cm[1], cm[2]);
            gl.uniform3f(uCT, ct[0], ct[1], ct[2]);
            gl.uniform1f(uSpeed, cfg.speed);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            if (!reduce && visible) raf = requestAnimationFrame(draw);
            else raf = 0;
        };
        raf = requestAnimationFrame(draw);

        if (fixed) {
            document.addEventListener('visibilitychange', () => {
                visible = !document.hidden;
                if (visible && !reduce && raf === 0) raf = requestAnimationFrame(draw);
                if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
            });
        } else if ('IntersectionObserver' in window) {
            new IntersectionObserver((e) => {
                visible = e[0].isIntersecting;
                if (visible && !reduce && raf === 0) raf = requestAnimationFrame(draw);
                if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
            }, { threshold: 0 }).observe(host);
        }
    }

    mount(document.getElementById('heroClouds'));
    mount(document.getElementById('contactClouds'));
})();
