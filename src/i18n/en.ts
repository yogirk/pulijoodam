// English copy. This file is the source of truth — its shape defines
// the Dictionary type that te.ts must satisfy.

export const en = {
  app: {
    name: 'Pulijoodam',
    subtitle: 'The Tiger–Goat Hunt',
    tagline:
      'A two-thousand-year-old game of three hunters and fifteen prey, carved into temple floors across the south.',
    eyebrow: 'Hunt game · two players',
    establishedNote: 'est. circa 1500 ce · andhra',
  },

  common: {
    tigers: 'Tigers',
    goats: 'Goats',
    you: 'You',
    opponent: 'Opponent',
    captured: 'Captured',
    remaining: 'Remaining',
    onBoard: 'On board',
    inHand: 'In hand',
    moves: 'Moves',
    pool: 'Pool',
    home: 'Home',
    back: 'Back',
    close: 'Close',
    cancel: 'Cancel',
    continue: 'Continue',
    yes: 'Yes',
    no: 'No',
  },

  phase: {
    placement: 'Placement',
    movement: 'Movement',
  },

  turn: {
    yours: 'Your turn',
    theirs: "Opponent's turn",
    goat: "Goat's turn",
    tiger: "Tiger's turn",
    placeAGoat: 'Place a goat',
    moveAPiece: 'Move a piece',
  },

  setup: {
    chooseMode: 'Choose your match',
    vsAi: 'Play vs AI',
    vsAiHint: 'Intelligent opponent',
    vsLocal: 'Local two-player',
    vsLocalHint: 'Pass and play',
    vsOnline: 'Online match',
    vsOnlineHint: 'Invite a friend',
    chooseSide: 'Choose a side',
    tigersDesc: 'Three hunters. Capture ten goats to win.',
    goatsDesc: 'Fifteen prey. Trap every tiger to win.',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',
    begin: 'Begin the hunt',
    learnRules: 'Learn the rules',
    boardCaption: '23 nodes · 4 slants · 4 levels',
  },

  game: {
    undo: 'Undo',
    redo: 'Redo',
    pause: 'Pause',
    surrender: 'Surrender',
    endGame: 'End game',
    moveHistory: 'Move history',
    movesEmpty: 'Awaiting first move',
    rules: 'Rules',
    aboutTheHunt: 'The Ancient Hunt',
    aboutTheHuntBody:
      'The hunt began on temple floors centuries ago. Three tigers start at the top. Fifteen goats drop one by one, trying to surround the tigers before they are hunted down.',
    goatMovesFirst: 'The goat moves first',
    endTurn: 'End turn',
    chainPossible: 'Capture chain — keep going or end turn',
    aiThinking: 'Thinking…',
  },

  gameOver: {
    eyebrow: 'The game has ended',
    tigersWin: 'The tigers prevail',
    goatsWin: 'The herd has triumphed',
    drawRepetition: 'A draw — the same position thrice',
    draw50Moves: 'A draw — fifty moves without a capture',
    flourishTigerWin: '— the tenth goat has fallen —',
    flourishGoatWin: '— every tiger is immobilised —',
    captured: 'Captured',
    trapped: 'Trapped',
    moves: 'Moves',
    rematch: 'Rematch',
    review: 'Review board',
    home: 'Home',
  },

  settings: {
    title: 'Settings',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    language: 'Language',
    langEn: 'English',
    langTe: 'తెలుగు',
    sound: 'Sound',
    soundOn: 'On',
    soundOff: 'Off',
    pieces: 'Pieces',
    pieceClassic: 'Classic',
    pieceCharacter: 'Character',
    learnToPlay: 'Learn to play',
  },

  multiplayer: {
    connected: 'Connected',
    reconnecting: 'Reconnecting',
    disconnected: 'Disconnected',
    waitingForOpponent: 'Waiting for opponent…',
    invite: 'Invite a friend',
    join: 'Join match',
    inviteCode: 'Invite code',
  },

  history: {
    title: 'Game history',
    empty: 'No games played yet',
    emptyCta: 'Start your first game',
    notationHint: 'Each game is recorded as a sequence of moves you can replay later.',
  },

  errors: {
    illegalMove: 'That move isn’t legal',
    networkLost: 'Connection lost',
    unknown: 'Something went wrong',
  },
} as const;

/**
 * Widen string-literal leaves to plain `string` while preserving the nested
 * shape, so other dictionaries (te.ts) can satisfy the same key set with
 * different values.
 */
type WidenStrings<T> = T extends string
  ? string
  : T extends readonly unknown[]
    ? { [K in keyof T]: WidenStrings<T[K]> }
    : T extends object
      ? { [K in keyof T]: WidenStrings<T[K]> }
      : T;

export type Dictionary = WidenStrings<typeof en>;
