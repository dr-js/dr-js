import { createArraySchema } from './ArraySchema'
import { arrayActMap } from './actMap'

const ArrayOf = (name, item, actMap = arrayActMap) => createArraySchema({ name, struct: [ item ], actMap })

export { ArrayOf } // TODO: DEPRECATED: move out since not that essential
