// Telugu copy. Must satisfy the Dictionary type defined in en.ts.
// Translations marked `// TODO: TE confirm` are best-effort and should
// be reviewed by a native speaker before public launch.

import type { Dictionary } from './en';

export const te: Dictionary = {
  app: {
    name: 'పులిజూదం',
    subtitle: 'పులీ–మేకా వేట',
    tagline:
      'మూడు పులులు, పదిహేను మేకలు — దక్షిణాది గుళ్ళ నేలల్లో చెక్కబడిన రెండువేల ఏళ్ళ ఆట.',
    eyebrow: 'వేట ఆట · ఇద్దరు ఆటగాళ్ళు',
    establishedNote: 'క్రీ.శ. ౧౫౦౦ సుమారు · ఆంధ్ర', // TODO: TE confirm numerals
  },

  common: {
    tigers: 'పులులు',
    goats: 'మేకలు',
    you: 'మీరు',
    opponent: 'ప్రత్యర్థి',
    captured: 'పట్టుబడ్డవి',
    remaining: 'మిగిలినవి',
    onBoard: 'బోర్డుపై',
    inHand: 'చేతిలో',
    moves: 'ఎత్తులు',
    pool: 'నిల్వ', // TODO: TE confirm
    home: 'హోమ్',
    back: 'వెనక్కి',
    close: 'మూసివేయి',
    cancel: 'రద్దు',
    continue: 'కొనసాగించు',
    yes: 'అవును',
    no: 'కాదు',
  },

  phase: {
    placement: 'స్థాపన',
    movement: 'కదలిక',
  },

  turn: {
    yours: 'మీ వంతు',
    theirs: 'ప్రత్యర్థి వంతు',
    goat: 'మేక వంతు',
    tiger: 'పులి వంతు',
    placeAGoat: 'మేకను ఉంచు',
    moveAPiece: 'కాయిని కదుపు',
  },

  setup: {
    chooseMode: 'ఆట ఎంచుకోండి',
    vsAi: 'కంప్యూటర్‌తో',
    vsAiHint: 'తెలివైన ప్రత్యర్థి',
    vsLocal: 'ఇద్దరు ఆటగాళ్ళు',
    vsLocalHint: 'ఒకే పరికరంలో',
    vsOnline: 'ఆన్‌లైన్',
    vsOnlineHint: 'మిత్రుని ఆహ్వానించు',
    chooseSide: 'వైపు ఎంచుకోండి',
    tigersDesc: 'మూడు వేటాడేవి. పది మేకలను పట్టుకుంటే గెలుపు.',
    goatsDesc: 'పదిహేను బలిపశువులు. మూడు పులులను బంధిస్తే గెలుపు.',
    difficulty: 'కష్టత',
    easy: 'సులభం',
    medium: 'మధ్యమం',
    hard: 'కష్టం',
    expert: 'నిపుణుడు',
    begin: 'వేట మొదలెట్టు',
    learnRules: 'నియమాలు తెలుసుకో',
    boardCaption: '౨౩ స్థానాలు · ౪ రేఖలు · ౪ స్థాయిలు', // TODO: TE confirm numerals
    resumePrompt: 'ఆట కొనసాగిద్దామా?',
    resumeAiBody: '{n} ఎత్తులు పూర్తయిన కంప్యూటర్ ఆట.',
    resumeLocalBody: '{n} ఎత్తులు పూర్తయిన ఇద్దరి ఆట.',
    newGame: 'క్రొత్త ఆట',
  },

  game: {
    undo: 'తిరిగి',
    redo: 'మళ్ళీ',
    pause: 'విరామం',
    surrender: 'శరణాగతి',
    endGame: 'ఆట ముగించు',
    moveHistory: 'ఎత్తుల చరిత్ర',
    movesEmpty: 'మొదటి ఎత్తు కోసం వేచి ఉంది',
    rules: 'నియమాలు',
    aboutTheHunt: 'ప్రాచీన వేట',
    aboutTheHuntBody:
      'శతాబ్దాల క్రితం గుళ్ళ నేలలపై మొదలైన ఆట ఇది. మూడు పులులు పైన ఉంటాయి. పదిహేను మేకలు ఒకొక్కటిగా దిగుతూ పులులను చుట్టుముట్టడానికి ప్రయత్నిస్తాయి, లేదా వేటాడబడతాయి.', // TODO: TE confirm
    goatMovesFirst: 'మేక మొదట కదులుతుంది',
    endTurn: 'వంతు ముగించు',
    chainPossible: 'వరుస వేట — కొనసాగించు లేదా వంతు ముగించు',
    aiThinking: 'ఆలోచిస్తోంది…',
    autoSaved: 'సేవ్ అయింది', // TODO: TE confirm
    autoSavedHint: 'మీ ఆట సురక్షితం. మెను నుండి మళ్లీ కొనసాగించవచ్చు.', // TODO: TE confirm
  },

  gameOver: {
    eyebrow: 'ఆట ముగిసింది',
    tigersWin: 'పులులు విజయం',
    goatsWin: 'మేకల విజయం',
    drawRepetition: 'డ్రా — ఒకే స్థితి మూడుసార్లు',
    draw50Moves: 'డ్రా — యాభై ఎత్తులు పట్టుబడకుండా', // TODO: TE confirm
    flourishTigerWin: '— పదవ మేక పడింది —',
    flourishGoatWin: '— అన్ని పులులూ బంధించబడ్డాయి —',
    captured: 'పట్టుబడ్డవి',
    trapped: 'బంధించబడ్డవి',
    moves: 'ఎత్తులు',
    rematch: 'మరోసారి',
    review: 'బోర్డ్ చూడు',
    home: 'హోమ్',
  },

  settings: {
    title: 'అమరికలు',
    theme: 'వర్ణం', // TODO: TE confirm — better word for "theme"?
    themeLight: 'వెలుతురు',
    themeDark: 'చీకటి',
    language: 'భాష',
    langEn: 'English',
    langTe: 'తెలుగు',
    sound: 'శబ్దం',
    soundOn: 'ఆన్',
    soundOff: 'ఆఫ్',
    pieces: 'కాయలు',
    pieceStone: 'రాతిబిళ్ళలు', // TODO: TE confirm — "stone discs"
    pieceHeads: 'జంతువుల తలలు', // TODO: TE confirm — "animal heads"
    learnToPlay: 'ఆడడం నేర్చుకో',
  },

  multiplayer: {
    connected: 'అనుసంధానం',
    reconnecting: 'మళ్ళీ కలుపుతోంది',
    disconnected: 'అనుసంధానం లేదు',
    waitingForOpponent: 'ప్రత్యర్థి కోసం వేచి ఉంది…',
    invite: 'మిత్రుని ఆహ్వానించు',
    join: 'ఆటలో చేరండి',
    inviteCode: 'ఆహ్వాన కోడ్',
  },

  history: {
    title: 'ఆటల చరిత్ర',
    empty: 'ఇంకా ఆటలు ఆడలేదు',
    emptyCta: 'మొదటి ఆట ప్రారంభించు',
    notationHint:
      'ప్రతి ఆట ఒక ఎత్తుల వరుసగా నమోదవుతుంది — తర్వాత తిరిగి చూడవచ్చు.', // TODO: TE confirm
  },

  errors: {
    illegalMove: 'ఆ ఎత్తు చెల్లదు',
    networkLost: 'అనుసంధానం పోయింది',
    unknown: 'ఏదో తప్పు జరిగింది',
  },
};
