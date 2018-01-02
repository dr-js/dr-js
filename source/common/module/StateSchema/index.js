import { createObjectSchema } from './ObjectSchema'
import { createArraySchema } from './ArraySchema'
import { objectActMap, arrayActMap } from './actMap'

const ObjectAs = (name, object, actMap = objectActMap) => createObjectSchema({ name, struct: object, actMap })
const ArrayOf = (name, item, actMap = arrayActMap) => createArraySchema({ name, struct: [ item ], actMap })

export { createObjectSchema, createArraySchema, ObjectAs, ArrayOf }
