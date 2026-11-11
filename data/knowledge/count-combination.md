---
id: count-combination
title: 组合数
category: 计数
related: [count-perm-vs-comb, count-permutation, count-comb-perm-relation, count-select-then-arrange, count-group-dedup]
prerequisites: [count-perm-vs-comb]
---

# 组合数

### 概念
从 $n$ 个不同的东西里选出 $m$ 个成一组，组里面不分先后。这样的选法有多少种，叫做组合数，符号写成 $C_{n}^{m}$。

要先分清这是组合。只确定名单、种类，才用组合数。

### 方法
选出的 $m$ 个如果还要排成一行，会有 $A_{m}^{m}$ 种排法。组合不管这些排法，所以：

$$C_{n}^{m}=A_{n}^{m}\div A_{m}^{m}$$

### 例题
从 10 套热身动作里选 3 套，不分先后：

$$C_{10}^{3}=A_{10}^{3}\div A_{3}^{3}=(10\times 9\times 8)\div(3\times 2\times 1)=120$$

### 易错
- 除的是 $A_{m}^{m}$，也就是选出的那 $m$ 个自己怎么排。不要再除一遍 $A_{n}^{m}$，那样结果会变成 $1$。
- 还要排位置、分第几棒、谁先谁后时，先别用组合数。
