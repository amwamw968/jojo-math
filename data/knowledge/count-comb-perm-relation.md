---
id: count-comb-perm-relation
title: 组合数和排列数的关系
category: 计数
related: [count-permutation, count-combination, count-select-then-arrange]
prerequisites: [count-permutation, count-combination]
---

# 组合数和排列数的关系

### 概念
同一批东西，先算排成一行的种数，再去掉组里面的顺序，就得到组合数：

$$C_{n}^{m}=A_{n}^{m}\div A_{m}^{m}$$

选出 $m$ 个，和把其余 $n-m$ 个留下来，是同一份名单：

$$C_{n}^{m}=C_{n}^{n-m}$$

一个都不选，或者全部都选，都只有 $1$ 种：$C_{n}^{0}=1$，$C_{n}^{n}=1$。

### 方法
上面的数很大时，先换成较小的那个再算。例如 $C_{10}^{8}=C_{10}^{2}$，$C_{6}^{5}=C_{6}^{1}$，$C_{100}^{100}=C_{100}^{0}=1$。

### 例题
$C_{6}^{1}=6$，留下 5 个的选法 $C_{6}^{5}$ 也是 $6$。
$C_{10}^{8}=C_{10}^{2}=(10\times 9)\div(2\times 1)=45$。

### 易错
- $C_{n}^{m}=C_{n}^{n-m}$ 是「选 $m$ 个」和「剩下 $n-m$ 个」一样多，不是把上下标对调成 $C_{m}^{n}$。
- 换成小数以后还是要按组合数算完，不能换成 $C_{10}^{2}$ 以后又当成排列数。
