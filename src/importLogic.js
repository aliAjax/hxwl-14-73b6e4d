export function validateSection(section, recordIndex, sectionIndex) {
  const errors = [];
  const requiredFields = ['name', 'bpm', 'mistakes', 'mastery'];
  const numberFields = ['bpm', 'mistakes', 'mastery'];

  if (typeof section !== 'object' || section === null || Array.isArray(section)) {
    return { valid: false, errors: [`第 ${recordIndex + 1} 条记录的第 ${sectionIndex + 1} 个片段不是有效的对象`] };
  }

  for (const field of requiredFields) {
    if (section[field] === undefined || section[field] === null || section[field] === '') {
      errors.push(`第 ${recordIndex + 1} 条记录的第 ${sectionIndex + 1} 个片段缺少必填字段: ${field}`);
    }
  }

  for (const field of numberFields) {
    if (section[field] !== undefined && section[field] !== null) {
      const num = Number(section[field]);
      if (isNaN(num)) {
        errors.push(`第 ${recordIndex + 1} 条记录的第 ${sectionIndex + 1} 个片段字段 ${field} 必须是数字`);
      } else if (field === 'bpm' && num < 1) {
        errors.push(`第 ${recordIndex + 1} 条记录的第 ${sectionIndex + 1} 个片段字段 ${field} 必须大于 0`);
      } else if (field === 'mistakes' && num < 0) {
        errors.push(`第 ${recordIndex + 1} 条记录的第 ${sectionIndex + 1} 个片段字段 ${field} 不能为负数`);
      } else if (field === 'mastery' && (num < 1 || num > 5)) {
        errors.push(`第 ${recordIndex + 1} 条记录的第 ${sectionIndex + 1} 个片段掌握程度必须在 1-5 之间`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateRecord(record, index) {
  const errors = [];
  const requiredFields = ['instrument', 'piece', 'date', 'bpm', 'minutes', 'mistakes'];
  const numberFields = ['bpm', 'minutes', 'mistakes'];

  if (typeof record !== 'object' || record === null || Array.isArray(record)) {
    return { valid: false, errors: [`第 ${index + 1} 条记录不是有效的对象`] };
  }

  for (const field of requiredFields) {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      errors.push(`缺少必填字段: ${field}`);
    }
  }

  for (const field of numberFields) {
    if (record[field] !== undefined && record[field] !== null) {
      const num = Number(record[field]);
      if (isNaN(num)) {
        errors.push(`字段 ${field} 必须是数字`);
      } else if (field === 'minutes' && num < 1) {
        errors.push(`字段 ${field} 必须大于 0`);
      } else if (field === 'mistakes' && num < 0) {
        errors.push(`字段 ${field} 不能为负数`);
      } else if (field === 'bpm' && num < 1) {
        errors.push(`字段 ${field} 必须大于 0`);
      }
    }
  }

  if (record.date && !/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
    errors.push('日期格式必须为 YYYY-MM-DD');
  }

  if (record.sections !== undefined && record.sections !== null) {
    if (!Array.isArray(record.sections)) {
      errors.push('sections 字段必须是数组');
    } else {
      record.sections.forEach((section, sectionIndex) => {
        const sectionValidation = validateSection(section, index, sectionIndex);
        if (!sectionValidation.valid) {
          errors.push(...sectionValidation.errors);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.map(e => `第 ${index + 1} 条: ${e}`)
  };
}

export function isDuplicate(record, existingRecords) {
  return existingRecords.some(r =>
    r.instrument === record.instrument &&
    r.piece === record.piece &&
    r.date === record.date &&
    r.bpm === Number(record.bpm) &&
    r.minutes === Number(record.minutes) &&
    r.mistakes === Number(record.mistakes)
  );
}

export function processImportData(parsedData, existingRecords = [], generateId = () => crypto.randomUUID()) {
  const result = {
    validRecords: [],
    newRecords: [],
    duplicateRecords: [],
    invalidRecords: [],
    allErrors: []
  };

  let importRecords = [];

  if (Array.isArray(parsedData)) {
    importRecords = parsedData;
  } else if (parsedData && Array.isArray(parsedData.records)) {
    importRecords = parsedData.records;
  } else {
    throw new Error('无法识别的文件格式，请确保文件包含 records 数组或本身就是记录数组');
  }

  if (importRecords.length === 0) {
    throw new Error('文件中没有找到任何练习记录');
  }

  importRecords.forEach((record, index) => {
    const validation = validateRecord(record, index);

    if (!validation.valid) {
      result.invalidRecords.push({ record, index });
      result.allErrors.push(...validation.errors);
      return;
    }

    const normalizedRecord = {
      id: generateId(),
      instrument: String(record.instrument).trim(),
      piece: String(record.piece).trim(),
      date: String(record.date).trim(),
      bpm: Number(record.bpm),
      minutes: Number(record.minutes),
      mistakes: Number(record.mistakes),
      note: record.note ? String(record.note).trim() : ''
    };

    if (record.sections && Array.isArray(record.sections) && record.sections.length > 0) {
      normalizedRecord.sections = record.sections.map(section => ({
        id: generateId(),
        name: String(section.name).trim(),
        bpm: Number(section.bpm),
        mistakes: Number(section.mistakes),
        mastery: Number(section.mastery),
        note: section.note ? String(section.note).trim() : ''
      }));
    }

    result.validRecords.push({ record: normalizedRecord, index });

    if (isDuplicate(normalizedRecord, existingRecords)) {
      result.duplicateRecords.push({ record: normalizedRecord, index });
    } else {
      result.newRecords.push({ record: normalizedRecord, index });
    }
  });

  return result;
}
