import { isInteger } from 'source/common/check.js'
import { oneOf } from 'source/common/verify.js'

// no negative value, all UTC for @tag, sample:
//   @18h30m some message to notify at today or tomorrow's 18:30
//   @1W1h1m1s some message to notify at this or next monday's 18:30 (1 for Monday, 7 for Sunday)
//   @1M1D1h1m1s some message to notify at this or next year's 01/01 18:30
//   +18h30m some message to notify at 18 hour, 30 minute from now
//   +18.5h some message to notify at 18 hour, 30 minute from now (not allowed in @tag)
//   +1W1D1h1m1s some message to notify at 7+1 day, 1 hour, 1 minute, 1 second from now
//   +1Y1M1D1h1m1s some message to notify at 365+30+1 day, 1 hour, 1 minute, 1 second from now
//
//   # quick time format
//   02m03s = 2m3s
//   +123s = +2m3s (not allowed in @tag)
//   + 1 2 3 s = +2m3s (all space will be ignored)

const TYPE_AT_NEXT = '@'
const TYPE_FROM_NOW = '+'

const SLOT_MAP = { // NOTE: the limit is only for @tag, no limit for +tag
  year: 7, // [1, 9999]
  month: 6, // [1, 12]
  week: 5, // [1, 7] Monday to Sunday
  day: 4, // [1, 31]
  hour: 3, // [0, 23]
  minute: 2, // [0, 59]
  second: 1 // [0, 59]
}

const parseTimerTag = (tag = '') => {
  const string = tag.replace(/\s/g, '')
  const type = string.charAt(0)
  oneOf(type, [ TYPE_AT_NEXT, TYPE_FROM_NOW ])
  const result = REGEXP_TIMER_TAG.exec(string.slice(1))
  if (!result) throw new Error(`invalid format: "${tag}" ${string.slice(1)}`)
  const [ , year, month, week, day, hour, minute, second ] = result
  const tagData = {
    type, tag,
    year: toNumber(year), month: toNumber(month), week: toNumber(week), day: toNumber(day),
    hour: toNumber(hour), minute: toNumber(minute), second: toNumber(second),
    maxSlot: '',
    sumSecond: undefined
  }
  tagData.maxSlot = Object.keys(SLOT_MAP).find((slotName) => tagData[ slotName ] !== undefined) || ''
  if (!tagData.maxSlot) throw new Error(`empty @tag: ${tagData.tag}`)
  if (tagData.type === TYPE_AT_NEXT) verifyAtNext(tagData)
  else verifyFromNow(tagData)
  return tagData
}

const packTimerTag = (tagData) => [
  tagData.type,
  tagData.year !== undefined && `${tagData.year}Y`,
  tagData.month !== undefined && `${tagData.month}M`,
  tagData.week !== undefined && `${tagData.week}W`,
  tagData.day !== undefined && `${tagData.day}D`,
  tagData.hour !== undefined && `${tagData.hour}h`,
  tagData.minute !== undefined && `${tagData.minute}m`,
  tagData.second !== undefined && `${tagData.second}s`
].filter(Boolean).join('')

