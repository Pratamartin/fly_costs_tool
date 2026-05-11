import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'
import utc from 'dayjs/plugin/utc.js'
import 'dayjs/locale/pt-br.js'

dayjs.extend(utc)
dayjs.extend(localizedFormat)
dayjs.locale('pt-br')

export { dayjs }
