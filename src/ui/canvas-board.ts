import { Board } from '../game/board';
import type { Move, Position, WinningLine } from '../game/types';

interface ScreenPoint {
  x: number;
  y: number;
}

interface WorldPoint {
  x: number;
  y: number;
}

interface WorldBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Palette {
  background: string;
  grid: string;
  x: string;
  o: string;
  last: string;
  win: string;
  focus: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export class CanvasBoard {
  private readonly context: CanvasRenderingContext2D;
  private readonly pointers = new Map<number, ScreenPoint>();
  private readonly resizeObserver: ResizeObserver;
  private readonly cursorStatus: HTMLElement | null;
  private width = 0;
  private height = 0;
  private cellSize = 52;
  private cameraX = 0.5;
  private cameraY = 0.5;
  private keyboardCell: Position = { x: 0, y: 0 };
  private pointerStart: ScreenPoint | null = null;
  private lastPointer: ScreenPoint | null = null;
  private pointerType = 'mouse';
  private moved = false;
  private multiPointerGesture = false;
  private pinchDistance = 0;
  private pinchMidpoint: ScreenPoint | null = null;
  private winningLine: WinningLine | null = null;
  private winProgress = 1;
  private emphasizeWin = false;
  private animationFrame: number | null = null;
  private renderFrame: number | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly board: Board,
    private readonly onCellClick: (position: Position) => void
  ) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D is not available');
    }

    this.context = context;
    this.cursorStatus = document.getElementById('boardCursorStatus');
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);

    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointercancel', this.handlePointerUp);
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    canvas.addEventListener('keydown', this.handleKeyDown);
    canvas.addEventListener('focus', this.handleFocusChange);
    canvas.addEventListener('blur', this.handleFocusChange);

    this.resize();
  }

  setWinningLine(line: WinningLine | null): void {
    this.stopAnimation();
    this.winningLine = line;
    this.winProgress = 1;
    this.emphasizeWin = line !== null;
    this.render();
  }

  animateWinningLine(duration = 460): void {
    if (!this.winningLine) {
      return;
    }
    this.stopAnimation();
    this.emphasizeWin = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.winProgress = 1;
      this.render();
      return;
    }

    this.winProgress = 0;
    const start = performance.now();
    const frame = (now: number): void => {
      this.winProgress = clamp((now - start) / duration, 0, 1);
      this.render();
      if (this.winProgress < 1) {
        this.animationFrame = requestAnimationFrame(frame);
      } else {
        this.animationFrame = null;
      }
    };
    this.animationFrame = requestAnimationFrame(frame);
  }

  clearWinEmphasis(): void {
    this.stopAnimation();
    this.emphasizeWin = false;
    this.winProgress = 1;
    this.render();
  }

  centerOn(position?: Position): void {
    const target = position ?? { x: 0, y: 0 };
    this.cameraX = target.x + 0.5;
    this.cameraY = target.y + 0.5;
    this.keyboardCell = { x: target.x, y: target.y };
    this.announceKeyboardCell();
    this.render();
  }

  render(): void {
    const palette = this.getPalette();
    const ctx = this.context;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();

    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, this.width, this.height);

    this.drawGrid(palette);
    this.drawMoves(palette);
    this.drawKeyboardFocus(palette);
    this.drawWinningLine(palette);
  }

  private requestRender(): void {
    if (this.renderFrame !== null) return;
    this.renderFrame = requestAnimationFrame(() => {
      this.renderFrame = null;
      this.render();
    });
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.render();
  }

  private getPalette(): Palette {
    const style = getComputedStyle(document.documentElement);
    const value = (name: string) => style.getPropertyValue(name).trim();

    return {
      background: value('--board-bg'),
      grid: value('--grid'),
      x: value('--mark-x'),
      o: value('--mark-o'),
      last: value('--last-move'),
      win: value('--win-line'),
      focus: value('--board-focus')
    };
  }

  private getVisibleBounds(): WorldBounds {
    return {
      left: this.cameraX - this.width / (2 * this.cellSize),
      right: this.cameraX + this.width / (2 * this.cellSize),
      top: this.cameraY - this.height / (2 * this.cellSize),
      bottom: this.cameraY + this.height / (2 * this.cellSize)
    };
  }

  private drawGrid(palette: Palette): void {
    const ctx = this.context;
    const { left, right, top, bottom } = this.getVisibleBounds();

    ctx.beginPath();
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;

    for (let x = Math.floor(left); x <= Math.ceil(right); x += 1) {
      const screenX = this.worldToScreenX(x);
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, this.height);
    }

    for (let y = Math.floor(top); y <= Math.ceil(bottom); y += 1) {
      const screenY = this.worldToScreenY(y);
      ctx.moveTo(0, screenY);
      ctx.lineTo(this.width, screenY);
    }

    ctx.stroke();
  }

  private moveBelongsToWinningLine(move: Move): boolean {
    if (!this.winningLine) {
      return false;
    }
    const { start, end } = this.winningLine;
    const lineX = end.x - start.x;
    const lineY = end.y - start.y;
    const moveX = move.x - start.x;
    const moveY = move.y - start.y;
    const collinear = lineX * moveY === lineY * moveX;
    const withinX = move.x >= Math.min(start.x, end.x) && move.x <= Math.max(start.x, end.x);
    const withinY = move.y >= Math.min(start.y, end.y) && move.y <= Math.max(start.y, end.y);
    return collinear && withinX && withinY;
  }

  private drawMoves(palette: Palette): void {
    const allMoves = this.board.getMoves();
    const lastMove = allMoves[allMoves.length - 1];
    const { left, right, top, bottom } = this.getVisibleBounds();
    const moves = this.board.getMovesInBounds(
      Math.floor(left) - 1,
      Math.ceil(right) + 1,
      Math.floor(top) - 1,
      Math.ceil(bottom) + 1
    );
    const margin = this.cellSize * 0.24;
    const radius = this.cellSize * 0.27;

    for (const move of moves) {
      const cellLeft = this.worldToScreenX(move.x);
      const cellTop = this.worldToScreenY(move.y);

      this.context.save();
      if (this.emphasizeWin && this.winningLine && !this.moveBelongsToWinningLine(move)) {
        this.context.globalAlpha = 0.28;
      }

      if (lastMove && move.x === lastMove.x && move.y === lastMove.y) {
        this.context.fillStyle = palette.last;
        this.context.fillRect(cellLeft + 2, cellTop + 2, this.cellSize - 4, this.cellSize - 4);
      }

      const centerX = cellLeft + this.cellSize / 2;
      const centerY = cellTop + this.cellSize / 2;
      this.context.strokeStyle = move.mark === 'X' ? palette.x : palette.o;
      this.context.lineWidth = Math.max(2.5, this.cellSize * 0.07);
      this.context.lineCap = 'round';
      this.context.beginPath();

      if (move.mark === 'X') {
        this.context.moveTo(cellLeft + margin, cellTop + margin);
        this.context.lineTo(cellLeft + this.cellSize - margin, cellTop + this.cellSize - margin);
        this.context.moveTo(cellLeft + this.cellSize - margin, cellTop + margin);
        this.context.lineTo(cellLeft + margin, cellTop + this.cellSize - margin);
      } else {
        this.context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      }

      this.context.stroke();
      this.context.restore();
    }
  }

  private drawKeyboardFocus(palette: Palette): void {
    if (document.activeElement !== this.canvas) return;
    const left = this.worldToScreenX(this.keyboardCell.x);
    const top = this.worldToScreenY(this.keyboardCell.y);
    if (
      left > this.width ||
      top > this.height ||
      left + this.cellSize < 0 ||
      top + this.cellSize < 0
    ) {
      return;
    }

    this.context.save();
    this.context.strokeStyle = palette.focus;
    this.context.lineWidth = Math.max(2, this.cellSize * 0.045);
    this.context.setLineDash([Math.max(5, this.cellSize * 0.12), Math.max(4, this.cellSize * 0.08)]);
    this.context.strokeRect(left + 4, top + 4, this.cellSize - 8, this.cellSize - 8);
    this.context.restore();
  }

  private drawWinningLine(palette: Palette): void {
    if (!this.winningLine) {
      return;
    }

    const startX = this.worldToScreenX(this.winningLine.start.x + 0.5);
    const startY = this.worldToScreenY(this.winningLine.start.y + 0.5);
    const fullEndX = this.worldToScreenX(this.winningLine.end.x + 0.5);
    const fullEndY = this.worldToScreenY(this.winningLine.end.y + 0.5);
    const endX = startX + (fullEndX - startX) * this.winProgress;
    const endY = startY + (fullEndY - startY) * this.winProgress;

    this.context.beginPath();
    this.context.strokeStyle = palette.win;
    this.context.lineWidth = Math.max(4, this.cellSize * 0.09);
    this.context.lineCap = 'round';
    this.context.moveTo(startX, startY);
    this.context.lineTo(endX, endY);
    this.context.stroke();
  }

  private worldToScreenX(x: number): number {
    return (x - this.cameraX) * this.cellSize + this.width / 2;
  }

  private worldToScreenY(y: number): number {
    return (y - this.cameraY) * this.cellSize + this.height / 2;
  }

  private screenToWorld(point: ScreenPoint): WorldPoint {
    return {
      x: (point.x - this.width / 2) / this.cellSize + this.cameraX,
      y: (point.y - this.height / 2) / this.cellSize + this.cameraY
    };
  }

  private screenToCell(point: ScreenPoint): Position {
    const world = this.screenToWorld(point);
    return { x: Math.floor(world.x), y: Math.floor(world.y) };
  }

  private eventPoint(event: PointerEvent | WheelEvent): ScreenPoint {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private zoomAt(point: ScreenPoint, nextSize: number): void {
    const anchor = this.screenToWorld(point);
    this.cellSize = clamp(nextSize, 28, 92);
    this.cameraX = anchor.x - (point.x - this.width / 2) / this.cellSize;
    this.cameraY = anchor.y - (point.y - this.height / 2) / this.cellSize;
  }

  private keyboardCellCenter(): ScreenPoint {
    return {
      x: this.worldToScreenX(this.keyboardCell.x + 0.5),
      y: this.worldToScreenY(this.keyboardCell.y + 0.5)
    };
  }

  private ensureKeyboardCellVisible(): void {
    const margin = 1.25;
    const { left, right, top, bottom } = this.getVisibleBounds();
    if (this.keyboardCell.x < left + margin) {
      this.cameraX -= left + margin - this.keyboardCell.x;
    } else if (this.keyboardCell.x + 1 > right - margin) {
      this.cameraX += this.keyboardCell.x + 1 - (right - margin);
    }
    if (this.keyboardCell.y < top + margin) {
      this.cameraY -= top + margin - this.keyboardCell.y;
    } else if (this.keyboardCell.y + 1 > bottom - margin) {
      this.cameraY += this.keyboardCell.y + 1 - (bottom - margin);
    }
  }

  private announceKeyboardCell(): void {
    if (!this.cursorStatus) return;
    const label = this.canvas.dataset.cellLabel || 'Cell';
    const occupied = this.board.get(this.keyboardCell.x, this.keyboardCell.y);
    const state = occupied ? ` ${occupied}` : '';
    this.cursorStatus.textContent = `${label} ${this.keyboardCell.x}, ${this.keyboardCell.y}${state}`;
  }

  private handlePointerDown = (event: PointerEvent): void => {
    const point = this.eventPoint(event);
    this.canvas.focus({ preventScroll: true });
    this.canvas.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, point);

    if (this.pointers.size === 1) {
      this.pointerStart = point;
      this.lastPointer = point;
      this.pointerType = event.pointerType;
      this.moved = false;
    } else {
      this.multiPointerGesture = true;
      this.moved = true;
      this.resetPinchState();
    }
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.pointers.has(event.pointerId)) {
      return;
    }

    const point = this.eventPoint(event);
    this.pointers.set(event.pointerId, point);

    if (this.pointers.size === 1 && this.lastPointer && !this.multiPointerGesture) {
      const threshold = this.pointerType === 'touch' ? 10 : 5;
      const distance = this.pointerStart
        ? Math.hypot(point.x - this.pointerStart.x, point.y - this.pointerStart.y)
        : 0;
      if (!this.moved && distance <= threshold) {
        this.lastPointer = point;
        return;
      }

      this.moved = true;
      const dx = point.x - this.lastPointer.x;
      const dy = point.y - this.lastPointer.y;
      this.cameraX -= dx / this.cellSize;
      this.cameraY -= dy / this.cellSize;
      this.lastPointer = point;
      this.requestRender();
      return;
    }

    if (this.pointers.size === 2) {
      const [first, second] = [...this.pointers.values()];
      const midpoint = {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2
      };
      const distance = Math.hypot(first.x - second.x, first.y - second.y);

      if (this.pinchDistance > 0 && this.pinchMidpoint) {
        this.zoomAt(this.pinchMidpoint, this.cellSize * (distance / this.pinchDistance));
        const anchor = this.screenToWorld(this.pinchMidpoint);
        this.cameraX = anchor.x - (midpoint.x - this.width / 2) / this.cellSize;
        this.cameraY = anchor.y - (midpoint.y - this.height / 2) / this.cellSize;
        this.requestRender();
      }

      this.pinchDistance = distance;
      this.pinchMidpoint = midpoint;
    }
  };

  private handlePointerUp = (event: PointerEvent): void => {
    const point = this.pointers.get(event.pointerId) ?? this.eventPoint(event);
    const singlePointerRelease = this.pointers.size === 1;

    if (singlePointerRelease && !this.moved && !this.multiPointerGesture) {
      this.keyboardCell = this.screenToCell(point);
      this.announceKeyboardCell();
      this.onCellClick(this.keyboardCell);
      this.render();
    }

    this.pointers.delete(event.pointerId);

    if (this.pointers.size === 1) {
      this.lastPointer = [...this.pointers.values()][0];
      this.resetPinchState();
    } else if (this.pointers.size === 0) {
      this.pointerStart = null;
      this.lastPointer = null;
      this.moved = false;
      this.multiPointerGesture = false;
      this.resetPinchState();
    }
  };

  private handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const point = this.eventPoint(event);
    this.zoomAt(point, this.cellSize * Math.exp(-event.deltaY * 0.0012));
    this.requestRender();
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    let moved = false;
    if (event.key === 'ArrowLeft') {
      this.keyboardCell.x -= 1;
      moved = true;
    } else if (event.key === 'ArrowRight') {
      this.keyboardCell.x += 1;
      moved = true;
    } else if (event.key === 'ArrowUp') {
      this.keyboardCell.y -= 1;
      moved = true;
    } else if (event.key === 'ArrowDown') {
      this.keyboardCell.y += 1;
      moved = true;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onCellClick({ ...this.keyboardCell });
      this.announceKeyboardCell();
      this.render();
      return;
    } else if (event.key === 'Home') {
      event.preventDefault();
      const moves = this.board.getMoves();
      this.centerOn(moves[moves.length - 1]);
      return;
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      this.zoomAt(this.keyboardCellCenter(), this.cellSize * 1.12);
      this.render();
      return;
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      this.zoomAt(this.keyboardCellCenter(), this.cellSize / 1.12);
      this.render();
      return;
    }

    if (!moved) return;
    event.preventDefault();
    this.ensureKeyboardCellVisible();
    this.announceKeyboardCell();
    this.render();
  };

  private handleFocusChange = (): void => {
    this.announceKeyboardCell();
    this.render();
  };

  private stopAnimation(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private resetPinchState(): void {
    this.pinchDistance = 0;
    this.pinchMidpoint = null;
  }
}
