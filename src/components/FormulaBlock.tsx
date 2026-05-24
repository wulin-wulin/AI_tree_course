type FormulaBlockProps = {
  formula?: string;
};

function FormulaBlock({ formula }: FormulaBlockProps) {
  if (!formula) {
    return null;
  }

  return (
    <section className="detail-section">
      <h3>关键公式</h3>
      <div className="formula-block">{formula}</div>
    </section>
  );
}

export default FormulaBlock;
