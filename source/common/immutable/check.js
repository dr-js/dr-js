const isObjectShallowEqual = (value, target) => {
  if (value === target) return true
  const valueKeyList = Object.keys(value)
  const targetKeyList = Object.keys(target)
  if (valueKeyList.length !== targetKeyList.length) return false
  for (let index = 0, indexMax = valueKeyList.length; index < indexMax; index++) {
    const valueKey = valueKeyList[ index ]
    const targetKey = targetKeyList[ index ]
    if (!target.hasOwnProperty(valueKey) || value[ valueKey ] !== target[ targetKey ]) return false
  }
  return true
}

const isArrayShallowEqual = (value, target) => value === target || (
  value.length === target.length &&
  value.every((v, i) => v === target[ i ])
)

// only good for full array (no holes) like arguments
const isCompactArrayShallowEqual = (value, target) => {
  if (value === target) return true
  if (value.length !== target.length) return false
  for (let index = 0, indexMax = value.length; index < indexMax; index++) {
    if (value[ index ] !== target[ index ]) return false
  }
  return true
}

export {
  isObjectShallowEqual,
  isArrayShallowEqual,
  isCompactArrayShallowEqual
}
