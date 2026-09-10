/**
 * 文本统计：字数只算「正文」，代码不算。
 *
 * 约定：``` 或 ~~~ 围栏代码块（语言标志任意——C / matlab / verilog / mermaid / cpp …）
 * 整块丢弃；行内 `代码` 也丢弃；没加围栏的普通正文才计入。
 * 没闭合的围栏按「到文末」处理，避免把后半篇正文当成代码。
 */
export function stripCode(md) {
  const out = []
  let fence = null // { ch, len }
  for (const line of String(md).split(/\r?\n/)) {
    const any = /^\s*(`{3,}|~{3,})(.*)$/.exec(line)
    const bare = /^\s*(`{3,}|~{3,})\s*$/.exec(line) // 只有围栏、没有语言标志 → 结束围栏
    if (fence) {
      // 与 marked 一致：结束围栏必须同种字符、不短于开围栏，且后面不能再跟语言标志
      if (bare && bare[1][0] === fence.ch && bare[1].length >= fence.len) fence = null
      continue // 代码块里的行（含结束围栏）全部丢掉
    }
    if (any) {
      fence = { ch: any[1][0], len: any[1].length }
      continue
    }
    out.push(line.replace(/`[^`\n]*`/g, ' '))
  }
  return out.join('\n')
}

/** 汉字字数（只数正文，不含代码） */
export function countChars(md) {
  return (stripCode(md).match(/[\u4e00-\u9fff]/g) || []).length
}
