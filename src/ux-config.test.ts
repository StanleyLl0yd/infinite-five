import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(path, 'utf8');

describe('v0.6.0 UX safeguards', () => {
  it('keeps mobile action targets accessible', () => {
    const html = read('index.html');
    const styles = read('src/styles.css');

    for (const label of ['Center', 'Undo', 'History', 'Settings', 'New game']) {
      expect(html).toContain(`aria-label="${label}"`);
    }
    expect(styles).toContain('grid-template-columns: repeat(6, minmax(44px, 1fr))');
    expect(styles).toContain('min-width: 44px');
    expect(styles).toContain('min-height: 44px');
  });

  it('keeps touch cancellation and wheel normalization explicit', () => {
    const canvas = read('src/ui/canvas-board.ts');

    expect(canvas).toContain("canvas.addEventListener('pointercancel', this.handlePointerCancel)");
    expect(canvas).toContain('WheelEvent.DOM_DELTA_LINE');
    expect(canvas).toContain('WheelEvent.DOM_DELTA_PAGE');
    expect(canvas).toContain('animateLatestMove');
    expect(canvas).toContain('centerOn(position?: Position, animated = false)');
  });

  it('keeps dialog Back and Escape handling centralized', () => {
    const main = read('src/main.ts');

    expect(main).toContain("const dialogStateKey = 'infiniteFiveDialog'");
    expect(main).toContain("dialog.addEventListener('cancel'");
    expect(main).toContain("window.addEventListener('popstate'");
    expect(main).toContain('history.pushState');
    expect(main).toContain('history.back()');
  });
});
