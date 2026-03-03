import { writeTextSync } from 'source/node/fs/File.js'

const getLicenseMIT = (author) => `MIT License

Copyright (c) ${new Date().getUTCFullYear()} ${author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`

const GET_LICENSE_MAP = {
  // TODO: add more?
  MIT: getLicenseMIT
}

const writeLicenseFile = (path, licenseType, licenseAuthor) => {
  if (!licenseType) return // allow skip by passing falsy license type
  if (!licenseAuthor) throw new Error(`invalid License author "${licenseAuthor}"`)
  const getLicense = GET_LICENSE_MAP[ licenseType.toUpperCase() ]
  if (!getLicense) throw new Error(`License type "${licenseType}" is not yet supported`)
  writeTextSync(path, getLicense(licenseAuthor))
}

export { writeLicenseFile }
