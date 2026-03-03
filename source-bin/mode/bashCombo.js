import { existPathSync, expandHome } from 'source/node/fs/Path.js'
import { writeTextSync } from 'source/node/fs/File.js'
import { modifyCopySync } from 'source/node/fs/Modify.js'

import { WHICH_LINUX, SHELL_ALIAS_MAP } from './shellAlias.js'
import { resolveCommandName } from 'source/node/system/ResolveCommand.js'
import { isBasicObject, isString } from 'source/common/check.js'

const getBashrc = () => `# ~/.bashrc: executed by bash(1) for non-login shells. edited from ubuntu1804 "/etc/skel/.bashrc"

# If not running interactively, don't do anything
[[ -z "$PS1" ]] && return

# don't put duplicate lines in the history. See bash(1) for more options ... or force ignoredups and ignorespace
HISTCONTROL=ignoredups:ignorespace

# append to the history file, don't overwrite it
shopt -s histappend

# check the window size after each command and, if necessary, update the values of LINES and COLUMNS.
[[ $DISPLAY ]] && shopt -s checkwinsize

# make less more friendly for non-text input files, see lesspipe(1)
[[ -x /usr/bin/lesspipe ]] && eval "$(SHELL=/bin/sh lesspipe)"

PS1='\\u@\\h:\\w\\$ '

# enable color support of ls and also add handy aliases
if [[ -x /usr/bin/dircolors ]]; then
  test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
  alias ls='ls --color=auto'
  alias grep='grep --color=auto'
fi

# enable programmable completion features (you don't need to enable this, if it's already enabled in /etc/bash.bashrc and /etc/profile).
## [[ -f /etc/bash_completion ]] && ! shopt -oq posix && . /etc/bash_completion

# Alias definitions.
[[ -f ~/.bash_aliases ]] && . ~/.bash_aliases
[[ -f ~/.bash_aliases_extend ]] && . ~/.bash_aliases_extend # try load optional alias extend
`

const getBashAliasExtend = () => `# setup with below alias command "bash-aliases-extend-update"

# =============================
# mark version
alias bash-aliases-extend-version='dr-dev --version'
alias bash-aliases-extend-update='dr-dev --reset-bash-combo'

alias BAEV=bash-aliases-extend-version
alias BAEU=bash-aliases-extend-update

# =============================
# ls aliases (l*)
alias llh='ls -ahlF'
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'

# =============================
# screen clear aliases, should be supported in xterm/VT100 # https://apple.stackexchange.com/questions/31872/how-do-i-reset-the-scrollback-in-the-terminal-via-a-shell-command/318217#318217
alias CLS='printf "\\e[2J\\e[3J\\e[H"'
# =============================
# cd aliases (c*)
alias cb='cd ../'
alias cbb='cd ../../'
alias cbbb='cd ../../../'
alias cbbbb='cd ../../../../'
alias cbbbbb='cd ../../../../../'
function ccd { mkdir -p "$1"; cd "$1"; } # $1=path to create and cd to

# =============================
# common path alias (C*)
__PATH_GIT_ROOT_LIST="Git/ GitHub/ git/ github/ Documents/Git/ Documents/GitHub/ Documents/git/ Documents/github/" # list to search
__PATH_GIT_ROOT=""
for path in \${__PATH_GIT_ROOT_LIST}; do
  [[ -d "\${HOME}/\${path}" ]] && __PATH_GIT_ROOT="\${HOME}/\${path}"
done

alias cd-git='cd "\${__PATH_GIT_ROOT}"'
alias cd-log='cd /var/log/'
alias cd-docker='cd /var/lib/docker/'
alias cd-systemd='cd /lib/systemd/system/'
alias cd-systemd-network='cd /etc/systemd/network/'
alias cd-ssh='cd /etc/ssh/'
alias cd-apt='cd /etc/apt/'
alias cd-pacman='cd /etc/pacman.d/'
alias cd-nginx='cd /etc/nginx/'

alias CG=cd-git
alias CL=cd-log
alias CDK=cd-docker
alias CSD=cd-systemd
alias CSDN=cd-systemd-network
alias CSSH=cd-ssh
alias CAPT=cd-apt
alias CPCM=cd-pacman
alias CN=cd-nginx

# =============================
# proxy alias (PX*)
__IS_WSL2="$([[ -d "/run/WSL" ]] && echo "1" || echo "")" # https://github.com/microsoft/WSL/issues/4555#issuecomment-647561393
__PROXY_HTTP="http://127.0.0.1:1080"
__PROXY_HTTPS="http://127.0.0.1:1080" # most proxy support both
__PROXY_SOCKS5="$([[ "$__IS_WSL2" == "1" ]] && echo "socks5://127.0.0.1:1080" || echo "socks5://127.0.0.1:1081")" # win10 SS support socks5+http in single port

alias proxy-on='export \\
  http_proxy="\${__PROXY_HTTP}" \\
  https_proxy="\${__PROXY_HTTPS}" \\
  HTTP_PROXY="\${__PROXY_HTTP}" \\
  HTTPS_PROXY="\${__PROXY_HTTPS}" \\
'
alias proxy-off='unset \\
  http_proxy \\
  https_proxy \\
  HTTP_PROXY \\
  HTTPS_PROXY \\
'
alias proxy-once=' \\
  http_proxy="\${__PROXY_HTTP}" \\
  https_proxy="\${__PROXY_HTTPS}" \\
  HTTP_PROXY="\${__PROXY_HTTP}" \\
  HTTPS_PROXY="\${__PROXY_HTTPS}" \\
'

alias PXON=proxy-on
alias PXOFF=proxy-off
alias PX1=proxy-once

${[ 'win32', 'Android (Termux)' ].includes(WHICH_LINUX()[ 0 ]) && !resolveCommandName('sudo') ? `
# =============================
# Already "sudo" for most of the command, do nothing, just patch the command for other script to work
# Remove this if the Android is rooted and use the patched su/sudo instead
alias sudo='SU=1'
` : ''}

# =============================
# export to sub process env (test with "env" or "node -p process.env")
export __IS_WSL2
export __PROXY_HTTP
export __PROXY_HTTPS
export __PROXY_SOCKS5

# =============================
# alias redirect to "dr-dev"
${
  Object.entries(SHELL_ALIAS_MAP)
    .map(([ k, v ]) => {
      if (isString(v) && /^[\w-. ]*$/.test(v)) return `alias ${k}='${v}'` // reuse simple shell alias
      if (isBasicObject(v) && isString(v.A) && v.$.length === 0) return `alias ${k}=${v.A}` // unpack simple _A
      return `alias ${k}='dr-dev --shell-alias ${k} --'`
    })
    .join('\n')
}
`

const resetBashCombo = () => {
  const PATH_BASHRC = expandHome('~/.bashrc')
  existPathSync(PATH_BASHRC) && modifyCopySync(PATH_BASHRC, PATH_BASHRC + '.prev')
  writeTextSync(PATH_BASHRC, getBashrc())

  const PATH_BASH_ALIAS_EXTEND = expandHome('~/.bash_aliases_extend')
  existPathSync(PATH_BASH_ALIAS_EXTEND) && modifyCopySync(PATH_BASH_ALIAS_EXTEND, PATH_BASH_ALIAS_EXTEND + '.prev')
  writeTextSync(PATH_BASH_ALIAS_EXTEND, getBashAliasExtend())
}

export {
  resetBashCombo
}
