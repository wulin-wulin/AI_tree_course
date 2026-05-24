import { BadgeCheck, BookOpen, Sparkles, Trees } from 'lucide-react';

type HeaderProps = {
  clusterCount: number;
  pointCount: number;
};

function Header({ clusterCount, pointCount }: HeaderProps) {
  return (
    <header className="hero-band">
      <div className="hero-copy">
        <div className="eyebrow">
          <Sparkles size={16} aria-hidden="true" />
          AI Principles Knowledge Forest
        </div>
        <h1>人工智能原理知识森林</h1>
        <p>
          由大模型规划课程知识点，通过森林式结构、图文知识屏和轻量动画展示《人工智能原理》的核心知识脉络。
        </p>
      </div>

      <div className="hero-metrics" aria-label="项目概览">
        <div className="metric">
          <Trees size={22} aria-hidden="true" />
          <strong>{clusterCount}</strong>
          <span>个知识簇</span>
        </div>
        <div className="metric">
          <BookOpen size={22} aria-hidden="true" />
          <strong>{pointCount}</strong>
          <span>个知识点</span>
        </div>
        <div className="metric">
          <BadgeCheck size={22} aria-hidden="true" />
          <strong>4</strong>
          <span>类动画示例</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
