import { strictEqual } from 'source/common/verify.js'

import {
  stringifyNginxConf,

  COMBO_MIME,
  COMBO_COMPRESS
} from './Nginx.js'

const { describe, it, info = console.log } = global

const TEST_OBJECT = {
  'VALUE_SKIP': undefined, // HACK: only `undefined` will be dropped
  'user': 'www-data',
  'pid': '/run/nginx.pid',
  'worker_processes': 'auto',
  'events': {
    'VALUE_SKIP': undefined,
    'worker_connections': 10240 // allow number
  },

  'upstream A': { // HACK: merge key with first value to prevent JSON key dup
    'server': [ 'unix:/tmp/sockets/A.socket', 'fail_timeout=0' ]
  },
  'upstream B': {
    'server#main': '127.0.0.1:8', // HACK: use `#` in key to prevent JSON key dup
    'server#backup': [ 'unix:/tmp/sockets/A.socket', 'fail_timeout=0', 'backup' ]
  },

  'server# main-server and some more !@#$%^&*': { // HACK: use `#` in key to prevent JSON key dup
    'listen': '127.0.0.1:88',
    'server_name': [ 'a.bb', '*.a.bb' ],
    'root': '/root/public',
    'gzip_disable': '"msie6"',
    '#0': '# some comment', // HACK: use `#` to add comment
    '#1': '# some more comment', // HACK: use `#` to add comment
    'gzip_types': [
      'text/css',
      'application/javascript',
      'application/json',
      'image/svg+xml',
      'application/x-font-ttf'
    ],
    'location /PIC.png': {
      'proxy_pass': 'http://127.0.0.1:888/PIC$is_args$args',
      'proxy_set_header X-Forwarded-For': '$proxy_add_x_forwarded_for',
      '#0': 'internal', // HACK: use `#` for keyword
      'break': '' // HACK: use empty value for keyword
    },
    'location = /': {
      'rewrite /': [ '/some', 'last' ]
    },
    'location ~ ^/(A|B|C|D|E)': {
      'proxy_set_header Host': '$http_host', // HACK: merge key with first value to prevent JSON key dup
      'proxy_set_header Referer': '$http_referer',
      'proxy_set_header X-Real-IP': '$remote_addr',
      'proxy_set_header Accept-Encoding': '$http_accept_encoding',
      'proxy_pass': 'http://127.0.0.1:8888'
    }
  },

  'server#sub': {
    'listen': '127.0.0.1:80',
    'log_format LF_BASIC': [
      '\'$remote_addr - $remote_user [$time_local] "$request" \'',
      '\'$status $body_bytes_sent "$http_referer" \'',
      '\'"$http_user_agent" "$http_x_forwarded_for"\''
    ],
    'access_log': [ '/dev/stdout', 'LF_BASIC' ]
  }
}

const TEST_OUTPUT = `
user                    www-data;
pid                     /run/nginx.pid;
worker_processes        auto;
events {
  worker_connections    10240;
}
upstream A {
  server                unix:/tmp/sockets/A.socket
                        fail_timeout=0;
}
upstream B {
  server                127.0.0.1:8;
  server                unix:/tmp/sockets/A.socket
                        fail_timeout=0
                        backup;
}
server {
  listen                127.0.0.1:88;
  server_name           a.bb
                        *.a.bb;
  root                  /root/public;
  gzip_disable          "msie6";
  # some comment;
  # some more comment;
  gzip_types            text/css
                        application/javascript
                        application/json
                        image/svg+xml
                        application/x-font-ttf;
  location /PIC.png {
    proxy_pass          http://127.0.0.1:888/PIC$is_args$args;
    proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;
    internal;
    break;
  }
  location = / {
    rewrite /           /some           last;
  }
  location ~ ^/(A|B|C|D|E) {
    proxy_set_header Host       $http_host;
    proxy_set_header Referer    $http_referer;
    proxy_set_header X-Real-IP  $remote_addr;
    proxy_set_header Accept-Encoding    $http_accept_encoding;
    proxy_pass          http://127.0.0.1:8888;
  }
}
server {
  listen                127.0.0.1:80;
  log_format LF_BASIC   '$remote_addr - $remote_user [$time_local] "$request" '
                        '$status $body_bytes_sent "$http_referer" '
                        '"$http_user_agent" "$http_x_forwarded_for"';
  access_log            /dev/stdout
                        LF_BASIC;
}
`.trim()

describe('Node.Config.Nginx', () => {
  it('stringifyNginxConf()', () => {
    __DEV__ && info(stringifyNginxConf(TEST_OBJECT))

    strictEqual(stringifyNginxConf(TEST_OBJECT), TEST_OUTPUT)
  })
  it('stringifyNginxConf() + COMBO', () => {
    __DEV__ && info(stringifyNginxConf({
      ...COMBO_COMPRESS,
      ...COMBO_MIME
    }))

    stringifyNginxConf({
      ...COMBO_COMPRESS,
      ...COMBO_MIME
    })
  })
})
