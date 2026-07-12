import RichText from './RichText';

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
      <RichText text={formula} variant="formula" className="formula-block" />
    </section>
  );
}

export default FormulaBlock;
