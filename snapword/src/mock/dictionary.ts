/**
 * Mock dictionary. In production this would call the AI Vision API + dictionary API.
 * Keys are lowercase English words.
 */

export interface DictEntry {
  word: string;
  phonetic: { us: string; uk: string };
  partOfSpeech: string;
  meaningZh: string;
  examples: Array<{ en: string; zh: string }>;
}

export const DICTIONARY: Record<string, DictEntry> = {
  apple: {
    word: 'apple',
    phonetic: { us: '/ˈæp.əl/', uk: '/ˈæp.əl/' },
    partOfSpeech: 'n.',
    meaningZh: '苹果',
    examples: [
      { en: 'She ate a red apple after lunch.', zh: '她午饭后吃了一个红苹果。' },
      { en: 'An apple a day keeps the doctor away.', zh: '一天一苹果，医生远离我。' },
    ],
  },
  banana: {
    word: 'banana',
    phonetic: { us: '/bəˈnæn.ə/', uk: '/bəˈnɑː.nə/' },
    partOfSpeech: 'n.',
    meaningZh: '香蕉',
    examples: [
      { en: 'Monkeys love bananas.', zh: '猴子爱吃香蕉。' },
    ],
  },
  cup: {
    word: 'cup',
    phonetic: { us: '/kʌp/', uk: '/kʌp/' },
    partOfSpeech: 'n.',
    meaningZh: '杯子；一杯（的量）',
    examples: [
      { en: 'I drink a cup of coffee every morning.', zh: '我每天早上喝一杯咖啡。' },
    ],
  },
  book: {
    word: 'book',
    phonetic: { us: '/bʊk/', uk: '/bʊk/' },
    partOfSpeech: 'n.',
    meaningZh: '书；书本',
    examples: [
      { en: 'She is reading a book about history.', zh: '她正在读一本关于历史的书。' },
    ],
  },
  chair: {
    word: 'chair',
    phonetic: { us: '/tʃer/', uk: '/tʃeə/' },
    partOfSpeech: 'n.',
    meaningZh: '椅子',
    examples: [
      { en: 'Please have a seat on the chair.', zh: '请坐在椅子上。' },
    ],
  },
  laptop: {
    word: 'laptop',
    phonetic: { us: '/ˈlæp.tɑːp/', uk: '/ˈlæp.tɒp/' },
    partOfSpeech: 'n.',
    meaningZh: '笔记本电脑',
    examples: [
      { en: 'I bought a new laptop for work.', zh: '我买了一台新笔记本电脑用于工作。' },
    ],
  },
  keyboard: {
    word: 'keyboard',
    phonetic: { us: '/ˈkiː.bɔːrd/', uk: '/ˈkiː.bɔːd/' },
    partOfSpeech: 'n.',
    meaningZh: '键盘',
    examples: [
      { en: 'This mechanical keyboard is so satisfying to type on.', zh: '这个机械键盘打起字来真过瘾。' },
    ],
  },
  mouse: {
    word: 'mouse',
    phonetic: { us: '/maʊs/', uk: '/maʊs/' },
    partOfSpeech: 'n.',
    meaningZh: '鼠标；老鼠',
    examples: [
      { en: 'Move the mouse to the corner of the screen.', zh: '把鼠标移到屏幕角落。' },
    ],
  },
  phone: {
    word: 'phone',
    phonetic: { us: '/foʊn/', uk: '/fəʊn/' },
    partOfSpeech: 'n.',
    meaningZh: '手机；电话',
    examples: [
      { en: 'My phone battery is almost dead.', zh: '我的手机电池快没电了。' },
    ],
  },
  bottle: {
    word: 'bottle',
    phonetic: { us: '/ˈbɑː.t̬əl/', uk: '/ˈbɒt.əl/' },
    partOfSpeech: 'n.',
    meaningZh: '瓶子',
    examples: [
      { en: 'Please pass me a bottle of water.', zh: '请递给我一瓶水。' },
    ],
  },
  pen: {
    word: 'pen',
    phonetic: { us: '/pen/', uk: '/pen/' },
    partOfSpeech: 'n.',
    meaningZh: '钢笔；笔',
    examples: [
      { en: 'May I borrow your pen?', zh: '可以借一下你的笔吗？' },
    ],
  },
  glasses: {
    word: 'glasses',
    phonetic: { us: '/ˈɡlæs.ɪz/', uk: '/ˈɡlɑː.sɪz/' },
    partOfSpeech: 'n.',
    meaningZh: '眼镜',
    examples: [
      { en: 'I need my glasses to read this.', zh: '我得戴上眼镜才能读这个。' },
    ],
  },
  watch: {
    word: 'watch',
    phonetic: { us: '/wɑːtʃ/', uk: '/wɒtʃ/' },
    partOfSpeech: 'n.',
    meaningZh: '手表',
    examples: [
      { en: 'My grandfather gave me this watch.', zh: '我祖父送了我这块手表。' },
    ],
  },
  flower: {
    word: 'flower',
    phonetic: { us: '/ˈflaʊ.ɚ/', uk: '/ˈflaʊ.ə/' },
    partOfSpeech: 'n.',
    meaningZh: '花',
    examples: [
      { en: 'She gave me a beautiful flower.', zh: '她送了我一朵漂亮的花。' },
    ],
  },
  tree: {
    word: 'tree',
    phonetic: { us: '/triː/', uk: '/triː/' },
    partOfSpeech: 'n.',
    meaningZh: '树',
    examples: [
      { en: 'The tree in the yard is over a hundred years old.', zh: '院子里这棵树有一百多年了。' },
    ],
  },
  car: {
    word: 'car',
    phonetic: { us: '/kɑːr/', uk: '/kɑː/' },
    partOfSpeech: 'n.',
    meaningZh: '汽车',
    examples: [
      { en: 'He washes his car every weekend.', zh: '他每个周末都洗车。' },
    ],
  },
  bicycle: {
    word: 'bicycle',
    phonetic: { us: '/ˈbaɪ.sɪ.kəl/', uk: '/ˈbaɪ.sɪ.kəl/' },
    partOfSpeech: 'n.',
    meaningZh: '自行车',
    examples: [
      { en: 'I ride my bicycle to school.', zh: '我骑自行车去学校。' },
    ],
  },
  coffee: {
    word: 'coffee',
    phonetic: { us: '/ˈkɑː.fi/', uk: '/ˈkɒf.i/' },
    partOfSpeech: 'n.',
    meaningZh: '咖啡',
    examples: [
      { en: "I'd like a cup of coffee, please.", zh: '请给我来一杯咖啡。' },
    ],
  },
  bread: {
    word: 'bread',
    phonetic: { us: '/bred/', uk: '/bred/' },
    partOfSpeech: 'n.',
    meaningZh: '面包',
    examples: [
      { en: 'She baked fresh bread this morning.', zh: '她今早烤了新鲜面包。' },
    ],
  },
  cat: {
    word: 'cat',
    phonetic: { us: '/kæt/', uk: '/kæt/' },
    partOfSpeech: 'n.',
    meaningZh: '猫',
    examples: [
      { en: 'My cat loves to sleep on the windowsill.', zh: '我的猫喜欢睡在窗台上。' },
    ],
  },
  dog: {
    word: 'dog',
    phonetic: { us: '/dɔːɡ/', uk: '/dɒɡ/' },
    partOfSpeech: 'n.',
    meaningZh: '狗',
    examples: [
      { en: 'The dog barked at the stranger.', zh: '那只狗对陌生人叫了起来。' },
    ],
  },
};

export const ALL_WORDS = Object.keys(DICTIONARY);
