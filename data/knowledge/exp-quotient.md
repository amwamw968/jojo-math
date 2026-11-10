---
id: exp-quotient
title: 同底数幂相除
category: 计算
related: [exp-product, exp-zero, exp-same-base]
---
# 同底数幂相除 ➗

底数相同的幂相除，**底数不变，指数相减**（用被除数的指数减去除数的指数）：

$$a^m\div a^n=a^{m-n}\quad（a\neq0）$$

**为什么？** $m$ 个 $a$ 相乘，再除掉 $n$ 个 $a$，还剩 $m-n$ 个 $a$ 相乘。

连除就连减： $a^m\div a^n\div a^p=a^{m-n-p}$。

### 例题
$5^6\div5^2=5^{6-2}=5^4$。

拆开看：$(5\times5\times5\times5\times5\times5)\div(5\times5)$，约掉 2 个 5，剩下 4 个 5。

### 易错提醒
- 指数相减时，不要减反了：$11^{20}\div11^{11}=11^{9}$，不是 $11^{11-20}$。
- 中间如果夹着乘法，要按从左到右算，或先把同底数的指数加减合并。
