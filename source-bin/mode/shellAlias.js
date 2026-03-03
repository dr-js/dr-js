import { existsSync } from 'node:fs'
import { hostname } from 'node:os'

import { describe } from 'source/common/format.js'
import { isBasicArray, isBasicFunction, isBasicObject, isString } from 'source/common/check.js'
import { getUTCDateTag } from 'source/common/time.js'
import { withFallbackResult } from 'source/common/error.js'
import { expandHome } from 'source/node/fs/Path.js'
import { readTextSync, readJSONSync } from 'source/node/fs/File.js'
import { verify as verifyDocker, verifyCompose } from 'source/node/module/Software/docker.js'
import { resolveCommand } from 'source/node/system/ResolveCommand.js'
import { runSync, runStdoutSync, runDetached } from 'source/node/run.js'

const doShellAlias = async ({
  aliasName,
  aliasArgList = [],
  log
}) => {
  if ([ 'h', 'help', 'l', 'list' ].includes(aliasName)) return log && log(Object.keys(SHELL_ALIAS_MAP).join('\n'))

  const runBase = (commandStringOrArgList, argList = []) => {
    let commandList = [
      ...(isString(commandStringOrArgList) ? commandStringOrArgList.split(' ') : commandStringOrArgList),
      ...argList
    ]
    log && log(` - run: ${commandList.join(' ')}`)
    if (process.platform === 'win32') {
      if (commandList[ 0 ] === 'sudo') commandList = commandList.slice(1) // drop sudo on win32 // TODO: also drop for Termux?
      commandList[ 0 ] = resolveCommand(commandList[ 0 ]) // resolve file for windows
    }
    runSync(commandList)
  }
  const runAlias = (alias, argList = [], name) => {
    if (isBasicFunction(alias)) {
      alias = alias(...argList)
      argList = [] // drop argList, only use output from alias-func
    }
    if (isBasicObject(alias)) {
      if (alias.A) runAliasName(alias.A, [ ...alias.$, ...argList ])
      else if (alias.AE) for (const subAliasName of alias.AE) runAliasName(subAliasName, []) // drop argList
      else if (alias.E) for (const subAlias of alias.E) runAlias(subAlias, [], name) // drop argList
      else throw new Error(`invalid alias object: ${describe(alias)} from aliasName: ${name}`)
      return
    }
    if (isString(alias) || isBasicArray(alias)) return runBase(alias, argList)
    throw new Error(`invalid alias: ${describe(alias)} from aliasName: ${name}`)
  }
  const runAliasName = (aliasName, argList = []) => {
    const alias = SHELL_ALIAS_MAP[ aliasName ]
    if (!alias) throw new Error(`invalid aliasName: ${aliasName}`)
    runAlias(alias, argList, aliasName)
  }

  runAliasName(aliasName, aliasArgList)
}

// @base: when single command run, append `argList` if any
//   [ "stringArg" ]: direct run without shell
//   "stringCommand with space": split by " " to get `[ stringArg ]`
// @extend:
//   { E: [ @base ] }: run each without shell
// @generated:
//   (...argList) => @base|@extend: generated command
//   { A: "stringAlias", $: [ ...argList ] }: run alias and append `$`
//   { AE: [ "stringAlias" ] }: run each alias
const _E = (...baseList) => ({ E: baseList })
const _A = (stringAlias, ...$List) => ({ A: stringAlias, $: $List })
const _AE = (...stringAliasList) => ({ AE: stringAliasList })

let __osRelease, __packageManager
const WHICH_LINUX = () => { // systemd linux: http://0pointer.de/blog/projects/os-release
  if (__packageManager === undefined) {
    if (process.platform === 'win32') __osRelease = 'win32'
    else if (process.platform === 'darwin') __osRelease = 'darwin'
    else if (process.platform === 'android' && (process.env.PREFIX || '').includes('com.termux')) __osRelease = 'Android (Termux)' // termux: https://www.reddit.com/r/termux/comments/co46qw/how_to_detect_in_a_bash_script_that_im_in_termux/ewi3fjj/
    else {
      const textOsRelease = withFallbackResult('', readTextSync, '/etc/os-release')
      __osRelease = [ 'Arch', 'Manjaro', 'Debian', 'Ubuntu', 'Raspbian' ].filter((v) => textOsRelease.includes(v)).pop() || 'unknown-os-release'
    }
    __packageManager = [ 'Arch', 'Manjaro' ].includes(__osRelease) ? 'pacman'
      : [ 'Debian', 'Ubuntu', 'Raspbian', 'Android (Termux)' ].includes(__osRelease) ? 'apt'
        : 'unknown-package-manager'
    __DEV__ && console.log('WHICH_LINUX', { __osRelease, __packageManager })
  }
  return [ __osRelease, __packageManager ]
}

