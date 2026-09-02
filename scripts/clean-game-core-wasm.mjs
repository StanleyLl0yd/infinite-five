import { rmSync } from 'node:fs';

rmSync('public/game-core', { recursive: true, force: true });
