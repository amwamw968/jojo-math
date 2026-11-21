import { MathText } from "../components/MathText";
import { Reveal } from "../components/Reveal";
import { useTitle } from "../components/Ui";

const STEM = `小明把一张长方形纸片沿直线剪开，再把得到的图形拼一拼。请把每一步写完整，横线上填得数。

计算：(1) $\\frac{1}{2}+\\frac{1}{3}+\\frac{1}{6}=$______；(2) $\\sqrt{144}-3^{2}+A_{12}^{4}=$______；(3) $1^{2}+2^{2}+3^{2}+\\cdots+30^{2}=\\dfrac{30\\times31\\times61}{6}=$______。

下面这行特别长，应留在题目区域内，不要把整页撑出屏幕：$2^{10}\\times2^{9}\\times2^{8}\\times2^{7}\\times2^{6}\\times2^{5}\\times2^{4}\\times2^{3}\\times2^{2}\\times2^{1}=$______。`;

const ANSWER = `(1) $1$。(2) $11883$。(3) $9455$。`;

const SOLUTION = `(1) 通分：$\\frac{3}{6}+\\frac{2}{6}+\\frac{1}{6}=1$。(2) $\\sqrt{144}=12$，$3^{2}=9$，$A_{12}^{4}=12\\times11\\times10\\times9=11880$，所以 $12-9+11880=11883$。(3) 平方和公式直接代入。

$$1^{2}+2^{2}+\\cdots+30^{2}=\\dfrac{30\\times31\\times61}{6}=9455$$

| 名称 | 式子 | 结果 |
| --- | --- | --- |
| 分数 | $\\frac{3}{6}$ | $1$ |
| 平方根 | $\\sqrt{144}$ | $12$ |
| 上下标 | $A_{12}^{4}$ | $11880$ |`;

export function ReadingCheck() {
  useTitle("排版样例");
  return (
    <div className="page narrow" data-page="reading">
      <header className="page-head">
        <h1>排版样例</h1>
        <p className="lede">这页是合成的阅读样例，用来检查中文、小问和公式怎么排。不是题库里的题，也没有学习记录。</p>
      </header>
      <article className="article">
        <section className="stem-block" aria-label="题干">
          <h2 className="sheet-label">题干</h2>
          <MathText flow="stem">{STEM}</MathText>
        </section>
        <figure className="figure">
          <svg viewBox="0 0 240 96" width="240" height="96" role="img" aria-label="样例：一条长 12、宽 8 的长方形">
            <rect x="8" y="16" width="180" height="64" fill="#fff7ed" stroke="#9a3412" strokeWidth="3" />
            <text x="98" y="54" textAnchor="middle" fontSize="16" fill="#0f172a">12 × 8</text>
          </svg>
          <figcaption>样例插图</figcaption>
        </figure>
        <Reveal kicker="答案" closedLabel="点一点，看答案" openLabel="收起答案" text={ANSWER} empty="还没有答案" />
        <Reveal kicker="解析" closedLabel="点一点，看解析" openLabel="收起解析" text={SOLUTION} empty="还没有解析" />
      </article>
    </div>
  );
}
