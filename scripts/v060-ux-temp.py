from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one match, found {count}\n--- OLD ---\n{old}")
    file.write_text(text.replace(old, new))


replace_once(
    "index.html",
    '''          <button id="centerButton" type="button">\n''',
    '''          <button id="centerButton" type="button" aria-label="Center">\n''',
)
replace_once(
    "index.html",
    '''          <button id="undoButton" type="button">\n''',
    '''          <button id="undoButton" type="button" aria-label="Undo">\n''',
)
replace_once(
    "index.html",
    '''          <button id="historyButton" type="button">\n''',
    '''          <button id="historyButton" type="button" aria-label="History">\n''',
)
replace_once(
    "index.html",
    '''          <button id="settingsButton" type="button">\n''',
    '''          <button id="settingsButton" type="button" aria-label="Settings">\n''',
)
replace_once(
    "index.html",
    '''          <button id="newGameButton" type="button" class="primary">\n''',
    '''          <button id="newGameButton" type="button" class="primary" aria-label="New game">\n''',
)
replace_once(
    "index.html",
    '''              X moves first. Be the first to make 5 or more of your marks in one horizontal,\n              vertical or diagonal line. Drag the board to move it and use the mouse wheel or\n              pinch to zoom.\n''',
    '''              X moves first. Tap or click a cell to move. Be the first to make 5 or more of\n              your marks in one horizontal, vertical or diagonal line. Drag the board to move it\n              and use the mouse wheel or pinch to zoom.\n''',
)

replace_once(
    "src/i18n.ts",
    "      'X moves first. Be the first to make 5 or more of your marks in one horizontal, vertical or diagonal line. Drag the board to move it and use the mouse wheel or pinch to zoom.',",
    "      'X moves first. Tap or click a cell to move. Be the first to make 5 or more of your marks in one horizontal, vertical or diagonal line. Drag the board to move it and use the mouse wheel or pinch to zoom.',",
)
replace_once(
    "src/i18n.ts",
    "      'X ходит первым. Побеждает тот, кто первым соберёт 5 или больше своих знаков подряд по горизонтали, вертикали или диагонали. Перетаскивайте поле для перемещения, масштабируйте колесом мыши или двумя пальцами.',",
    "      'X ходит первым. Коснитесь клетки или щёлкните по ней, чтобы сделать ход. Побеждает тот, кто первым соберёт 5 или больше своих знаков подряд по горизонтали, вертикали или диагонали. Перетаскивайте поле для перемещения, масштабируйте колесом мыши или двумя пальцами.',",
)

