import { describe, expect, it } from "vitest";
import { chineseMeaning, chineseParts, showVocabularyReading } from "./vocabulary-display";
describe("vocabulary title readings", () => {
 it.each(["あっさり", "あべこべ", "コーヒー", "ｺｰﾋｰ", "ｶﾞﾗｽ", "コンピューター・ゲーム", "いろいろ", "すゞめ", "ヽヾ", "カタカナ ひらがな"])("hides the redundant reading for %s", word => {
  expect(showVocabularyReading(word)).toBe(false);
 });
 it.each(["明白", "食べる", "時々", "第1", "AI", "", "ー・"])("does not classify %s as a kana-only word", word => {
  expect(showVocabularyReading(word)).toBe(true);
 });
});
describe("vocabulary Chinese display", () => {
 it("prefers Chinese without presenting English as the meaning", () => {
  expect(chineseMeaning({chineseGloss:"花哨的；刺眼的",glosses:[{language:"eng",text:"gaudy"}]})).toBe("花哨的；刺眼的");
  expect(chineseMeaning({chineseGloss:null,glosses:[{language:"zho",text:"计划"}]})).toBe("计划");
  expect(chineseMeaning({chineseGloss:null,glosses:[{language:"eng",text:"gaudy"}]})).toBe("中文释义待补充");
 });
 it("localizes grammatical labels and keeps original Chinese labels", () => {
  expect(chineseParts(["adjectival nouns or quasi-adjectives (keiyodoshi)","nouns which may take the genitive case particle 'no'"])).toBe("形容动词、名词（可接の）");
  expect(chineseParts(["Godan verb with 'su' ending","transitive verb","名词"])).toBe("五段动词、他动词、名词");
 });
});
