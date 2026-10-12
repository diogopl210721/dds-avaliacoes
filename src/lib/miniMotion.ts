import { RefObject, useEffect } from 'react';

// Movimento dos mini sites. Só mexe em classes e variáveis CSS do próprio
// <article>: nenhum dado é lido ou gravado. Com "reduzir movimento" ativado no
// aparelho, a página fica estática.
const clamp = (v: number, min = -1, max = 1) => Math.min(max, Math.max(min, v));

function scrollParent(el: HTMLElement): HTMLElement | Window {
  let node = el.parentElement;
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll') return node;
    node = node.parentElement;
  }
  return window;
}

export function useMiniMotion(ref: RefObject<HTMLElement>, enabled: boolean, signature: string) {
  useEffect(() => {
    const root = ref.current;
    if (!root || !enabled) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('is-static');
      return () => root.classList.remove('is-static');
    }
    root.classList.add('motion-on');
    const cleanups: (() => void)[] = [];

    // 1. Entrada dos blocos quando aparecem na tela.
    const pending = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)'));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      pending.forEach(el => io.observe(el));
      cleanups.push(() => io.disconnect());
    } else pending.forEach(el => el.classList.add('is-in'));

    // 2. Capa em 3D que inclina conforme a rolagem.
    const hero = root.querySelector<HTMLElement>('[data-hero]');
    const scroller = scrollParent(root);
    let frame = 0;
    const updateHero = () => {
      frame = 0;
      if (!hero) return;
      const top = scroller === window ? 0 : (scroller as HTMLElement).getBoundingClientRect().top;
      const rect = hero.getBoundingClientRect();
      root.style.setProperty('--hero-p', clamp((top - rect.top) / Math.max(rect.height, 1), 0, 1).toFixed(3));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(updateHero); };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    updateHero();
    cleanups.push(() => { scroller.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); });

    // 3. Carrossel 3D dos produtos: cada cartão recebe sua distância até o centro.
    const tracks = Array.from(root.querySelectorAll<HTMLElement>('[data-coverflow]'));
    const flow = (track: HTMLElement) => {
      const center = track.scrollLeft + track.clientWidth / 2;
      Array.from(track.children).forEach(child => {
        const card = child as HTMLElement;
        const off = clamp((card.offsetLeft + card.offsetWidth / 2 - center) / Math.max(card.offsetWidth, 1), -2, 2);
        card.style.setProperty('--off', off.toFixed(3));
        card.style.setProperty('--abs', Math.abs(off).toFixed(3));
        card.style.zIndex = String(10 - Math.round(Math.abs(off) * 3));
      });
    };
    tracks.forEach(track => {
      let raf = 0;
      const onTrack = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; flow(track); }); };
      track.addEventListener('scroll', onTrack, { passive: true });
      flow(track);
      cleanups.push(() => { track.removeEventListener('scroll', onTrack); cancelAnimationFrame(raf); });
    });
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(() => { tracks.forEach(flow); updateHero(); });
      ro.observe(root);
      cleanups.push(() => ro.disconnect());
    }

    // 4. No computador, a capa acompanha o mouse. No celular ela flutua sozinha (CSS).
    if (hero && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      root.classList.add('has-pointer');
      const move = (e: PointerEvent) => {
        const r = hero.getBoundingClientRect();
        root.style.setProperty('--px', clamp(((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        root.style.setProperty('--py', clamp(((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      };
      const leave = () => { root.style.setProperty('--px', '0'); root.style.setProperty('--py', '0'); };
      hero.addEventListener('pointermove', move);
      hero.addEventListener('pointerleave', leave);
      cleanups.push(() => { hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave); root.classList.remove('has-pointer'); });
    }

    // 5. No Android, a capa também inclina com o giroscópio (o iPhone exigiria pedir permissão, então fica com a flutuação automática).
    const DOE = (window as any).DeviceOrientationEvent;
    if (!root.classList.contains('has-pointer') && DOE && typeof DOE.requestPermission !== 'function') {
      let raf = 0, gx = 0, gy = 0;
      const onTilt = (e: DeviceOrientationEvent) => {
        if (e.gamma == null || e.beta == null) return;
        gx = clamp(e.gamma / 22); gy = clamp((e.beta - 45) / 22);
        root.classList.add('has-gyro');
        if (!raf) raf = requestAnimationFrame(() => { raf = 0; root.style.setProperty('--px', gx.toFixed(3)); root.style.setProperty('--py', gy.toFixed(3)); });
      };
      window.addEventListener('deviceorientation', onTilt);
      cleanups.push(() => { window.removeEventListener('deviceorientation', onTilt); cancelAnimationFrame(raf); });
    }

    return () => cleanups.forEach(fn => fn());
  }, [ref, enabled, signature]);
}

// Inclinação dos celulares nas miniaturas dos modelos.
export function usePhoneTilt(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--tx', clamp(((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      el.style.setProperty('--ty', clamp(((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    };
    const leave = () => { el.style.setProperty('--tx', '0'); el.style.setProperty('--ty', '0'); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, [ref]);
}