replace_once(
    "src/ui/canvas-board.ts",
    '''  private animationFrame: number | null = null;\n  private renderFrame: number | null = null;\n''',
    '''  private animationFrame: number | null = null;\n  private renderFrame: number | null = null;\n  private cameraFrame: number | null = null;\n  private moveFrame: number | null = null;\n  private latestMoveProgress = 1;\n''',
)
replace_once(
    "src/ui/canvas-board.ts",
    '''    canvas.addEventListener('pointerup', this.handlePointerUp);\n    canvas.addEventListener('pointercancel', this.handlePointerUp);\n''',
    '''    canvas.addEventListener('pointerup', this.handlePointerUp);\n    canvas.addEventListener('pointercancel', this.handlePointerCancel);\n''',
)
replace_once(
    "src/ui/canvas-board.ts",
    '''    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {\n''',
    '''    if (this.prefersReducedMotion()) {\n''',
)
replace_once(
    "src/ui/canvas-board.ts",
    '''  centerOn(position?: Position): void {\n    const target = position ?? { x: 0, y: 0 };\n    this.cameraX = target.x + 0.5;\n    this.cameraY = target.y + 0.5;\n    this.keyboardCell = { x: target.x, y: target.y };\n    this.announceKeyboardCell();\n    this.render();\n  }\n''',
    '''  centerOn(position?: Position, animated = false): void {\n    const target = position ?? { x: 0, y: 0 };\n    const targetX = target.x + 0.5;\n    const targetY = target.y + 0.5;\n    this.keyboardCell = { x: target.x, y: target.y };\n    this.announceKeyboardCell();\n    this.stopCameraAnimation();\n\n    if (!animated || this.prefersReducedMotion()) {\n      this.cameraX = targetX;\n      this.cameraY = targetY;\n      this.render();\n      return;\n    }\n\n    const startX = this.cameraX;\n    const startY = this.cameraY;\n    const start = performance.now();\n    const duration = 220;\n    const frame = (now: number): void => {\n      const progress = clamp((now - start) / duration, 0, 1);\n      const eased = 1 - Math.pow(1 - progress, 3);\n      this.cameraX = startX + (targetX - startX) * eased;\n      this.cameraY = startY + (targetY - startY) * eased;\n      this.render();\n      if (progress < 1) {\n        this.cameraFrame = requestAnimationFrame(frame);\n      } else {\n        this.cameraFrame = null;\n      }\n    };\n    this.cameraFrame = requestAnimationFrame(frame);\n  }\n\n  animateLatestMove(duration = 180): void {\n    this.stopMoveAnimation();\n    if (this.board.getMoves().length === 0 || this.prefersReducedMotion()) {\n      this.latestMoveProgress = 1;\n      this.render();\n      return;\n    }\n\n    this.latestMoveProgress = 0;\n    const start = performance.now();\n    const frame = (now: number): void => {\n      this.latestMoveProgress = clamp((now - start) / duration, 0, 1);\n      this.render();\n      if (this.latestMoveProgress < 1) {\n        this.moveFrame = requestAnimationFrame(frame);\n      } else {\n        this.moveFrame = null;\n      }\n    };\n    this.moveFrame = requestAnimationFrame(frame);\n  }\n''',
)
replace_once(
    "src/ui/canvas-board.ts",
    '''    const margin = this.cellSize * 0.24;\n    const radius = this.cellSize * 0.27;\n\n    for (const move of moves) {\n''',
    '''    for (const move of moves) {\n''',
)
replace_once(
    "src/ui/canvas-board.ts",
    '''      const centerX = cellLeft + this.cellSize / 2;\n      const centerY = cellTop + this.cellSize / 2;\n      this.context.strokeStyle = move.mark === 'X' ? palette.x : palette.o;\n''',
    '''      const centerX = cellLeft + this.cellSize / 2;\n      const centerY = cellTop + this.cellSize / 2;\n      const isLastMove = lastMove?.x === move.x && lastMove.y === move.y;\n      const progress = isLastMove\n        ? 1 - Math.pow(1 - this.latestMoveProgress, 3)\n        : 1;\n      const markScale = isLastMove ? 0.72 + 0.28 * progress : 1;\n      const margin = this.cellSize * (0.5 - 0.26 * markScale);\n      const radius = this.cellSize * 0.27 * markScale;\n      this.context.strokeStyle = move.mark === 'X' ? palette.x : palette.o;\n''',
)
replace_once(
    "src/ui/canvas-board.ts",
    '''  private handlePointerDown = (event: PointerEvent): void => {\n    const point = this.eventPoint(event);\n''',
    '''  private handlePointerDown = (event: PointerEvent): void => {\n    const point = this.eventPoint(event);\n    this.stopCameraAnimation();\n    this.stopMoveAnimation(true);\n''',
)
replace_once(
    "src/ui/canvas-board.ts",
    '''      const threshold = event.pointerType === 'touch' ? 10 : 5;\n''',
    '''      const threshold = event.pointerType === 'touch'\n        ? clamp(this.cellSize * 0.18, 8, 14)\n        : 5;\n''',
)
replace_once(
    "src/ui/canvas-board.ts",
    '''      this.moved = true;\n      const dx = point.x - this.lastPointer.x;\n''',
    '''      this.moved = true;\n      this.canvas.dataset.dragging = 'true';\n      const dx = point.x - this.lastPointer.x;\n''',
)
replace_once(
    "src/ui/canvas-board.ts",
    '''  private handlePointerUp = (event: PointerEvent): void => {\n    const point = this.pointers.get(event.pointerId) ?? this.eventPoint(event);\n    const singlePointerRelease = this.pointers.size === 1;\n\n    if (singlePointerRelease && !this.moved && !this.multiPointerGesture) {\n      this.keyboardCell = this.screenToCell(point);\n      this.announceKeyboardCell();\n      this.onCellClick(this.keyboardCell);\n      this.render();\n    }\n\n    this.pointers.delete(event.pointerId);\n\n    if (this.pointers.size === 1) {\n      this.lastPointer = [...this.pointers.values()][0];\n      this.resetPinchState();\n    } else if (this.pointers.size === 0) {\n      this.pointerStart = null;\n      this.lastPointer = null;\n      this.moved = false;\n      this.multiPointerGesture = false;\n      this.resetPinchState();\n    }\n  };\n''',
    '''  private handlePointerUp = (event: PointerEvent): void => {\n    const releasePoint = this.eventPoint(event);\n    const point = event.pointerType === 'touch' && this.pointerStart\n      ? {\n          x: (this.pointerStart.x + releasePoint.x) / 2,\n          y: (this.pointerStart.y + releasePoint.y) / 2\n        }\n      : releasePoint;\n    const singlePointerRelease = this.pointers.size === 1;\n\n    if (singlePointerRelease && !this.moved && !this.multiPointerGesture) {\n      this.keyboardCell = this.screenToCell(point);\n      this.announceKeyboardCell();\n      this.onCellClick(this.keyboardCell);\n      this.render();\n    }\n\n    this.releasePointer(event.pointerId);\n  };\n\n  private handlePointerCancel = (event: PointerEvent): void => {\n    this.releasePointer(event.pointerId);\n  };\n''',
)
replace_once(
    "src/ui/canvas-board.ts",
    '''  private handleWheel = (event: WheelEvent): void => {\n    event.preventDefault();\n    const point = this.eventPoint(event);\n    this.zoomAt(point, this.cellSize * Math.exp(-event.deltaY * 0.0012));\n    this.requestRender();\n  };\n''',
    '''  private handleWheel = (event: WheelEvent): void => {\n    event.preventDefault();\n    this.stopCameraAnimation();\n    this.stopMoveAnimation(true);\n    const point = this.eventPoint(event);\n    const deltaUnit = event.deltaMode === WheelEvent.DOM_DELTA_LINE\n      ? 16\n      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE\n        ? Math.max(1, this.height)\n        : 1;\n    this.zoomAt(point, this.cellSize * Math.exp(-event.deltaY * deltaUnit * 0.0012));\n    this.requestRender();\n  };\n''',
)
replace_once(
    "src/ui/canvas-board.ts",
    '''  private stopAnimation(): void {\n    if (this.animationFrame !== null) {\n      cancelAnimationFrame(this.animationFrame);\n      this.animationFrame = null;\n    }\n  }\n\n  private resetPinchState(): void {\n''',
    '''  private prefersReducedMotion(): boolean {\n    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;\n  }\n\n  private stopAnimation(): void {\n    if (this.animationFrame !== null) {\n      cancelAnimationFrame(this.animationFrame);\n      this.animationFrame = null;\n    }\n  }\n\n  private stopCameraAnimation(): void {\n    if (this.cameraFrame !== null) {\n      cancelAnimationFrame(this.cameraFrame);\n      this.cameraFrame = null;\n    }\n  }\n\n  private stopMoveAnimation(finish = false): void {\n    if (this.moveFrame !== null) {\n      cancelAnimationFrame(this.moveFrame);\n      this.moveFrame = null;\n    }\n    if (finish) this.latestMoveProgress = 1;\n  }\n\n  private releasePointer(pointerId: number): void {\n    this.pointers.delete(pointerId);\n    if (this.pointers.size === 1) {\n      this.lastPointer = [...this.pointers.values()][0];\n      this.resetPinchState();\n      return;\n    }\n    if (this.pointers.size === 0) {\n      this.pointerStart = null;\n      this.lastPointer = null;\n      this.moved = false;\n      this.multiPointerGesture = false;\n      delete this.canvas.dataset.dragging;\n      this.resetPinchState();\n    }\n  }\n\n  private resetPinchState(): void {\n''',
)

