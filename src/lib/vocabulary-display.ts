import type { VocabularyEntry } from "@/lib/api/types";

const parts: Record<string, string> = {
  "adjectival nouns or quasi-adjectives (keiyodoshi)": "形容动词",
  "adjective (keiyoushi)": "形容词",
  "adverb (fukushi)": "副词",
  "adverb taking the 'to' particle": "副词（可接と）",
  "archaic/formal form of na-adjective": "形容动词（古语／正式）",
  "'ku' adjective (archaic)": "形容词（古语）",
  "'taru' adjective": "形容动词（タリ活用）",
  auxiliary: "助词／助动词", "auxiliary verb": "助动词",
  conjunction: "接续词", counter: "量词",
  "expressions (phrases, clauses, etc.)": "短语／惯用表达",
  "interjection (kandoushi)": "感叹词", "intransitive verb": "自动词",
  "noun (common) (futsuumeishi)": "名词",
  "noun or participle which takes the aux. verb suru": "名词（可接する）",
  "noun or verb acting prenominally": "连体修饰词",
  "noun, used as a prefix": "名词（作前缀）",
  "noun, used as a suffix": "名词（作后缀）",
  "nouns which may take the genitive case particle 'no'": "名词（可接の）",
  numeric: "数词", particle: "助词", "pre-noun adjectival (rentaishi)": "连体词",
  prefix: "前缀", pronoun: "代词", suffix: "后缀",
  "suru verb - included": "サ变动词", "suru verb - special class": "サ变动词（特殊）",
  "transitive verb": "他动词", unclassified: "未分类",
  n: "名词", "adj-i": "形容词", "adj-na": "形容动词", adv: "副词",
  v1: "一段动词", vt: "他动词", vi: "自动词", "vs-i": "サ变动词",
};
export function chineseParts(values: string[]) {
  return [...new Set(values.map(value => parts[value] ?? (
    /^Godan verb|^v5/.test(value) ? "五段动词" :
    /^Ichidan verb/.test(value) ? "一段动词" :
    /^Nidan verb/.test(value) ? "二段动词（古语）" :
    /\p{Script=Han}/u.test(value) ? value : "其他词性"
  )))].join("、");
}
export function chineseMeaning(word: Pick<VocabularyEntry, "chineseGloss" | "glosses">) {
  return word.chineseGloss?.trim() || word.glosses
    .filter(g => /^(zh(?:[-_].*)?|zho|chi)$/i.test(g.language))
    .map(g => g.text).join("；") || "中文释义待补充";
}
