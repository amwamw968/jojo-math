---
id: count-select-then-arrange
title: 先选再排
category: 计数
related: [count-comb-perm-relation, count-permutation, count-combination, count-circular-perm, count-group-dedup]
prerequisites: [count-permutation, count-combination]
---

# 先选再排

### 概念
有的问题要分两步：先选出是哪些（不分先后），再把选出的这几个排到不同的位置上。两步都要发生，就把两步的种数乘起来。

这一步要用到排列数，也要用到组合数。

### 方法
从 $n$ 个里选 $m$ 个，再把这 $m$ 个排完：

$$C_{n}^{m}\times A_{m}^{m}=A_{n}^{m}$$

所以也可以直接算排列数。两种算法要对得上。

### 例题
12 名选手里选出 4 人，再分给 4 位老师，每人跟一名：

先选再排是 $C_{12}^{4}\times A_{4}^{4}=495\times 24=11880$。
直接排列是 $A_{12}^{4}=12\times 11\times 10\times 9=11880$。

### 易错
- 只选名单是一步。还要分配职位、分早餐和午餐，才再乘上排列。
- 不要两步都用组合，也不要第一步就按位置排、第二步又排一次。