replace_once(
    "src/main.ts",
    '''let view: CanvasBoard;\n\nconst isMark =''',
    '''let view: CanvasBoard;\n\nconst appDialogs = [aboutDialog, resultDialog, resumeDialog, historyDialog, settingsDialog] as const;\nconst dialogStateKey = 'infiniteFiveDialog';\nlet dialogAfterBack: (() => void) | null = null;\n\nconst currentDialogState = (): string | null => {\n  if (!history.state || typeof history.state !== 'object') return null;\n  const value = (history.state as Record<string, unknown>)[dialogStateKey];\n  return typeof value === 'string' ? value : null;\n};\n\nconst showDialog = (dialog: HTMLDialogElement): void => {\n  if (dialog.open) return;\n  const state = history.state && typeof history.state === 'object'\n    ? history.state as Record<string, unknown>\n    : {};\n  history.pushState({ ...state, [dialogStateKey]: dialog.id }, '');\n  dialog.showModal();\n};\n\nconst closeDialog = (dialog: HTMLDialogElement, after?: () => void): void => {\n  if (!dialog.open) {\n    after?.();\n    return;\n  }\n  dialog.close();\n  if (currentDialogState() === dialog.id) {\n    dialogAfterBack = after ?? null;\n    history.back();\n  } else {\n    after?.();\n  }\n};\n\nconst vibrate = (pattern: number | number[]): void => {\n  if (settings.vibration && 'vibrate' in navigator) navigator.vibrate(pattern);\n};\n\nconst isMark =''',
)
replace_once(
    "src/main.ts",
    '''  centerButton.querySelector('.button-label')!.textContent = text.center;\n  undoButton.querySelector('.button-label')!.textContent = text.undo;\n  historyButton.querySelector('.button-label')!.textContent = text.history;\n  settingsButton.querySelector('.button-label')!.textContent = text.settings;\n  newGameButton.querySelector('.button-label')!.textContent = text.newGame;\n''',
    '''  centerButton.querySelector('.button-label')!.textContent = text.center;\n  undoButton.querySelector('.button-label')!.textContent = text.undo;\n  historyButton.querySelector('.button-label')!.textContent = text.history;\n  settingsButton.querySelector('.button-label')!.textContent = text.settings;\n  newGameButton.querySelector('.button-label')!.textContent = text.newGame;\n  centerButton.setAttribute('aria-label', text.center);\n  undoButton.setAttribute('aria-label', text.undo);\n  historyButton.setAttribute('aria-label', text.history);\n  settingsButton.setAttribute('aria-label', text.settings);\n  newGameButton.setAttribute('aria-label', text.newGame);\n''',
)
replace_once(
    "src/main.ts",
    '''  if (settings.vibration && 'vibrate' in navigator) {\n    navigator.vibrate(settings.mode === 'ai' && winner !== humanMark ? [45, 45, 70] : [45, 35, 45]);\n  }\n''',
    '''  vibrate(settings.mode === 'ai' && winner !== humanMark\n    ? [26, 38, 65]\n    : [18, 24, 18, 24, 42]);\n''',
)
replace_once(
    "src/main.ts",
    '''  if (resultDialog.open) resultDialog.close();\n''',
    '''  if (resultDialog.open) closeDialog(resultDialog);\n''',
)
replace_once(
    "src/main.ts",
    '''  resultDialog.showModal();\n''',
    '''  showDialog(resultDialog);\n''',
)
replace_once(
    "src/main.ts",
    '''  view.setWinningLine(winningLine);\n  refreshUi();\n  if (winner) presentResult();\n''',
    '''  view.setWinningLine(winningLine);\n  view.animateLatestMove();\n  refreshUi();\n  if (winner) presentResult();\n''',
)
replace_once(
    "src/main.ts",
    '''  if (resumeDialog.open) resumeDialog.close();\n''',
    '''  if (resumeDialog.open) closeDialog(resumeDialog);\n''',
)
replace_once(
    "src/main.ts",
    '''const handleCellClick = (position: Position): void => {\n  if (winner || replay || aiThinking || board.get(position.x, position.y)) return;\n  if (settings.mode === 'ai' && currentMark !== humanMark) return;\n  if (applyMove(position, currentMark) && settings.mode === 'ai' && !winner) scheduleAiTurn();\n};\n''',
    '''const handleCellClick = (position: Position): void => {\n  if (winner || replay || aiThinking) return;\n  if (board.get(position.x, position.y)) {\n    vibrate([7, 28, 7]);\n    return;\n  }\n  if (settings.mode === 'ai' && currentMark !== humanMark) return;\n  if (!applyMove(position, currentMark)) return;\n  if (!winner) vibrate(9);\n  if (settings.mode === 'ai' && !winner) scheduleAiTurn();\n};\n''',
)
replace_once(
    "src/main.ts",
    '''  settingsDialog.close();\n  refreshUi();\n  if (settings.mode === 'ai' && previousSide !== settings.humanSide) resetGame();\n};\n''',
    '''  closeDialog(settingsDialog, () => {\n    refreshUi();\n    if (settings.mode === 'ai' && previousSide !== settings.humanSide) resetGame();\n  });\n};\n''',
)
replace_once(
    "src/main.ts",
    '''  resumeDialog.showModal();\n''',
    '''  showDialog(resumeDialog);\n''',
)
replace_once(
    "src/main.ts",
    '''  view.centerOn(moves[moves.length - 1]);\n});\n\nthemeButton.addEventListener''',
    '''  view.centerOn(moves[moves.length - 1], true);\n});\n\nthemeButton.addEventListener''',
)
replace_once(
    "src/main.ts",
    '''historyButton.addEventListener('click', () => {\n  renderHistory();\n  historyDialog.showModal();\n});\nhistoryCloseButton.addEventListener('click', () => historyDialog.close());\n\naboutButton.addEventListener('click', () => aboutDialog.showModal());\naboutCloseButton.addEventListener('click', () => aboutDialog.close());\n\nsettingsButton.addEventListener('click', () => {\n  syncSettingsDialog();\n  settingsDialog.showModal();\n});\n\nsettingsSaveButton.addEventListener('click', saveDialogSettings);\nsettingsCloseButton.addEventListener('click', () => settingsDialog.close());\n\nnewGameButton.addEventListener('click', resetGame);\nresultNewGameButton.addEventListener('click', resetGame);\nresultReplayButton.addEventListener('click', () => enterReplay(board.getMoves(), false, 0));\nresultShareButton.addEventListener('click', () => void shareGame());\nresultCloseButton.addEventListener('click', () => resultDialog.close());\n\nresumeContinueButton.addEventListener('click', () => {\n  resumeDialog.close();\n  const lastMove = board.getMoves()[board.getMoves().length - 1];\n  view.centerOn(lastMove);\n  if (settings.mode === 'ai' && currentMark === computerMark()) scheduleAiTurn();\n});\nresumeNewGameButton.addEventListener('click', resetGame);\n''',
    '''historyButton.addEventListener('click', () => {\n  renderHistory();\n  showDialog(historyDialog);\n});\nhistoryCloseButton.addEventListener('click', () => closeDialog(historyDialog));\n\naboutButton.addEventListener('click', () => showDialog(aboutDialog));\naboutCloseButton.addEventListener('click', () => closeDialog(aboutDialog));\n\nsettingsButton.addEventListener('click', () => {\n  syncSettingsDialog();\n  showDialog(settingsDialog);\n});\n\nsettingsSaveButton.addEventListener('click', saveDialogSettings);\nsettingsCloseButton.addEventListener('click', () => closeDialog(settingsDialog));\n\nnewGameButton.addEventListener('click', resetGame);\nresultNewGameButton.addEventListener('click', () => closeDialog(resultDialog, resetGame));\nresultReplayButton.addEventListener('click', () =>\n  closeDialog(resultDialog, () => enterReplay(board.getMoves(), false, 0))\n);\nresultShareButton.addEventListener('click', () => void shareGame());\nresultCloseButton.addEventListener('click', () => closeDialog(resultDialog));\n\nresumeContinueButton.addEventListener('click', () => {\n  closeDialog(resumeDialog, () => {\n    const lastMove = board.getMoves()[board.getMoves().length - 1];\n    view.centerOn(lastMove);\n    if (settings.mode === 'ai' && currentMark === computerMark()) scheduleAiTurn();\n  });\n});\nresumeNewGameButton.addEventListener('click', () => closeDialog(resumeDialog, resetGame));\n''',
)
replace_once(
    "src/main.ts",
    '''        historyDialog.close();\n        enterReplay(moves, true, 0);\n''',
    '''        closeDialog(historyDialog, () => enterReplay(moves, true, 0));\n''',
)
replace_once(
    "src/main.ts",
    '''replayExitButton.addEventListener('click', exitReplay);\n\nwindow.addEventListener('beforeinstallprompt', (event) => {\n''',
    '''replayExitButton.addEventListener('click', exitReplay);\n\nfor (const dialog of appDialogs) {\n  dialog.addEventListener('cancel', (event) => {\n    event.preventDefault();\n    closeDialog(dialog);\n  });\n}\n\nwindow.addEventListener('popstate', () => {\n  const openDialog = appDialogs.find((dialog) => dialog.open);\n  if (openDialog) openDialog.close();\n  const after = dialogAfterBack;\n  dialogAfterBack = null;\n  after?.();\n});\n\nwindow.addEventListener('beforeinstallprompt', (event) => {\n''',
)

