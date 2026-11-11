---
id: count-permutation
title: 排列数
category: 计数
related: [count-perm-vs-comb, count-combination, count-comb-perm-relation, count-select-then-arrange, count-circular-perm]
prerequisites: [count-perm-vs-comb]
---

# 排列数

### 概念
从 $n$ 个不同的东西里，选出 $m$ 个排成一行。顺序不同，就算不同的排法。这样的排法有多少种，叫做排列数，符号写成 $A_{n}^{m}$。

要先分清这是排列还是组合。顺序有关，才用排列数。

### 方法
从 $n$ 开始倒着乘，连续乘 $m$ 个数：

$$A_{n}^{m}=n\times(n-1)\times\cdots\times(n-m+1)$$

第一个位置有 $n$ 种选法，第二个位置少 $1$ 种，一直乘到第 $m$ 个位置。

$m=n$ 时，就是把 $n$ 个全部排完：$A_{n}^{n}=n\times(n-1)\times\cdots\times 1$。

### 例题
$A_{5}^{3}=5\times 4\times 3=60$。
7 面不同的旗子里每次抽出 5 面横着排：$A_{7}^{5}=7\times 6\times 5\times 4\times 3=2520$。

### 易错
- $A_{5}^{4}=120$，$A_{5}^{5}$ 也是 $120$。得数碰巧一样，算式并不一样：一个乘了 4 个数，一个乘了 5 个数。
- 要连续乘 $m$ 个数。不要只乘开头的两个数就停。
