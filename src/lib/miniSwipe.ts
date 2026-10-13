import { RefObject, useEffect } from 'react';

// Carrosséis do mini site (fotos dos produtos e depoimentos) no computador.
// No celular eles já deslizam com o dedo; no mouse não existe esse gesto, então:
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

      // Arrastar com o mouse (toque e caneta continuam com a rolagem nativa).
      let startX = 0, startLeft = 0, startIndex = 0, moved = false, dragging = false, id = -1, blockClickUntil = 0;
      const down = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        dragging = true; moved = false; id = e.pointerId;
        startX = e.clientX; startLeft = track.scrollLeft; startIndex = nearest(track);
      };
      const move = (e: PointerEvent) => {
        if (!dragging || e.pointerId !== id) return;
        const dx = e.clientX - startX;
        if (!moved && Math.abs(dx) < 6) return;
        if (!moved) { moved = true; track.setPointerCapture(id); box.classList.add('is-dragging'); }
        track.scrollLeft = startLeft - dx;
        e.preventDefault();
      };
      const up = (e: PointerEvent) => {
        if (!dragging || e.pointerId !== id) return;
        dragging = false;
        if (!moved) return;
        moved = false; blockClickUntil = performance.now() + 400;
        box.classList.remove('is-dragging');
        const dx = e.clientX - startX;
        let target = nearest(track);
        if (target === startIndex && Math.abs(dx) > 40) target += dx < 0 ? 1 : -1;
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
