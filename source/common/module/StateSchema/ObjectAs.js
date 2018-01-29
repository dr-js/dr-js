import { createObjectSchema } from './ObjectSchema'
import { objectActMap } from './actMap'

const ObjectAs = (name, object, actMap = objectActMap) => createObjectSchema({ name, struct: object, actMap })

export { ObjectAs }