replace_once(
    "src/styles.css",
    '''#board {\n  position: absolute;\n  inset: 0;\n  display: block;\n  width: 100%;\n  height: 100%;\n  touch-action: none;\n  user-select: none;\n  -webkit-user-select: none;\n  cursor: crosshair;\n}\n''',
    '''#board {\n  position: absolute;\n  inset: 0;\n  display: block;\n  width: 100%;\n  height: 100%;\n  touch-action: none;\n  user-select: none;\n  -webkit-user-select: none;\n  cursor: crosshair;\n}\n\n#board[data-dragging='true'] {\n  cursor: grabbing;\n}\n''',
)
replace_once(
    "src/styles.css",
    '''.modal-dialog {\n  width: min(430px, calc(100vw - 28px));\n  padding: 0;\n''',
    '''.modal-dialog {\n  width: min(430px, calc(100vw - 28px));\n  max-height: calc(100dvh - 24px);\n  padding: 0;\n''',
)
replace_once(
    "src/styles.css",
    '''.dialog-body {\n  padding: 22px;\n}\n''',
    '''.dialog-body {\n  max-height: calc(100dvh - 26px);\n  padding: 22px;\n  overflow: auto;\n  overscroll-behavior: contain;\n}\n''',
)
replace_once(
    "src/styles.css",
    '''  .topbar {\n    min-height: 54px;\n    padding-bottom: 7px;\n  }\n''',
    '''  .topbar {\n    min-height: 54px;\n    grid-template-columns: auto 1fr;\n    padding-bottom: 7px;\n  }\n''',
)
replace_once(
    "src/styles.css",
    '''  .status {\n    font-size: 12px;\n  }\n\n  .actions {\n    gap: 4px;\n  }\n\n  .actions button {\n    width: 38px;\n    min-width: 38px;\n    height: 38px;\n    min-height: 38px;\n    border-radius: 9px;\n  }\n''',
    '''  .status {\n    justify-self: end;\n    text-align: right;\n    font-size: 12px;\n  }\n\n  .actions {\n    grid-column: 1 / -1;\n    justify-self: stretch;\n    display: grid;\n    grid-template-columns: repeat(6, minmax(44px, 1fr));\n    gap: 4px;\n  }\n\n  .actions button {\n    width: 100%;\n    min-width: 44px;\n    height: 44px;\n    min-height: 44px;\n    border-radius: 9px;\n  }\n''',
)
replace_once(
    "src/styles.css",
    '''@media (max-width: 410px) {\n  .actions button {\n    width: 32px;\n    min-width: 32px;\n    height: 36px;\n    min-height: 36px;\n  }\n\n  .button-icon {\n    font-size: 15px;\n  }\n\n  .game-info-copy p {\n    max-height: 2.65em;\n    overflow: hidden;\n  }\n}\n''',
    '''@media (max-width: 410px) {\n  .topbar {\n    padding-inline: max(8px, env(safe-area-inset-left));\n  }\n\n  .button-icon {\n    font-size: 15px;\n  }\n\n  .game-info-copy p {\n    max-height: 2.65em;\n    overflow: hidden;\n  }\n}\n''',
)
replace_once(
    "src/styles.css",
    '''@media (max-width: 620px) {\n  .game-info-copy {\n    padding-right: 36px;\n  }\n\n  .about-button {\n    width: 28px;\n    height: 28px;\n    min-height: 28px;\n    font-size: 13px;\n  }\n}\n\n@media (forced-colors: active) {\n''',
    '''@media (max-width: 620px) {\n  .game-info-copy {\n    padding-right: 42px;\n  }\n\n  .about-button {\n    width: 38px;\n    height: 38px;\n    min-height: 38px;\n    font-size: 14px;\n  }\n}\n\n@media (max-height: 520px) and (orientation: landscape) {\n  .topbar {\n    min-height: 48px;\n    grid-template-columns: auto 1fr auto;\n    padding-top: max(6px, env(safe-area-inset-top));\n    padding-bottom: 6px;\n  }\n\n  .actions {\n    grid-column: auto;\n    justify-self: end;\n    display: flex;\n  }\n\n  .actions button {\n    width: 38px;\n    min-width: 38px;\n    height: 38px;\n    min-height: 38px;\n  }\n\n  .game-info {\n    grid-template-columns: minmax(220px, 1fr) auto;\n    gap: 10px;\n    padding-top: 5px;\n    padding-bottom: 5px;\n  }\n\n  .game-info-copy p,\n  .option-field > span {\n    display: none;\n  }\n\n  .stats {\n    padding-top: 0;\n  }\n}\n\n@media (forced-colors: active) {\n''',
)

print("v0.6.0 UX patch applied")
