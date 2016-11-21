import * as Dr from 'source/Dr'
import * as Node from 'source/node'
Dr.Node = Node
Dr.global.Dr = Dr // add to global
module.exports = Dr // support node require