const _RSS = (commandString) => String(runStdoutSync(commandString.split(' ').filter(Boolean))).trim()

const SHELL_ALIAS_MAP = {
  // picked from: https://github.com/dr-js/stash/blob/master/bash/bash-aliases-extend.sh

  // =============================
  // screen clear aliases, should be supported in xterm/VT100
  // https://apple.stackexchange.com/questions/31872/how-do-i-reset-the-scrollback-in-the-terminal-via-a-shell-command/318217#318217
  'CLS': 'printf \\e[2J\\e[3J\\e[H',

  // =============================
  // git aliases (G*)
  'git-fetch': 'git fetch',
  'git-fetch-all': 'git fetch --all --tags --prune --force',
  'git-git-combo': 'git fetch --prune', // # no `--prune-tags`
  'git-git-git-combo': _E('git fetch --prune', 'git gc --auto'),
  'git-git-git-git-combo': _E('git fetch --prune', 'git gc --prune=now'),
  'git-status': 'git status',
  'git-push': 'git push',
  'git-push-force': 'git push --force',
  'git-reset-hard': 'git reset --hard @{upstream}',
  'git-git-reset-head': _AE('git-git-combo', 'git-reset-hard'),
  'git-branch-list': 'git branch --all --list', // local and remote
  'git-branch-delete': 'git branch -D',
  'git-checkout-branch-remote': 'git checkout --track', // $1=remove-branch-name # create and switch to a local branch tracking the remote
  'git-cherry-pick-range': ($1, $2) => [ 'git', 'cherry-pick', `${$1}^..${$2}` ], // $1=commit-from, $2=commit-to # will include both from/to commit
  'git-cherry-pick-abort': 'git cherry-pick --abort',
  'git-cherry-pick-continue': 'git cherry-pick --continue',
  'git-clear': _E('git remote prune origin', 'git gc --prune=now'),
  'git-commit': 'git commit',
  'git-commit-amend': 'git commit --amend',
  'git-clone': 'git clone',
  'git-clone-minimal': 'git clone --depth 1 --no-tags --config remote.origin.fetch=+refs/heads/master:refs/remotes/origin/master',
  'git-tag-combo': ($1) => _E([ 'git', 'tag', '--force', $1 ], [ 'git', 'push', 'origin', $1 ]),
  'git-tag-clear-local': () => [ 'git', 'tag', '--delete', ..._RSS('git tag -l').split('\n') ],
  'git-tag-push-origin': 'git push origin', // append the tag name
  'git-tag-push-force-origin': 'git push --force origin', // append the tag name
  'git-tag-delete-origin': 'git push --delete origin', // append the tag name (or full name like `refs/tags/v0.4.2`)
  'git-ls-files-stage': 'git ls-files --stage',
  'git-update-644': 'git update-index --chmod=-x',
  'git-update-755': 'git update-index --chmod=+x',
  'git-log': 'git log',
  'git-log-16': _A('git-log', '-16'),
  'git-log-oneline': [ 'git', 'log', '--date=short', '--pretty=format:%C(auto,yellow)%h %C(auto,blue)%>(12,trunc)%ad %C(auto,green)%<(7,trunc)%aN%C(auto,reset)%s%C(auto,red)% gD% D' ],
  'git-log-oneline-16': _A('git-log-oneline', '-16'),
  'git-log-brief': [ 'git', 'log', '--pretty=format:- %s' ],
  'git-log-brief-16': _A('git-log-brief', '-16'),
  'git-log-graph': 'git log --graph --oneline',
  'git-log-graph-16': _A('git-log-graph', '-16'),

  'GF': _A('git-fetch'),
  'GFA': _A('git-fetch-all'),
  'GG': _A('git-git-combo'),
  'GGG': _A('git-git-git-combo'),
  'GGGG': _A('git-git-git-git-combo'),
  'GS': _A('git-status'),
  'GP': _A('git-push'),
  'GPF': _A('git-push-force'),
  'GRH': _A('git-reset-hard'),
  'GGRH': _A('git-git-reset-head'),
  'GBL': _A('git-branch-list'),
  'GBD': _A('git-branch-delete'),
  'GCBR': _A('git-checkout-branch-remote'),
  'GCPR': _A('git-cherry-pick-range'),
  'GCPA': _A('git-cherry-pick-abort'),
  'GCPC': _A('git-cherry-pick-continue'),
  'GC': _A('git-clear'),
  'GCM': _A('git-commit'),
  'GCMA': _A('git-commit-amend'),
  'GCLO': _A('git-clone'),
  'GCLOM': _A('git-clone-minimal'),
  'GTC': _A('git-tag-combo'),
  'GTCL': _A('git-tag-clear-local'),
  'GTPO': _A('git-tag-push-origin'),
  'GTPFO': _A('git-tag-push-force-origin'),
  'GTDO': _A('git-tag-delete-origin'),
  'GLS': _A('git-ls-files-stage'),
  'G644': _A('git-update-644'),
  'G755': _A('git-update-755'),
  'GL': _A('git-log'),
  'GL16': _A('git-log-16'),
  'GLO': _A('git-log-oneline'),
  'GLO16': _A('git-log-oneline-16'),
  'GLB': _A('git-log-brief'),
  'GLB16': _A('git-log-brief-16'),
  'GLG': _A('git-log-graph'),
  'GLG16': _A('git-log-graph-16'),

  // =============================
  // systemd aliases (SD*,SR*)
  'systemd-list': 'sudo systemctl list-unit-files --state=enabled,disabled,generated',
  'systemd-list-active': 'sudo systemctl list-units --type=service',
  'systemd-list-enabled': 'sudo systemctl list-unit-files --state=enabled,generated',
  'systemd-list-timers': 'sudo systemctl list-timers',
  'systemd-daemon-reload': 'sudo systemctl daemon-reload',
  'systemd-reset-failed': 'sudo systemctl reset-failed', // https://serverfault.com/questions/606520/how-to-remove-missing-systemd-units
  'systemd-start': 'sudo systemctl start',
  'systemd-stop': 'sudo systemctl stop',
  'systemd-status': 'sudo systemctl status',
  'systemd-enable': 'sudo systemctl enable',
  'systemd-disable': 'sudo systemctl disable',
  'systemd-restart': 'sudo systemctl restart',
  'systemd-reload': 'sudo systemctl reload',

  'SDL': _A('systemd-list'),
  'SDLA': _A('systemd-list-active'),
  'SDLE': _A('systemd-list-enabled'),
  'SDLT': _A('systemd-list-timers'),
  'SDDR': _A('systemd-daemon-reload'),
  'SDRF': _A('systemd-reset-failed'),
  'SDON': _A('systemd-start'),
  'SDOFF': _A('systemd-stop'),
  'SDS': _A('systemd-status'),
  'SDE': _A('systemd-enable'),
  'SDD': _A('systemd-disable'),
  'SDRS': _A('systemd-restart'),
  'SDRL': _A('systemd-reload'),

  'systemd-resolve-flush-caches': 'sudo systemd-resolve --flush-caches',
  'systemd-resolve-statistics': 'sudo systemd-resolve --statistics',
  'systemd-resolvectl-status': 'sudo resolvectl status',
  'systemd-journalctl-vacuum': _E('sudo journalctl --flush --rotate', 'sudo journalctl --vacuum-size=0.5G'),

  'SRFC': _A('systemd-resolve-flush-caches'),
  'SRS': _A('systemd-resolve-statistics'),
  'SRCS': _A('systemd-resolvectl-status'),
  'SJV': _A('systemd-journalctl-vacuum'),

  // =============================
  // npm aliases (N*)
  'npm-list-global': 'npm ls --global --depth=0',
  'npm-install': 'npm install --lockfile-version 3 --no-audit --no-fund --no-update-notifier',
  'npm-install-simple': 'npm install',
  'npm-install-global': 'sudo npm install --global',
  'npm-install-prefer-offline': 'npm install --prefer-offline --lockfile-version 3 --no-audit --no-fund --no-update-notifier',
  'npm-install-package-lock-only': 'npm install --package-lock-only --lockfile-version 3 --no-audit --no-fund --no-update-notifier',
  'npm-uninstall': 'npm uninstall',
  'npm-uninstall-global': 'sudo npm uninstall --global',
  'npm-outdated': 'npm outdated',
  'npm-audit': 'npm audit',
  'npm-audit-fix': 'npm audit fix',
  'npm-run': 'npm run',
  'npm-view': 'npm view',

  'NLSG': _A('npm-list-global'), // TODO: DEPRECATE: use `NLG`
  'NLG': _A('npm-list-global'),
  'NI': _A('npm-install'),
  'NIS': _A('npm-install-simple'),
  'NIG': _A('npm-install-global'),
  'NIO': _A('npm-install-prefer-offline'),
  'NIPLO': _A('npm-install-package-lock-only'),
  'NU': _A('npm-uninstall'),
  'NUG': _A('npm-uninstall-global'),
  'NO': _A('npm-outdated'),
  'NA': _A('npm-audit'),
  'NAF': _A('npm-audit-fix'),
  'NR': _A('npm-run'),
  'NV': _A('npm-view'),

  // =============================
  // docker & docker-compose aliases (DK, DC*,DI*,DV*,DS*, DD*)
  'DK': (...args) => [ ...verifyDocker(), ...args ],

  'docker-container-ls': _A('DK', 'container', 'ls'),
  'docker-container-ls-all': _A('docker-container-ls', '--all'),
  'docker-container-ls-minimal': _A('docker-container-ls', '--format=table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Image}}'),
  'docker-container-logs': _A('DK', 'container', 'logs'),
  'docker-container-logs-tail': _A('docker-container-logs', '--follow', '--tail=10'),
  'docker-container-top': _A('DK', 'container', 'top'),
  'docker-container-stats': _A('DK', 'container', 'stats', '--no-stream', '--no-trunc'),
  'docker-container-inspect': _A('DK', 'container', 'inspect'),
  'docker-container-run': _A('DK', 'container', 'run'),
  'docker-container-run-bash': _A('docker-container-run', '--interactive', '--tty', '--rm', '--entrypoint', '/bin/bash'),
  'docker-container-exec': _A('DK', 'container', 'exec'),
  'docker-container-exec-bash': ($1) => [ ...verifyDocker(), 'container', 'exec', '--interactive', '--tty', $1, '/bin/bash' ], //  $1=container name or id
  'docker-container-rm': _A('DK', 'container', 'rm'),
  'docker-container-prune': _A('DK', 'container', 'prune'),
  'docker-container-prune-force': _A('docker-container-prune', '--force'),
  'docker-container-stop': _A('DK', 'container', 'stop'),
  'docker-container-restart': _A('DK', 'container', 'restart'),

  'DCLS': _A('docker-container-ls'),
  'DCLA': _A('docker-container-ls-all'),
  'DCLM': _A('docker-container-ls-minimal'),
  'DCLOG': _A('docker-container-logs'),
  'DCLOGT': _A('docker-container-logs-tail'),
  'DCTOP': _A('docker-container-top'),
  'DCS': _A('docker-container-stats'),
  'DCI': _A('docker-container-inspect'),
  'DCR': _A('docker-container-run'),
  'DCRB': _A('docker-container-run-bash'),
  'DCE': _A('docker-container-exec'),
  'DCEB': _A('docker-container-exec-bash'),
  'DCRM': _A('docker-container-rm'),
  'DCP': _A('docker-container-prune'),
  'DCPF': _A('docker-container-prune-force'),
  'DCST': _A('docker-container-stop'),
  'DCRS': _A('docker-container-restart'),

  'docker-image-ls': _A('DK', 'image', 'ls'),
  'docker-image-ls-all': _A('docker-image-ls', '--all'),
  'docker-image-ls-tag': _A('docker-image-ls', '--format={{.Repository}}:{{.Tag}}'),
  'docker-image-history': _A('DK', 'image', 'history'),
  'docker-image-inspect': _A('DK', 'image', 'inspect'),
  'docker-image-rm': _A('DK', 'image', 'rm'),
  'docker-image-prune': _A('DK', 'image', 'prune'),
  'docker-image-prune-force': _A('docker-image-prune', '--force'),
  'docker-image-push': _A('DK', 'image', 'push'),
  'docker-image-pull': _A('DK', 'image', 'pull'),
  'docker-image-load': _A('DK', 'image', 'load'),
  'docker-image-save': _A('DK', 'image', 'save'),

  'DILS': _A('docker-image-ls'),
  'DILA': _A('docker-image-ls-all'),
  'DILT': _A('docker-image-ls-tag'),
  'DIH': _A('docker-image-history'),
  'DII': _A('docker-image-inspect'),
  'DIRM': _A('docker-image-rm'),
  'DIP': _A('docker-image-prune'),
  'DIPF': _A('docker-image-prune-force'),
  'DIPUSH': _A('docker-image-push'),
  'DIPULL': _A('docker-image-pull'),
  'DILOAD': _A('docker-image-load'),
  'DISAVE': _A('docker-image-save'),

  'docker-volume-ls': _A('DK', 'volume', 'ls'),
  'docker-volume-inspect': _A('DK', 'volume', 'inspect'),
  'docker-volume-rm': _A('DK', 'volume', 'rm'),
  'docker-volume-prune': _A('DK', 'volume', 'prune'),
  'docker-volume-prune-force': _A('DK', 'volume', 'prune', '--force'),

  'DVLS': _A('docker-volume-ls'),
  'DVI': _A('docker-volume-inspect'),
  'DVRM': _A('docker-volume-rm'),
  'DVP': _A('docker-volume-prune'),
  'DVPF': _A('docker-volume-prune-force'),

  'docker-system-df': _A('DK', 'system', 'df'),
  'docker-system-info': _A('DK', 'system', 'info'),
  'docker-system-prune': _A('DK', 'system', 'prune'),
  'docker-system-prune-force': _A('DK', 'system', 'prune', '--force'),

  'DSDF': _A('docker-system-df'),
  'DSI': _A('docker-system-info'),
  'DSP': _A('docker-system-prune'),
  'DSPF': _A('docker-system-prune-force'),

  'DD': (...args) => [ ...verifyCompose(), ...args ],

  'docker-compose-up': _A('DD', 'up', '--remove-orphans'),
  'docker-compose-up-detach': _A('DD', 'up', '--detach', '--remove-orphans'),
  'docker-compose-down': _A('DD', 'down', '--remove-orphans'),
  'docker-compose-ps': _A('DD', 'ps'),

  'DDU': _A('docker-compose-up'),
  'DDUD': _A('docker-compose-up-detach'),
  'DDD': _A('docker-compose-down'),
  'DDPS': _A('docker-compose-ps'),

  // =============================
  // screen aliases (S*)
  'screen-resume': 'screen -R',
  'screen-list': 'screen -ls',

  'SR': _A('screen-resume'),
  'SL': _A('screen-list'),

  // =============================
  // quick aliases (Q*)
  'quick-dd-random': ($1 = '100') => [ 'dd', 'bs=1048576', `count=${$1}`, 'if=/dev/urandom', `of=./RANDOM-${$1}MiB` ], // $1=size-in-MiB-default-to-100
  'quick-shutdown': 'sudo shutdown 0',
  'quick-reboot': 'sudo reboot',
  'quick-df': 'df -h',
  'quick-df-current': 'df -h .',
  'quick-du': 'sudo du -hd1',
  'quick-ssh-key-md5-list': [ 'ssh-keygen', '-E', 'md5', '-lf', expandHome('~/.ssh/authorized_keys') ],
  'quick-ssh-keygen': (
    $1 = `KEY_${getUTCDateTag()}_4096`, // TZ=UTC0 date +%Y%m%d
    $2 = `${$1}@${hostname() || 'unknown-host'}`
  ) => _E(
    [ 'ssh-keygen', '-t', 'rsa', '-b', '4096', '-N', '', '-f', `./${$1}.pri`, '-C', $2 ],
    [ 'mv', `./${$1}.pri.pub`, `./${$1}.pub` ]
  ),
  'quick-list-listen-socket': 'sudo ss -tulnp', // command from `iproute2`, use `sudo` to get full pid info
  'quick-system-watch': () => [ 'watch', '--no-title', existsSync('/sys/class/thermal/thermal_zone0')
    ? 'echo == cpufreq ==; cat /sys/devices/system/cpu/cpufreq/policy*/scaling_cur_freq; echo == thermal ==; cat /sys/class/thermal/thermal_zone*/temp;'
    : 'grep "cpu MHz" /proc/cpuinfo'
  ],
  'quick-run-background': (...args) => [ 'echo', `background [${runDetached(args).subProcess.pid}]: ${args.join(' ')}` ],
  'quick-drop-caches': _E(
    'sync',
    [ 'sudo', 'bash', '-c', 'echo 1 > /proc/sys/vm/drop_caches' ]
  ),
  'quick-sudo-bash': 'sudo bash',
  'quick-git-diff': 'git diff --no-index --', // $1=old $2=new
  'quick-git-tag-push': () => {
    const TAG = `v${readJSONSync('package.json').version}`
    return _E([ 'git', 'tag', TAG ], [ 'git', 'push', 'origin', TAG ])
  },
  'quick-git-tag-push-force': () => {
    const TAG = `v${readJSONSync('package.json').version}`
    return _E([ 'git', 'tag', '--force', TAG ], [ 'git', 'push', 'origin', '--force', TAG ])
  },
  'quick-git-push-combo': _AE('git-push', 'quick-git-tag-push'),
  'quick-git-push-combo-force': _AE('git-push-force', 'quick-git-tag-push-force'),
  'quick-nano-reset': ($1) => _E( // $1=file-to-reset-and-edit
    [ 'truncate', '--size=0', $1 ],
    [ 'nano', $1 ]
  ),
  'quick-docker-log-ls': [ 'sudo', 'bash', '-c', 'cd /var/lib/docker/containers/ && ls -alh ./*/*.log' ],
  'quick-docker-log-truncate': [ 'sudo', 'bash', '-c', 'cd /var/lib/docker/containers/ && truncate -s0 ./*/*.log' ],

  'QDDR': _A('quick-dd-random'),
  'QSHUTDOWN': _A('quick-shutdown'),
  'QREBOOT': _A('quick-reboot'),
  'QDF': _A('quick-df'),
  'QDFC': _A('quick-df-current'),
  'QDU': _A('quick-du'),
  'QSKML': _A('quick-ssh-key-md5-list'),
  'QSKG': _A('quick-ssh-keygen'),
  'QLLS': _A('quick-list-listen-socket'),
  'QSW': _A('quick-system-watch'),
  'QRBG': _A('quick-run-background'),
  'QDC': _A('quick-drop-caches'),
  'QSB': _A('quick-sudo-bash'),
  'QGD': _A('quick-git-diff'),
  'QGTP': _A('quick-git-tag-push'),
  'QGTPF': _A('quick-git-tag-push-force'),
  'QGPC': _A('quick-git-push-combo'),
  'QGPCF': _A('quick-git-push-combo-force'),
  'QNR': _A('quick-nano-reset'),
  'QDLL': _A('quick-docker-log-ls'),
  'QDLT': _A('quick-docker-log-truncate'),

  // =============================
  // @dr-js aliases (D*)
  'dr-js-npm-install-global-all': 'sudo npm i -g @dr-js/core @dr-js/dev',
  'dr-js-npm-install-global-all-dev': 'sudo npm i -g @dr-js/core@dev @dr-js/dev@dev',
  'dr-js-rm': 'dr-js --rm',
  'dr-js-package-reset': 'dr-js --rm package-lock.json node_modules/',
  'dr-js-package-reset-combo': _AE('dr-js-package-reset', 'npm-install'),
  'dr-js-package-reset-combo-combo': _AE('dr-js-package-reset', 'npm-install-prefer-offline'),

  'DNIGA': _A('dr-js-npm-install-global-all'),
  'DNIGAD': _A('dr-js-npm-install-global-all-dev'),
  'DRM': _A('dr-js-rm'),
  'DPR': _A('dr-js-package-reset'),
  'DPRC': _A('dr-js-package-reset-combo'),
  'DPRCC': _A('dr-js-package-reset-combo-combo'),

  // =============================
  // =============================
  // linux release dependent alias
  // =============================
  // =============================
  //
  // =============================
  // system aliases (S*)
  'system-witch': () => [ 'echo', ...WHICH_LINUX() ],
  'SW': _A('system-witch'),

  ...(WHICH_LINUX()[ 1 ] === 'pacman' && {
    'system-package-repo-edit': 'sudo nano /etc/pacman.d/mirrorlist',
    'system-package-list-all': 'sudo pacman -Q',
    'system-package-list': 'sudo pacman -Qe', // explicitly installed
    'system-package-update': _E(
      'sudo pacman -Sy --needed archlinux-keyring',
      'sudo pacman -Syu',
      () => {
        const orphanPackageList = withFallbackResult('', _RSS, 'pacman -Qtdq').split('\n').filter(Boolean)
        return orphanPackageList.length
          ? [ 'sudo', 'pacman', '-Rns', ...orphanPackageList ]
          : [ 'echo', 'nothing to clear' ]
      },
      'sudo pacman -Sc --noconfirm' // clear cache
    ),
    'system-package-remove': 'sudo pacman -R',
    'system-package-install': 'sudo pacman -S --needed',
    'system-package-provide-bin': ($1) => [ 'sudo', 'pacman', '-F', resolveCommand($1) ], // $1=bin-name-or-full-path // https://unix.stackexchange.com/questions/14858/in-arch-linux-how-can-i-find-out-which-package-to-install-that-will-contain-file
    'system-package-why': 'sudo pacman -Qi', // check the `Required By` row
    'system-reboot-required': () => {
      // hacky node version for: https://bbs.archlinux.org/viewtopic.php?id=173508
      // NOTE: for ArchLinuxARM `uname -r` will print extra `-ARCH`
      const installedVersion = _RSS('pacman -Q linux').split(' ').pop() // pick version from "linux 5.13.10.arch1-1", or "linux-rc 5.17.rc8-2"
      const runningVersion = _RSS('uname -r') // like "5.13.10.arch1-1", or "5.17.0-rc8-2-MANJARO-ARM-RC"
      const formatVersion = (v) => v.replace(/\W/g, '.').toLowerCase()
      return [ 'echo', formatVersion(runningVersion).startsWith(formatVersion(installedVersion)) ? 'nope' : `Reboot Required ("${runningVersion}" -> "${installedVersion}")` ]
    }
  }),

  ...(WHICH_LINUX()[ 1 ] === 'apt' && {
    'system-package-repo-edit': 'sudo nano /etc/apt/sources.list',
    'system-package-list-all': 'sudo apt list --installed',
    'system-package-list': 'sudo apt-mark showmanual',
    'system-package-update': _E('sudo apt update', 'sudo apt upgrade -y', 'sudo apt autoremove --purge -y'),
    'system-package-remove': 'sudo apt autoremove --purge',
    'system-package-install': 'sudo apt install',
    'system-package-provide-bin': ($1) => [ 'sudo', 'dpkg', '-S', resolveCommand($1) ], // $1=bin-name-or-full-path // https://serverfault.com/questions/30737/how-do-i-find-the-package-that-contains-a-given-program-on-ubuntu
    'system-package-why': 'sudo apt-cache rdepends --no-suggests --no-conflicts --no-breaks --no-replaces --no-enhances --installed --recurse', // https://askubuntu.com/questions/5636/can-i-see-why-a-package-is-installed#comment505140_5637
    'system-reboot-required': () => [ 'echo', existsSync('/var/run/reboot-required') ? 'Reboot Required (found "/var/run/reboot-required")' : 'nope' ]
  }),

  ...([ 'pacman', 'apt' ].includes(WHICH_LINUX()[ 1 ]) && {
    'SPRE': _A('system-package-repo-edit'),
    'SPLA': _A('system-package-list-all'),
    'SPL': _A('system-package-list'),
    'SPU': _A('system-package-update'),
    'SPR': _A('system-package-remove'),
    'SPI': _A('system-package-install'),
    'SPPB': _A('system-package-provide-bin'),
    'SPWHY': _A('system-package-why'),
    'SRR': _A('system-reboot-required')
  })
}

export {
  WHICH_LINUX, SHELL_ALIAS_MAP,
  doShellAlias
}
