import { describe, it, expect, beforeEach } from 'vitest';
import { validateSection, validateRecord, isDuplicate, processImportData } from '../src/importLogic.js';

let idCounter = 0;
const mockGenerateId = () => `test-id-${++idCounter}`;

function resetIdCounter() {
  idCounter = 0;
}

const validSection = {
  name: '前奏',
  bpm: 80,
  mistakes: 2,
  mastery: 3,
  note: 'some note'
};

const validRecord = {
  instrument: '电吉他',
  piece: 'Blue Bossa',
  date: '2026-06-10',
  bpm: 90,
  minutes: 30,
  mistakes: 5,
  note: 'test note',
  sections: [validSection]
};

describe('validateSection', () => {
  it('通过完全有效的片段', () => {
    const result = validateSection(validSection, 0, 0);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('拒绝非对象输入（null）', () => {
    const result = validateSection(null, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('第 1 条记录的第 1 个片段不是有效的对象');
  });

  it('拒绝非对象输入（数组）', () => {
    const result = validateSection([], 1, 2);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('第 2 条记录的第 3 个片段不是有效的对象');
  });

  it('检测缺少必填字段 name', () => {
    const { name, ...rest } = validSection;
    const result = validateSection(rest, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('缺少必填字段: name'))).toBe(true);
  });

  it('检测缺少必填字段 bpm', () => {
    const { bpm, ...rest } = validSection;
    const result = validateSection(rest, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('缺少必填字段: bpm'))).toBe(true);
  });

  it('检测缺少必填字段 mistakes', () => {
    const { mistakes, ...rest } = validSection;
    const result = validateSection(rest, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('缺少必填字段: mistakes'))).toBe(true);
  });

  it('检测缺少必填字段 mastery', () => {
    const { mastery, ...rest } = validSection;
    const result = validateSection(rest, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('缺少必填字段: mastery'))).toBe(true);
  });

  it('检测必填字段为空字符串', () => {
    const result = validateSection({ ...validSection, name: '' }, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('缺少必填字段: name'))).toBe(true);
  });

  it('检测 bpm 不是数字', () => {
    const result = validateSection({ ...validSection, bpm: 'abc' }, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('字段 bpm 必须是数字'))).toBe(true);
  });

  it('检测 bpm 必须大于 0', () => {
    const result = validateSection({ ...validSection, bpm: 0 }, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('字段 bpm 必须大于 0'))).toBe(true);
  });

  it('检测 bpm 负数', () => {
    const result = validateSection({ ...validSection, bpm: -5 }, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('字段 bpm 必须大于 0'))).toBe(true);
  });

  it('检测 mistakes 不是数字', () => {
    const result = validateSection({ ...validSection, mistakes: 'bad' }, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('字段 mistakes 必须是数字'))).toBe(true);
  });

  it('检测 mistakes 不能为负数', () => {
    const result = validateSection({ ...validSection, mistakes: -1 }, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('字段 mistakes 不能为负数'))).toBe(true);
  });

  it('检测 mastery 小于 1', () => {
    const result = validateSection({ ...validSection, mastery: 0 }, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('掌握程度必须在 1-5 之间'))).toBe(true);
  });

  it('检测 mastery 大于 5', () => {
    const result = validateSection({ ...validSection, mastery: 6 }, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('掌握程度必须在 1-5 之间'))).toBe(true);
  });

  it('通过 mastery 边界值 1 和 5', () => {
    expect(validateSection({ ...validSection, mastery: 1 }, 0, 0).valid).toBe(true);
    expect(validateSection({ ...validSection, mastery: 5 }, 0, 0).valid).toBe(true);
  });

  it('收集多个错误', () => {
    const result = validateSection({ name: '' }, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('正确使用 recordIndex 和 sectionIndex 从 1 开始计数', () => {
    const result = validateSection(null, 2, 3);
    expect(result.errors[0]).toContain('第 3 条记录的第 4 个片段');
  });
});

describe('validateRecord', () => {
  it('通过完全有效的记录（带 sections）', () => {
    const result = validateRecord(validRecord, 0);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('通过完全有效的记录（无 sections）', () => {
    const { sections, ...rest } = validRecord;
    const result = validateRecord(rest, 0);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('拒绝非对象输入', () => {
    expect(validateRecord(null, 0).valid).toBe(false);
    expect(validateRecord([], 0).valid).toBe(false);
    expect(validateRecord('string', 0).valid).toBe(false);
  });

  it('检测缺少必填字段 instrument', () => {
    const { instrument, ...rest } = validRecord;
    const result = validateRecord(rest, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('缺少必填字段: instrument'))).toBe(true);
  });

  it('检测缺少必填字段 piece', () => {
    const { piece, ...rest } = validRecord;
    const result = validateRecord(rest, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('缺少必填字段: piece'))).toBe(true);
  });

  it('检测缺少必填字段 date', () => {
    const { date, ...rest } = validRecord;
    const result = validateRecord(rest, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('缺少必填字段: date'))).toBe(true);
  });

  it('检测缺少必填字段 bpm', () => {
    const { bpm, ...rest } = validRecord;
    const result = validateRecord(rest, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('缺少必填字段: bpm'))).toBe(true);
  });

  it('检测缺少必填字段 minutes', () => {
    const { minutes, ...rest } = validRecord;
    const result = validateRecord(rest, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('缺少必填字段: minutes'))).toBe(true);
  });

  it('检测缺少必填字段 mistakes', () => {
    const { mistakes, ...rest } = validRecord;
    const result = validateRecord(rest, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('缺少必填字段: mistakes'))).toBe(true);
  });

  it('检测必填字段为空字符串', () => {
    const result = validateRecord({ ...validRecord, instrument: '' }, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('缺少必填字段: instrument'))).toBe(true);
  });

  it('检测 bpm 非数字', () => {
    const result = validateRecord({ ...validRecord, bpm: 'not-a-number' }, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('字段 bpm 必须是数字'))).toBe(true);
  });

  it('检测 bpm 必须大于 0', () => {
    const result = validateRecord({ ...validRecord, bpm: 0 }, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('字段 bpm 必须大于 0'))).toBe(true);
  });

  it('检测 minutes 非数字', () => {
    const result = validateRecord({ ...validRecord, minutes: 'abc' }, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('字段 minutes 必须是数字'))).toBe(true);
  });

  it('检测 minutes 必须大于 0', () => {
    const result = validateRecord({ ...validRecord, minutes: 0 }, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('字段 minutes 必须大于 0'))).toBe(true);
  });

  it('检测 mistakes 非数字', () => {
    const result = validateRecord({ ...validRecord, mistakes: 'xyz' }, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('字段 mistakes 必须是数字'))).toBe(true);
  });

  it('检测 mistakes 不能为负数', () => {
    const result = validateRecord({ ...validRecord, mistakes: -3 }, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('字段 mistakes 不能为负数'))).toBe(true);
  });

  it('检测日期格式错误', () => {
    const result = validateRecord({ ...validRecord, date: '2026/06/10' }, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('日期格式必须为 YYYY-MM-DD'))).toBe(true);
  });

  it('通过正确的日期格式', () => {
    expect(validateRecord({ ...validRecord, date: '2026-01-01' }, 0).valid).toBe(true);
    expect(validateRecord({ ...validRecord, date: '2026-12-31' }, 0).valid).toBe(true);
  });

  it('检测 sections 不是数组', () => {
    const result = validateRecord({ ...validRecord, sections: 'not-an-array' }, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('sections 字段必须是数组'))).toBe(true);
  });

  it('检测 sections 中包含无效片段', () => {
    const badSection = { name: '', bpm: -1 };
    const result = validateRecord({ ...validRecord, sections: [validSection, badSection] }, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('缺少必填字段'))).toBe(true);
    expect(result.errors.some(e => e.includes('字段 bpm 必须大于 0'))).toBe(true);
  });

  it('sections 为空数组不报错', () => {
    const result = validateRecord({ ...validRecord, sections: [] }, 0);
    expect(result.valid).toBe(true);
  });

  it('错误信息带有 第 N 条: 前缀', () => {
    const result = validateRecord({ instrument: '' }, 2);
    expect(result.errors.every(e => e.startsWith('第 3 条: '))).toBe(true);
  });
});

