---
id: arith-sum-of-products
title: 连续整数乘积求和
category: 计算
related: [arith-sum-of-squares, arith-arithmetic-series, arith-diff-of-squares]
---
# 连续整数乘积求和 🔗

两个常见公式：

**① 相邻两数相乘再相加**

$$1\times2+2\times3+3\times4+\cdots+n(n+1)=\frac{n(n+1)(n+2)}{3}$$

因为 $k(k+1)=k^2+k$，所以左边 = 平方和 + 普通的和，再化简就得到右边。

**② 一头一尾配对相乘再相加**

$$1\times n+2\times(n-1)+\cdots+n\times1=\frac{n(n+1)(n+2)}{6}$$

每一项是 $k\times(n+1-k)$，展开后也是“普通的和”减去“平方和”。

### 例题
$1\times2+2\times3+\cdots+49\times50=49\times50\times51\div3=41650$。

$1\times99+2\times98+\cdots+99\times1=99\times100\times101\div6=166650$。

奇数连乘像 $1\times3+3\times5+\cdots+99\times101$，可以先写成平方差：$(2k-1)(2k+1)=(2k)^2-1$，再求和。

### 易错提醒
- 两个公式的分母不一样：相邻乘积是 $\div3$，一头一尾配对是 $\div6$，不要用混。
- 先数清 $n$ 是几：最后一项是 $49\times50$，就是 $n=49$。
