// 代码高亮：按需注册常用语言，控制打包体积
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import python from 'highlight.js/lib/languages/python'
import markdown from 'highlight.js/lib/languages/markdown'
import yaml from 'highlight.js/lib/languages/yaml'
import plaintext from 'highlight.js/lib/languages/plaintext'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import matlab from 'highlight.js/lib/languages/matlab'
import r from 'highlight.js/lib/languages/r'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml) // 也覆盖 html
hljs.registerLanguage('css', css)
hljs.registerLanguage('python', python)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('plaintext', plaintext) // 纯文本块（```text / 无语言）不做着色
hljs.registerLanguage('c', c) // 单片机/嵌入式语料主力
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('matlab', matlab)
hljs.registerLanguage('r', r)
hljs.registerAliases(['sh', 'shell', 'console'], { languageName: 'bash' })
hljs.registerAliases(['html', 'htm'], { languageName: 'xml' })
hljs.registerAliases(['js', 'jsx', 'mjs', 'cjs'], { languageName: 'javascript' })
hljs.registerAliases(['ts', 'tsx'], { languageName: 'typescript' })
hljs.registerAliases(['md'], { languageName: 'markdown' })
hljs.registerAliases(['yml'], { languageName: 'yaml' })
hljs.registerAliases(['text', 'txt', 'plain'], { languageName: 'plaintext' })
hljs.registerAliases(['c++', 'cc', 'h', 'hpp'], { languageName: 'cpp' })

/**
 * 高亮单个代码块；未注册的语言原样保留。
 * hljs.highlightElement 遇到未知语言只在控制台告警、并不抛错，所以这里事先判掉。
 */
export function highlightCodeBlock(el) {
  const cls = [...el.classList].find((c) => c.startsWith('language-'))
  const lang = cls ? cls.slice('language-'.length).toLowerCase() : ''
  if (lang && !hljs.getLanguage(lang)) return
  hljs.highlightElement(el)
}

export default hljs
