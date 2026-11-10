---
id: arith-sum-of-cubes
title: 立方和公式
category: 计算
related: [arith-arithmetic-series, arith-sum-of-squares, arith-diff-of-squares]
---
# 立方和公式 🧊

从 1 的立方加到 $n$ 的立方，结果刚好等于“从 1 加到 $n$”的平方：

$$1^3+2^3+3^3+\cdots+n^3=\left(1+2+\cdots+n\right)^2=\left(\frac{n(n+1)}{2}\right)^2$$

**为什么？** 令 $S_k=1+2+\cdots+k=\dfrac{k(k+1)}{2}$。用平方差可以证明每一块立方都等于前后两个“三角形数”的平方差：

$$k^3=S_k^2-S_{k-1}^2$$

于是 $1^3+2^3+\cdots+n^3$ 会像多米诺一样消掉中间项，只留下 $S_n^2$。

### 例题
$1^3+2^3+\cdots+19^3=(1+2+\cdots+19)^2=190^2=36100$。

只要偶数的立方： $2^3+4^3+\cdots+(2m)^3=8\times(1^3+\cdots+m^3)=8\times\left(\dfrac{m(m+1)}{2}\right)^2$。

### 易错提醒
- 立方和是“先求和再平方”，不是先平方再求和（那是平方和，公式不一样）。
- 不从 1 开始，或只要奇数立方时，用“全部减去偶数”的办法。
