const WINDOWS_1252_BYTES = new Map([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
])

const GARBLED_HINT_RE = /[ÃÂ�]|[åæçèéä]|[€œŒšŠžŽŸ™‰‹›]/
const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null

export function fixMojibake(value) {
  if (typeof value !== 'string' || !value || !GARBLED_HINT_RE.test(value) || !decoder) {
    return value
  }

  const bytes = toWindows1252Bytes(value)
  if (!bytes) {
    return value
  }

  const repaired = decoder.decode(bytes)
  if (!repaired || repaired === value) {
    return value
  }

  const originalScore = scoreText(value)
  const repairedScore = scoreText(repaired)
  if (
    repairedScore.cjk > originalScore.cjk &&
    repairedScore.garbled <= originalScore.garbled
  ) {
    return repaired
  }
  return value
}

export function normalizeTextData(value, seen = new WeakMap()) {
  if (typeof value === 'string') {
    return fixMojibake(value)
  }
  if (!value || typeof value !== 'object') {
    return value
  }
  if (value instanceof Blob || value instanceof ArrayBuffer || value instanceof Date) {
    return value
  }
  if (seen.has(value)) {
    return seen.get(value)
  }
  if (Array.isArray(value)) {
    const result = []
    seen.set(value, result)
    value.forEach((item, index) => {
      result[index] = normalizeTextData(item, seen)
    })
    return result
  }

  const result = {}
  seen.set(value, result)
  Object.entries(value).forEach(([key, item]) => {
    result[key] = normalizeTextData(item, seen)
  })
  return result
}

function toWindows1252Bytes(value) {
  const bytes = []
  for (const char of value) {
    const code = char.charCodeAt(0)
    if (code <= 0xff) {
      bytes.push(code)
    } else if (WINDOWS_1252_BYTES.has(code)) {
      bytes.push(WINDOWS_1252_BYTES.get(code))
    } else {
      return null
    }
  }
  return new Uint8Array(bytes)
}

function scoreText(value) {
  return {
    cjk: countCjk(value),
    garbled: (value.match(GARBLED_HINT_RE) || []).length,
  }
}

function countCjk(value) {
  let count = 0
  for (const char of value) {
    const code = char.charCodeAt(0)
    if (code >= 0x4e00 && code <= 0x9fff) {
      count += 1
    }
  }
  return count
}