describe('isDuplicate', () => {
  const existingRecords = [
    { instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-10', bpm: 90, minutes: 30, mistakes: 5 },
    { instrument: '键盘', piece: 'Autumn Leaves', date: '2026-06-09', bpm: 75, minutes: 25, mistakes: 8 }
  ];

  it('识别完全相同的记录为重复', () => {
    const dup = { instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-10', bpm: 90, minutes: 30, mistakes: 5 };
    expect(isDuplicate(dup, existingRecords)).toBe(true);
  });

  it('字符串类型的数字字段也能正确匹配', () => {
    const dup = { instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-10', bpm: '90', minutes: '30', mistakes: '5' };
    expect(isDuplicate(dup, existingRecords)).toBe(true);
  });

  it('instrument 不同则不是重复', () => {
    const rec = { instrument: '木吉他', piece: 'Blue Bossa', date: '2026-06-10', bpm: 90, minutes: 30, mistakes: 5 };
    expect(isDuplicate(rec, existingRecords)).toBe(false);
  });

  it('piece 不同则不是重复', () => {
    const rec = { instrument: '电吉他', piece: 'So What', date: '2026-06-10', bpm: 90, minutes: 30, mistakes: 5 };
    expect(isDuplicate(rec, existingRecords)).toBe(false);
  });

  it('date 不同则不是重复', () => {
    const rec = { instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-11', bpm: 90, minutes: 30, mistakes: 5 };
    expect(isDuplicate(rec, existingRecords)).toBe(false);
  });

  it('bpm 不同则不是重复', () => {
    const rec = { instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-10', bpm: 91, minutes: 30, mistakes: 5 };
    expect(isDuplicate(rec, existingRecords)).toBe(false);
  });

  it('minutes 不同则不是重复', () => {
    const rec = { instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-10', bpm: 90, minutes: 31, mistakes: 5 };
    expect(isDuplicate(rec, existingRecords)).toBe(false);
  });

  it('mistakes 不同则不是重复', () => {
    const rec = { instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-10', bpm: 90, minutes: 30, mistakes: 6 };
    expect(isDuplicate(rec, existingRecords)).toBe(false);
  });

  it('空 existingRecords 永远返回 false', () => {
    const rec = { instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-10', bpm: 90, minutes: 30, mistakes: 5 };
    expect(isDuplicate(rec, [])).toBe(false);
  });
});

describe('processImportData', () => {
  beforeEach(resetIdCounter);

  const existingRecords = [
    { instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-01', bpm: 86, minutes: 35, mistakes: 18 }
  ];

  it('接受数组格式的输入', () => {
    const result = processImportData([validRecord], [], mockGenerateId);
    expect(result.newRecords.length).toBe(1);
    expect(result.validRecords.length).toBe(1);
  });

  it('接受 { records: [...] } 格式的输入', () => {
    const result = processImportData({ records: [validRecord] }, [], mockGenerateId);
    expect(result.newRecords.length).toBe(1);
  });

  it('对无法识别的格式抛出错误', () => {
    expect(() => processImportData('not-valid', [], mockGenerateId)).toThrow('无法识别的文件格式');
    expect(() => processImportData({ foo: 'bar' }, [], mockGenerateId)).toThrow('无法识别的文件格式');
    expect(() => processImportData(null, [], mockGenerateId)).toThrow('无法识别的文件格式');
  });

  it('对空数组抛出错误', () => {
    expect(() => processImportData([], [], mockGenerateId)).toThrow('没有找到任何练习记录');
  });

  it('对空 records 抛出错误', () => {
    expect(() => processImportData({ records: [] }, [], mockGenerateId)).toThrow('没有找到任何练习记录');
  });

  it('有效记录进入 newRecords（无重复）', () => {
    const result = processImportData([validRecord], [], mockGenerateId);
    expect(result.newRecords.length).toBe(1);
    expect(result.duplicateRecords.length).toBe(0);
    expect(result.invalidRecords.length).toBe(0);
    expect(result.validRecords.length).toBe(1);
    expect(result.allErrors).toEqual([]);
  });

  it('与现有记录重复则进入 duplicateRecords', () => {
    const dupRecord = {
      instrument: '电吉他',
      piece: 'Blue Bossa',
      date: '2026-06-01',
      bpm: 86,
      minutes: 35,
      mistakes: 18
    };
    const result = processImportData([dupRecord], existingRecords, mockGenerateId);
    expect(result.duplicateRecords.length).toBe(1);
    expect(result.newRecords.length).toBe(0);
    expect(result.validRecords.length).toBe(1);
  });

  it('无效记录进入 invalidRecords 并收集错误', () => {
    const bad = { instrument: '', piece: 'X' };
    const result = processImportData([bad], [], mockGenerateId);
    expect(result.invalidRecords.length).toBe(1);
    expect(result.validRecords.length).toBe(0);
    expect(result.newRecords.length).toBe(0);
    expect(result.duplicateRecords.length).toBe(0);
    expect(result.allErrors.length).toBeGreaterThan(0);
  });

  it('混合场景：新增 + 重复 + 无效 三种记录', () => {
    const newRec = { ...validRecord, piece: 'New Piece' };
    const dupRec = { instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-01', bpm: 86, minutes: 35, mistakes: 18 };
    const badRec = { instrument: '' };
    const result = processImportData([newRec, dupRec, badRec], existingRecords, mockGenerateId);
    expect(result.newRecords.length).toBe(1);
    expect(result.duplicateRecords.length).toBe(1);
    expect(result.invalidRecords.length).toBe(1);
    expect(result.validRecords.length).toBe(2);
    expect(result.allErrors.length).toBeGreaterThan(0);
  });

  it('对记录字段做规范化（trim 和类型转换）', () => {
    const raw = {
      instrument: '  电吉他  ',
      piece: '  Blue Bossa  ',
      date: '2026-06-10',
      bpm: '90',
      minutes: '30',
      mistakes: '5',
      note: '  hello  '
    };
    const result = processImportData([raw], [], mockGenerateId);
    const rec = result.newRecords[0].record;
    expect(rec.instrument).toBe('电吉他');
    expect(rec.piece).toBe('Blue Bossa');
    expect(rec.date).toBe('2026-06-10');
    expect(typeof rec.bpm).toBe('number');
    expect(rec.bpm).toBe(90);
    expect(typeof rec.minutes).toBe('number');
    expect(rec.minutes).toBe(30);
    expect(typeof rec.mistakes).toBe('number');
    expect(rec.mistakes).toBe(5);
    expect(rec.note).toBe('hello');
    expect(rec.id).toBeTruthy();
  });

  it('为每条记录和 section 生成唯一 id', () => {
    const result = processImportData([validRecord], [], mockGenerateId);
    const rec = result.newRecords[0].record;
    expect(rec.id).toBe('test-id-1');
    expect(rec.sections).toHaveLength(1);
    expect(rec.sections[0].id).toBe('test-id-2');
  });

  it('保留并规范化 sections 字段', () => {
    const withSections = {
      ...validRecord,
      sections: [
        { name: '  前奏  ', bpm: '80', mistakes: '2', mastery: '3', note: '  note1  ' },
        { name: '副歌', bpm: 90, mistakes: 1, mastery: 5 }
      ]
    };
    const result = processImportData([withSections], [], mockGenerateId);
    const rec = result.newRecords[0].record;
    expect(rec.sections).toHaveLength(2);
    expect(rec.sections[0].name).toBe('前奏');
    expect(rec.sections[0].bpm).toBe(80);
    expect(rec.sections[0].mistakes).toBe(2);
    expect(rec.sections[0].mastery).toBe(3);
    expect(rec.sections[0].note).toBe('note1');
    expect(rec.sections[1].name).toBe('副歌');
    expect(rec.sections[1].mastery).toBe(5);
    expect(typeof rec.sections[0].id).toBe('string');
  });

  it('无 sections 时结果中不含 sections 字段', () => {
    const { sections, ...noSections } = validRecord;
    const result = processImportData([noSections], [], mockGenerateId);
    const rec = result.newRecords[0].record;
    expect('sections' in rec).toBe(false);
  });

  it('空 sections 数组时结果中不含 sections 字段', () => {
    const result = processImportData([{ ...validRecord, sections: [] }], [], mockGenerateId);
    const rec = result.newRecords[0].record;
    expect('sections' in rec).toBe(false);
  });

  it('没有 note 字段时默认为空字符串', () => {
    const { note, ...rest } = validRecord;
    const result = processImportData([rest], [], mockGenerateId);
    expect(result.newRecords[0].record.note).toBe('');
  });

  it('保留原始索引（index）', () => {
    const rec1 = { ...validRecord, piece: 'A' };
    const rec2 = { ...validRecord, piece: 'B' };
    const bad = { instrument: '' };
    const result = processImportData([rec1, bad, rec2], [], mockGenerateId);
    expect(result.newRecords[0].index).toBe(0);
    expect(result.newRecords[1].index).toBe(2);
    expect(result.invalidRecords[0].index).toBe(1);
  });
});
