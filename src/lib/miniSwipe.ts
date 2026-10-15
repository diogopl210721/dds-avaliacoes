import { RefObject, useEffect } from 'react';

// Carrosséis do mini site (fotos dos produtos e depoimentos).
// Depoimentos deslizam com a rolagem nativa do celular; cartões de produtos e carros seguem o dedo
// por aqui (ver [data-swipe-drag] abaixo). No mouse não existe esse gesto, então:
//  - setas ‹ › nas laterais ([data-swipe-prev] / [data-swipe-next], só aparecem com mouse, via CSS);
//  - clicar e arrastar com o mouse, que solta no cartão mais próximo.
// Cada carrossel fica num .mini-swipe com o trilho [data-swipe-track] dentro.

const nearest = (track: HTMLElement) => {
  const center = track.scrollLeft + track.clientWidth / 2;
  let best = 0, dist = Infinity;
  Array.from(track.children).forEach((el, i) => {
    const c = el as HTMLElement;
    const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center);
    if (d < dist) { dist = d; best = i; }
  });
  return best;
};

function goTo(track: HTMLElement, index: number) {
  const cards = track.children;
  const card = cards[Math.max(0, Math.min(cards.length - 1, index))] as HTMLElement | undefined;
  if (!card) return;
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  track.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2, behavior: smooth ? 'smooth' : 'auto' });
}

export function useMiniSwipe(ref: RefObject<HTMLElement>, enabled: boolean, signature: string) {
  useEffect(() => {
    const root = ref.current;
    if (!root || !enabled) return;
    const cleanups: (() => void)[] = [];

    root.querySelectorAll<HTMLElement>('.mini-swipe').forEach(box => {
      const track = box.querySelector<HTMLElement>('[data-swipe-track]');
      if (!track) return;

      // Esconde a seta do lado em que não há mais cartões.
      const edges = () => {
        const max = track.scrollWidth - track.clientWidth;
        box.toggleAttribute('data-at-start', track.scrollLeft <= 4);
        box.toggleAttribute('data-at-end', track.scrollLeft >= max - 4);
      };
      track.addEventListener('scroll', edges, { passive: true });
      edges();

      const onArrow = (e: MouseEvent) => {
        const btn = (e.target as HTMLElement).closest('[data-swipe-prev],[data-swipe-next]');
        if (!btn || !box.contains(btn)) return;
        goTo(track, nearest(track) + (btn.hasAttribute('data-swipe-next') ? 1 : -1));
      };
      box.addEventListener('click', onArrow);

      // Arrastar com o mouse. Nos trilhos marcados com [data-swipe-drag] (cartões de produtos e carros),
      // o dedo também é seguido aqui: no iPhone a rolagem nativa desses cartões em 3D não andava.
      // O CSS deixa só a rolagem vertical com o navegador (touch-action: pan-y).
      const byFinger = track.hasAttribute('data-swipe-drag');
      let startX = 0, startLeft = 0, startIndex = 0, moved = false, dragging = false, id = -1, blockClickUntil = 0;
      let lastX = 0, lastT = 0, speed = 0;
      const down = (e: PointerEvent) => {
        const mouse = e.pointerType === 'mouse';
        if (mouse ? e.button !== 0 : !byFinger || !e.isPrimary) return;
        dragging = true; moved = false; id = e.pointerId; speed = 0;
        startX = lastX = e.clientX; lastT = e.timeStamp; startLeft = track.scrollLeft; startIndex = nearest(track);
      };
      const move = (e: PointerEvent) => {
        if (!dragging || e.pointerId !== id) return;
        const dx = e.clientX - startX;
        if (!moved && Math.abs(dx) < 6) return;
        if (!moved) { moved = true; try { track.setPointerCapture(id); } catch { /* já solto */ } box.classList.add('is-dragging'); }
        const now = e.timeStamp; // hora do toque (vários eventos podem chegar juntos)
        if (now > lastT) speed = speed * 0.4 + ((e.clientX - lastX) / Math.max(4, now - lastT)) * 0.6;
        lastX = e.clientX; lastT = now;
        track.scrollLeft = startLeft - dx;
        e.preventDefault();
      };
      const up = (e: PointerEvent) => {
        if (!dragging || e.pointerId !== id) return;
        dragging = false;
        if (!moved) return;
        moved = false; blockClickUntil = performance.now() + 400;
        box.classList.remove('is-dragging');
        const dx = (e.type === 'pointercancel' ? lastX : e.clientX) - startX;
        const fling = e.timeStamp - lastT < 120 && Math.abs(speed) > 0.35;
        let target = nearest(track);
        if (target === startIndex && (Math.abs(dx) > 40 || fling)) target += dx < 0 ? 1 : -1;
        goTo(track, target);
      };
      // Depois de arrastar, o clique que vem junto não abre a foto ampliada.
      const click = (e: MouseEvent) => { if (performance.now() < blockClickUntil) { e.preventDefault(); e.stopPropagation(); blockClickUntil = 0; } };
      const noDrag = (e: DragEvent) => e.preventDefault();
      track.addEventListener('pointerdown', down);
      track.addEventListener('pointermove', move);
      track.addEventListener('pointerup', up);
      track.addEventListener('pointercancel', up);
      track.addEventListener('click', click, true);
      track.addEventListener('dragstart', noDrag);

      cleanups.push(() => {
        track.removeEventListener('scroll', edges);
        box.removeEventListener('click', onArrow);
        track.removeEventListener('pointerdown', down);
        track.removeEventListener('pointermove', move);
        track.removeEventListener('pointerup', up);
        track.removeEventListener('pointercancel', up);
        track.removeEventListener('click', click, true);
        track.removeEventListener('dragstart', noDrag);
        box.classList.remove('is-dragging');
      });
    });

    return () => cleanups.forEach(fn => fn());
  }, [ref, enabled, signature]);
}
