import * as Dr from 'source/Dr'
import * as Browser from 'source/browser'
Dr.Browser = Browser
Dr.global.Dr = Dr // add to global(window)
module.exports = Dr // support node require