const calcDate = (tagData, refDate = new Date()) => {
  const date = new Date(refDate)
  if (tagData.type === TYPE_AT_NEXT) {
    // first direct apply @tag and check if the result date is usable
    if (tagData.week) { // [1, 7] Mon-Sun
      const utcDay = refDate.getUTCDay() // [0, 6] Sun-Sat
      const offset = (7 + tagData.week - utcDay) % 7 // days needed to be at "week"
      date.setUTCDate(refDate.getUTCDate() + offset)
    } else {
      tagData.year && date.setUTCFullYear(tagData.year)
      tagData.month && date.setUTCMonth(tagData.month - 1) // QUIRK: `setUTCMonth` use [0, 11] for month
      tagData.day && date.setUTCDate(tagData.day)
    }
    tagData.hour !== undefined && date.setUTCHours(tagData.hour)
    tagData.minute !== undefined && date.setUTCMinutes(tagData.minute)
    tagData.second !== undefined && date.setUTCSeconds(tagData.second)
    if (date <= refDate) { // the date is reached, bump the highest set value to next date
      if (tagData.maxSlot === 'week') date.setUTCDate(date.getUTCDate() + 7)
      // else if (tagData.maxSlot === 'year') {} // nothing to do, a expired date
      else if (tagData.maxSlot === 'month') date.setUTCFullYear(date.getUTCFullYear() + 1)
      else if (tagData.maxSlot === 'day') date.setUTCMonth(date.getUTCMonth() + 1)
      else if (tagData.maxSlot === 'hour') date.setUTCDate(date.getUTCDate() + 1)
      else if (tagData.maxSlot === 'minute') date.setUTCHours(date.getUTCHours() + 1)
      else if (tagData.maxSlot === 'second') date.setUTCMinutes(date.getUTCMinutes() + 1)
      else throw new Error(`failed to calc next date for: ${tagData.tag}`)
    }
  } else { // just bump sumSecond
    date.setUTCSeconds(date.getUTCSeconds() + tagData.sumSecond)
  }
  return date
}

const REGEXP_TIMER_TAG = /^(?:([\d.]+)Y)?(?:([\d.]+)M)?(?:([\d.]+)W)?(?:([\d.]+)D)?(?:([\d.]+)h)?(?:([\d.]+)m)?(?:([\d.]+)s)?$/
const toNumber = (value) => (value === undefined || value === '')
  ? undefined
  : Number(value)

const verifyAtNext = (tagData) => {
  if (!(
    checkAtRange(tagData.year, 1, 9999) &&
    checkAtRange(tagData.month, 1, 12) &&
    checkAtRange(tagData.week, 1, 7) &&
    checkAtRange(tagData.day, 1, 31) &&
    checkAtRange(tagData.hour, 0, 23) &&
    checkAtRange(tagData.minute, 0, 59) &&
    checkAtRange(tagData.second, 0, 59)
  )) throw new Error(`invalid "@" value range for: ${tagData.tag}`)
  const isYMD = tagData.year || tagData.month || tagData.day
  if (tagData.week && isYMD) throw new Error(`"week" conflict with "year/month/day": ${tagData.tag}`)
  // value cannot be empty (not allow "1Y1D")
  if (tagData.month === undefined && SLOT_MAP[ tagData.maxSlot ] > SLOT_MAP.month) throw new Error(`"month" expected: ${tagData.tag}`)
  if (tagData.day === undefined && SLOT_MAP[ tagData.maxSlot ] >= SLOT_MAP.month) throw new Error(`"day" expected: ${tagData.tag}`)
  // value default to 0 ("5m" -> "5m0s")
  if (tagData.hour === undefined && SLOT_MAP[ tagData.maxSlot ] > SLOT_MAP.hour) tagData.hour = 0
  if (tagData.minute === undefined && SLOT_MAP[ tagData.maxSlot ] > SLOT_MAP.minute) tagData.minute = 0
  if (tagData.second === undefined && SLOT_MAP[ tagData.maxSlot ] > SLOT_MAP.second) tagData.second = 0
}
const checkAtRange = (number, from, to) => (number === undefined) || (isInteger(number) && number >= from && number <= to)

const verifyFromNow = (tagData) => {
  const sumDay = withScale(tagData.year, 365) +
    withScale(tagData.month, 30) +
    withScale(tagData.week, 7) +
    withScale(tagData.day, 1)
  tagData.sumSecond = sumDay * 24 * 60 * 60 +
    withScale(tagData.hour, 60 * 60) +
    withScale(tagData.minute, 60) +
    withScale(tagData.second, 1)
}
const withScale = (number, scale = 1) => !number ? 0 : number * scale

export {
  parseTimerTag, packTimerTag,
  calcDate
}
