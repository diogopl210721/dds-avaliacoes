import { useEffect, useRef } from 'react';

// Fundos animados em WebGL, desenhados pela placa de vídeo do aparelho.
// - Só roda enquanto aparece na tela e a aba está aberta.
// - Resolução reduzida para poupar bateria.
// - Sem WebGL, ou com "reduzir movimento", fica o fundo em CSS (ou um quadro parado).
export type ShaderKind = 'brasa' | 'aura' | 'navalha' | 'vital' | 'impulso';

const HEAD = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 r; uniform float t; uniform vec2 m; uniform float s;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1.,0.)),u.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
`;

const FRAG: Record<ShaderKind, string> = {
  // Chamas no rodapé e brasas subindo, desviando do dedo/mouse.
  brasa: `void main(){
  vec2 uv=gl_FragCoord.xy/r; float asp=r.x/r.y; vec2 p=vec2(uv.x*asp,uv.y);
  vec3 col=mix(vec3(.05,.035,.03),vec3(.085,.05,.035),uv.y);
  float f=fbm(vec2(p.x*2.6+m.x*.4,p.y*3.2-t*1.3));
  float fl=clamp(f*1.7-uv.y*1.75-.16,0.,1.); fl=pow(fl,1.8);
  col+=fl*vec3(1.,.34,.06)*1.15+pow(fl,3.)*vec3(1.,.7,.32)*.7;
  for(int L=0;L<3;L++){
    float k=float(L); float sc=7.+k*5.;
    vec2 q=p*sc; q.y-=t*(1.1+k*.55); q.x+=sin(q.y*.4+k*2.+t*.8)*.55+m.x*(1.+k);
    vec2 id=floor(q); vec2 g=fract(q)-.5; float rn=h(id+k*17.);
    if(rn>.82){
      vec2 o=vec2(h(id+3.1),h(id+7.7))-.5; float d=length(g-o*.6);
      float fk=.55+.45*sin(t*9.+rn*60.);
      col+=(1.-smoothstep(0.,.11,d))*fk*(1.15-uv.y*.75)*mix(vec3(1.,.5,.12),vec3(1.,.85,.5),rn)*(1.-k*.22);
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
  vec3 rose=vec3(.97,.82,.87), lilac=vec3(.87,.84,.98), peach=vec3(.99,.89,.81);
  vec3 col=mix(rose,lilac,.5+.5*sin(k*6.2831));
  col=mix(col,peach,(.5+.5*sin(k*4.4+2.))*.7);
  col+=.045*cos(6.2831*(v*2.2+vec3(0.,.33,.67)+tt));
  col=mix(col,vec3(1.),smoothstep(.58,.92,v)*.45);
  col=mix(col,vec3(.985,.955,.945),.18);
  gl_FragColor=vec4(col,1.);
}`,
  // Fumaça lenta com reflexos vermelho e azul, e um brilho que passa.
  navalha: `void main(){
  vec2 uv=gl_FragCoord.xy/r; vec2 p=vec2(uv.x*r.x/r.y,uv.y); float tt=t*.09;
  float sm=fbm(p*2.1+vec2(tt*2.,-tt)+fbm(p*1.4-tt+m*.3)*1.6);
  vec3 col=mix(vec3(.055,.058,.068),vec3(.1,.104,.118),uv.y);
  col+=vec3(.6)*pow(sm,3.)*.55;
  col+=vec3(.55,.04,.07)*(1.-smoothstep(0.,.65,uv.x))*pow(sm,2.)*.4;
  col+=vec3(.05,.14,.55)*smoothstep(.35,1.,uv.x)*pow(sm,2.)*.4;
  float sw=exp(-pow(uv.x+uv.y*.45-fract(t*.06)*2.6+.4,2.)*30.);
  col+=sw*.05;
  gl_FragColor=vec4(col,1.);
}`,
  // Ondas suaves que "respiram" num ritmo calmo.
  vital: `void main(){
  vec2 uv=gl_FragCoord.xy/r; float tt=t*.22;
  float w1=sin(uv.x*3.+tt+m.x)*.07+.66, w2=sin(uv.x*2.1-tt*1.3+1.)*.09+.44, w3=sin(uv.x*4.-tt*.8+2.)*.05+.24;
  vec3 col=vec3(.955,.985,.978);
  col=mix(col,vec3(.83,.955,.93),(1.-smoothstep(w1-.09,w1+.09,uv.y))*.75);
  col=mix(col,vec3(.8,.9,.985),(1.-smoothstep(w2-.13,w2+.13,uv.y))*.55);
  col=mix(col,vec3(.86,.965,.95),(1.-smoothstep(w3-.1,w3+.1,uv.y))*.5);
  float b=.5+.5*sin(t*1.26);
  col+=vec3(.015,.05,.04)*b*(1.-smoothstep(0.,.75,distance(uv,vec2(.5,.62))));
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
  vec3 col=mix(vec3(.035,.04,.1),vec3(.08,.055,.17),clamp(rad,0.,1.));
  col+=st*mix(vec3(1.,.38,.08),vec3(1.,.17,.52),rn)*1.7;
  col+=vec3(.5,.16,.35)*.05/(rad+.08);
  gl_FragColor=vec4(col,1.);
}`,
};

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

export default function MiniShader({ kind }: { kind: ShaderKind }) {
  const ref = useRef<HTMLCanvasElement>(null);
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
    const uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't'), uM = gl.getUniformLocation(prog, 'm'), uS = gl.getUniformLocation(prog, 's');
    const root = canvas.closest('.mini-landing') as HTMLElement | null;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scale = Math.min(window.devicePixelRatio || 1, 2) * 0.6;
    let raf = 0, onScreen = true, lost = false, mx = 0, my = 0;
    const start = performance.now() - 8000;
    const num = (name: string) => parseFloat(root?.style.getPropertyValue(name) || '0') || 0;
    const draw = (now: number) => {
      if (lost) return;
      const w = Math.max(1, Math.round(canvas.clientWidth * scale)), h = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl!.viewport(0, 0, w, h); }
      mx += (num('--px') - mx) * 0.06; my += (num('--py') - my) * 0.06;
      gl!.uniform2f(uR, w, h); gl!.uniform1f(uT, ((now - start) / 1000) % 900); gl!.uniform2f(uM, mx, my); gl!.uniform1f(uS, num('--hero-p'));
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      canvas.classList.add('is-live');
    };
    const loop = (now: number) => { raf = 0; draw(now); schedule(); };
    const schedule = () => { if (!raf && !reduce && onScreen && !document.hidden && !lost) raf = requestAnimationFrame(loop); };
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; schedule(); }) : null;
    io?.observe(canvas);
    const vis = () => schedule();
    document.addEventListener('visibilitychange', vis);
    const onLost = (e: Event) => { e.preventDefault(); lost = true; cancelAnimationFrame(raf); canvas.classList.remove('is-live'); };
    canvas.addEventListener('webglcontextlost', onLost);
    requestAnimationFrame(now => { draw(now); schedule(); });
    return () => {
      cancelAnimationFrame(raf); io?.disconnect();
      document.removeEventListener('visibilitychange', vis);
      canvas.removeEventListener('webglcontextlost', onLost);
      gl!.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [kind]);
  return <canvas ref={ref} className="mini-gl" aria-hidden="true" />;
}
