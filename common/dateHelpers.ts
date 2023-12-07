import moment from 'moment'

const DATE_TIME_FORMAT_SPEC = 'YYYY-MM-DDTHH:mm:ss'
const DATE_ONLY_FORMAT_SPEC = 'YYYY-MM-DD'
const DAY_MONTH_YEAR = 'DD/MM/YYYY'
const MOMENT_DAY_OF_THE_WEEK = 'dddd'
const MOMENT_TIME = 'HH:mm'

const DayOfTheWeek = dateTime => moment(dateTime, DATE_TIME_FORMAT_SPEC).format(MOMENT_DAY_OF_THE_WEEK)
const DayMonthYear = dateTime => moment(dateTime, DATE_TIME_FORMAT_SPEC).format(DAY_MONTH_YEAR)
const Time = dateTime => moment(dateTime, DATE_TIME_FORMAT_SPEC).format(MOMENT_TIME)

const buildDateTime = ({ date, hours, minutes, dateFormat = DAY_MONTH_YEAR }) => {
  const time =
    date &&
    Number.isSafeInteger(Number.parseInt(hours, 10)) &&
    Number.isSafeInteger(Number.parseInt(minutes, 10)) &&
    moment(date, dateFormat)
  return time ? time.hour(Number(hours)).minutes(Number(minutes)) : ''
}

const formatDate = value => {
  if (moment.isMoment(value)) {
    return value.format(DATE_TIME_FORMAT_SPEC)
  }
  return undefined
}

const isoDateTimeStartOfDay = (date, originalFormat) =>
  moment(date, originalFormat).startOf('day').format('YYYY-MM-DDTHH:mm:ss')
const isoDateTimeEndOfDay = (date, originalFormat) =>
  moment(date, originalFormat).endOf('day').format('YYYY-MM-DDTHH:mm:ss')

export {
  DATE_TIME_FORMAT_SPEC,
  DATE_ONLY_FORMAT_SPEC,
  DAY_MONTH_YEAR,
  MOMENT_DAY_OF_THE_WEEK,
  MOMENT_TIME,
  DayOfTheWeek,
  DayMonthYear,
  Time,
  buildDateTime,
  formatDate,
  isoDateTimeStartOfDay,
  isoDateTimeEndOfDay,
}
