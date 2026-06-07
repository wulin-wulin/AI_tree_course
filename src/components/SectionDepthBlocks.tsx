import { ArrowRight } from 'lucide-react';
import { findPoint } from '../data/courseNav';
import type {
  ComparisonTable,
  ComplexityInfo,
  KnowledgePoint,
  Pitfall,
  QuizItem,
  WorkedExample,
} from '../data/courseKnowledge';

// R013 知识点加厚内容块。
// 视觉契合约束：所有配色只用本章 accent（--detail-accent / --detail-soft 经 color-mix 派生），
// 折叠复用 .reading-aside，胶囊复用 .term-cloud 语汇，引述卡沿用 .reading-lead/.reading-coda 质感。
// 误区块的 ✗/✓ 用红绿“对错语义色”，与现有难度标签思路一致。

// A 通俗直觉 / 类比 —— 常驻引述卡，承接核心思想。
export function IntuitionBlock({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <section className="reading-intuition" aria-label="通俗直觉">
      <span className="reading-block-kicker">通俗直觉</span>
      <p>{text}</p>
    </section>
  );
}

// 算法步骤 / 伪代码 —— 常驻代码块。
export function PseudocodeBlock({ lines }: { lines?: string[] }) {
  if (!lines?.length) return null;
  return (
    <section className="reading-pseudocode" aria-label="算法步骤">
      <span className="reading-block-kicker">算法步骤</span>
      <ol className="pseudocode-body">
        {lines.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ol>
    </section>
  );
}

// C 例题 / 分步推导 —— 常驻，支持一节多例。
export function WorkedExampleBlock({ examples }: { examples?: WorkedExample[] }) {
  if (!examples?.length) return null;
  const multiple = examples.length > 1;
  return (
    <section className="reading-example" aria-label="例题与分步推导">
      <span className="reading-block-kicker">动手算一算</span>
      {examples.map((example, exampleIndex) => (
        <div className="reading-example-item" key={exampleIndex}>
          {multiple ? <p className="reading-example-no">例 {exampleIndex + 1}</p> : null}
          <p className="reading-example-setup">{example.setup}</p>
          <ol className="reading-example-steps">
            {example.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
          {example.takeaway ? <p className="reading-example-takeaway">{example.takeaway}</p> : null}
        </div>
      ))}
    </section>
  );
}

// 复杂度分析 —— 常驻表。
export function ComplexityBlock({ complexity }: { complexity?: ComplexityInfo }) {
  if (!complexity) return null;
  return (
    <section className="reading-complexity" aria-label="复杂度分析">
      <span className="reading-block-kicker">复杂度分析</span>
      <table className="reading-kv-table">
        <tbody>
          <tr>
            <th scope="row">时间复杂度</th>
            <td>{complexity.time}</td>
          </tr>
          <tr>
            <th scope="row">空间复杂度</th>
            <td>{complexity.space}</td>
          </tr>
          {complexity.note ? (
            <tr>
              <th scope="row">备注</th>
              <td>{complexity.note}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}

// 算法 / 概念对比 —— 常驻表。
export function ComparisonBlock({ table }: { table?: ComparisonTable }) {
  if (!table?.rows.length) return null;
  return (
    <section className="reading-comparison" aria-label="对比">
      <span className="reading-block-kicker">{table.caption ?? '横向对比'}</span>
      <div className="reading-table-scroll">
        <table className="reading-compare-table">
          <thead>
            <tr>
              {table.headers.map((header, index) => (
                <th key={index} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// 常见误区 —— 常驻，✗ 错误认知 / ✓ 纠正。
export function PitfallsBlock({ items }: { items?: Pitfall[] }) {
  if (!items?.length) return null;
  return (
    <section className="reading-pitfalls" aria-label="常见误区">
      <span className="reading-block-kicker">常见误区</span>
      <ul className="pitfall-list">
        {items.map((item, index) => (
          <li key={index}>
            <p className="pitfall-wrong">
              <span className="pitfall-mark wrong" aria-hidden="true">
                ✗
              </span>
              {item.wrong}
            </p>
            <p className="pitfall-right">
              <span className="pitfall-mark right" aria-hidden="true">
                ✓
              </span>
              {item.right}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// B 展开讲讲 —— 默认折叠，复用 .reading-aside 折叠样式。
export function DeepDiveBlock({ paragraphs }: { paragraphs?: string[] }) {
  if (!paragraphs?.length) return null;
  return (
    <details className="reading-aside reading-deepdive">
      <summary>
        想深入 <span className="aside-count">{paragraphs.length}</span>
      </summary>
      <div className="reading-deepdive-body">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </details>
  );
}

// E 自测题 —— 常驻，每题答案点击展开（复用原生 details）。
export function QuizBlock({ items }: { items?: QuizItem[] }) {
  if (!items?.length) return null;
  return (
    <section className="reading-quiz" aria-label="自测题">
      <span className="reading-block-kicker">随手测一测</span>
      <ol className="reading-quiz-list">
        {items.map((item, index) => (
          <li key={index}>
            <p className="reading-quiz-q">{item.q}</p>
            <details className="reading-quiz-a">
              <summary>看答案</summary>
              <p>{item.a}</p>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}

// F 知识点关联 —— 常驻细条，复用术语云胶囊，本节高亮、前后点可跳转。
export function RelatedPointsBlock({
  point,
  onSelect,
}: {
  point: KnowledgePoint;
  onSelect: (id: string) => void;
}) {
  const related = (point.relatedPoints ?? [])
    .map((id) => findPoint(id))
    .filter((item): item is KnowledgePoint => Boolean(item) && item!.id !== point.id);

  if (!related.length) return null;

  return (
    <section className="reading-related" aria-label="知识点关联">
      <span className="reading-block-kicker">顺着往下学</span>
      <div className="reading-related-chips">
        <span className="related-chip is-current">{point.title}</span>
        {related.map((item) => (
          <button
            key={item.id}
            type="button"
            className="related-chip"
            onClick={() => onSelect(item.id)}
            title={`前往：${item.title}`}
          >
            <ArrowRight size={13} aria-hidden="true" />
            <span>{item.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
