import { useEffect, useRef } from 'react';

// Fundos animados em WebGL, desenhados pela placa de vídeo do aparelho.
// - Só roda enquanto aparece na tela e a aba está aberta.
// - Resolução reduzida para poupar bateria.
// - As cores vêm da paleta escolhida (c1, c2, c3 e o fundo B).
// - Sem WebGL, ou com "reduzir movimento", fica o fundo em CSS (ou um quadro parado).
export type ShaderKind = 'brasa' | 'aura' | 'navalha' | 'vital' | 'impulso';

const HEAD = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 r; uniform float t; uniform vec2 m; uniform float s;
uniform vec3 c1; uniform vec3 c2; uniform vec3 c3; uniform vec3 B;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1.,0.)),u.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
`;

const FRAG: Record<ShaderKind, string> = {
  // Chamas no rodapé e brasas subindo, desviando do dedo/mouse.
  brasa: `void main(){
  vec2 uv=gl_FragCoord.xy/r; float asp=r.x/r.y; vec2 p=vec2(uv.x*asp,uv.y);
  vec3 col=mix(B*.95,B*1.45+.01,uv.y);
  float f=fbm(vec2(p.x*2.6+m.x*.4,p.y*3.2-t*1.3));
  float fl=clamp(f*1.7-uv.y*1.75-.16,0.,1.); fl=pow(fl,1.8);
  col+=fl*c1*1.15+pow(fl,3.)*c2*.7;
  for(int L=0;L<3;L++){
    float k=float(L); float sc=7.+k*5.;
    vec2 q=p*sc; q.y-=t*(1.1+k*.55); q.x+=sin(q.y*.4+k*2.+t*.8)*.55+m.x*(1.+k);
    vec2 id=floor(q); vec2 g=fract(q)-.5; float rn=h(id+k*17.);
    if(rn>.82){
      vec2 o=vec2(h(id+3.1),h(id+7.7))-.5; float d=length(g-o*.6);
      float fk=.55+.45*sin(t*9.+rn*60.);
      col+=(1.-smoothstep(0.,.11,d))*fk*(1.15-uv.y*.75)*mix(c2,c3,rn)*(1.-k*.22);
    }
  }
  col*=1.-.35*length(uv-vec2(.5,.35));
  gl_FragColor=vec4(col,1.);
}`,
  // Líquido furta-cor, como bolha de sabão ou madrepérola.
  aura: `void main(){
  vec2 p=(gl_FragCoord.xy-.5*r)/min(r.x,r.y); p+=m*.07; float tt=t*.11;
  vec2 q=vec2(fbm(p*1.5+tt),fbm(p*1.5+vec2(5.2,1.3)-tt));
  vec2 w=vec2(fbm(p*1.5+2.*q+vec2(1.7,9.2)+tt*1.3),fbm(p*1.5+2.*q+vec2(8.3,2.8)-tt));
  float v=fbm(p*1.3+2.4*w); float k=v*1.3+length(w)*.45+tt*.4;
  vec3 col=mix(c1,c2,.5+.5*sin(k*6.2831));
  col=mix(col,c3,(.5+.5*sin(k*4.4+2.))*.7);
  col+=.045*cos(6.2831*(v*2.2+vec3(0.,.33,.67)+tt));
  col=mix(col,vec3(1.),smoothstep(.58,.92,v)*.45);
  col=mix(col,B,.18);
  gl_FragColor=vec4(col,1.);
}`,
  // Fumaça lenta com reflexos das duas cores do poste, e um brilho que passa.
  navalha: `void main(){
  vec2 uv=gl_FragCoord.xy/r; vec2 p=vec2(uv.x*r.x/r.y,uv.y); float tt=t*.09;
  float sm=fbm(p*2.1+vec2(tt*2.,-tt)+fbm(p*1.4-tt+m*.3)*1.6);
  vec3 col=mix(B*.9,B*1.3+.01,uv.y);
  col+=vec3(.6)*pow(sm,3.)*.55;
  col+=c1*(1.-smoothstep(0.,.65,uv.x))*pow(sm,2.)*.4;
  col+=c2*smoothstep(.35,1.,uv.x)*pow(sm,2.)*.4;
  float sw=exp(-pow(uv.x+uv.y*.45-fract(t*.06)*2.6+.4,2.)*30.);
  col+=sw*.05;
  gl_FragColor=vec4(col,1.);
}`,
  // Ondas suaves que "respiram" num ritmo calmo.
  vital: `void main(){
  vec2 uv=gl_FragCoord.xy/r; float tt=t*.22;
  float w1=sin(uv.x*3.+tt+m.x)*.07+.66, w2=sin(uv.x*2.1-tt*1.3+1.)*.09+.44, w3=sin(uv.x*4.-tt*.8+2.)*.05+.24;
  vec3 col=mix(B,vec3(1.),.1);
  col=mix(col,c1,(1.-smoothstep(w1-.09,w1+.09,uv.y))*.75);
  col=mix(col,c2,(1.-smoothstep(w2-.13,w2+.13,uv.y))*.55);
  col=mix(col,c3,(1.-smoothstep(w3-.1,w3+.1,uv.y))*.5);
  float b=.5+.5*sin(t*1.26);
  col=mix(col,c1,b*.25*(1.-smoothstep(0.,.75,distance(uv,vec2(.5,.62)))));
  gl_FragColor=vec4(col,1.);
}`,
  // Túnel de velocidade: riscos de luz saindo do ponto de fuga.
  impulso: `void main(){
  vec2 p=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);
  vec2 c=vec2(m.x*.22,.12-m.y*.12); vec2 d=p-c; float rad=length(d);
  float a=atan(d.y,d.x)/6.2831*96.; float sg=floor(a); float rn=h(vec2(sg,3.));
  float z=fract(rad*.7-t*(.9+rn*1.6)-s*.6+rn*9.);
  float dash=smoothstep(0.,.05,z)*(1.-smoothstep(.05,.32,z));
  float line=1.-smoothstep(0.,.2,abs(fract(a)-.5));
  float st=line*dash*step(.42,rn)*smoothstep(.04,.45,rad);
  vec3 col=mix(B,mix(B,c3,.6),clamp(rad,0.,1.));
  col+=st*mix(c1,c2,rn)*1.7;
  col+=mix(c1,c2,.6)*.05/(rad+.08);
  gl_FragColor=vec4(col,1.);
}`,
};

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const vec = (hex: string): [number, number, number] => {
  const n = parseInt((hex || '#000000').slice(1, 7), 16) || 0;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export default function MiniShader({ kind, colors }: { kind: ShaderKind; colors: [string, string, string, string] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const palette = useRef(colors);
  palette.current = colors;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let gl: WebGLRenderingContext | null = null;
    try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' }); } catch { gl = null; }
    if (!gl) return;
    const shader = (type: number, src: string) => { const sh = gl!.createShader(type)!; gl!.shaderSource(sh, src); gl!.compileShader(sh); return gl!.getShaderParameter(sh, gl!.COMPILE_STATUS) ? sh : null; };
    const vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, HEAD + FRAG[kind]);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl!.getUniformLocation(prog, name);
    const uR = u('r'), uT = u('t'), uM = u('m'), uS = u('s'), uC = [u('c1'), u('c2'), u('c3'), u('B')];
    const root = canvas.closest('.mini-landing') as HTMLElement | null;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Resolução reduzida (o fundo é desfocado por natureza) e no máximo 30 quadros por segundo.
    const scale = Math.min(window.devicePixelRatio || 1, 2) * (kind === 'aura' ? 0.4 : 0.55);
    let last = 0;
    let raf = 0, onScreen = true, lost = false, mx = 0, my = 0;
    const start = performance.now() - 8000;
    const num = (name: string) => parseFloat(root?.style.getPropertyValue(name) || '0') || 0;
    const draw = (now: number) => {
      if (lost) return;
      const w = Math.max(1, Math.round(canvas.clientWidth * scale)), h = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl!.viewport(0, 0, w, h); }
      mx += (num('--px') - mx) * 0.06; my += (num('--py') - my) * 0.06;
      gl!.uniform2f(uR, w, h); gl!.uniform1f(uT, ((now - start) / 1000) % 900); gl!.uniform2f(uM, mx, my); gl!.uniform1f(uS, num('--hero-p'));
      palette.current.forEach((hex, i) => gl!.uniform3fv(uC[i], vec(hex)));
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      canvas.classList.add('is-live');
    };
    const loop = (now: number) => { raf = 0; if (now - last >= 32) { last = now; draw(now); } schedule(); };
    const schedule = () => { if (!raf && !reduce && onScreen && !document.hidden && !lost) raf = requestAnimationFrame(loop); };
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; schedule(); }) : null;
    io?.observe(canvas);
    const vis = () => schedule();
    document.addEventListener('visibilitychange', vis);
    const onLost = (e: Event) => { e.preventDefault(); lost = true; cancelAnimationFrame(raf); canvas.classList.remove('is-live'); };
    canvas.addEventListener('webglcontextlost', onLost);
    const onPalette = () => { if (!raf) draw(performance.now()); };
    canvas.addEventListener('palette', onPalette);
    requestAnimationFrame(now => { draw(now); schedule(); });
    return () => {
      cancelAnimationFrame(raf); io?.disconnect();
      document.removeEventListener('visibilitychange', vis);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('palette', onPalette);
      gl!.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [kind]);
  // Com "reduzir movimento" o quadro fica parado: redesenha quando a paleta muda.
  useEffect(() => { ref.current?.dispatchEvent(new Event('palette')); }, [colors.join()]);
  return <canvas ref={ref} className="mini-gl" aria-hidden="true" />;
}
