import { BadgeCheck, BookOpen, GraduationCap, Network, Route } from 'lucide-react';

type HeaderProps = {
  clusterCount: number;
  pointCount: number;
};

function Header({ clusterCount, pointCount }: HeaderProps) {
  return (
    <header className="hero-band app-header">
      <div className="hero-copy course-identity">
        <div className="eyebrow">
          <GraduationCap size={16} aria-hidden="true" />
          AI 原理学习工作台
        </div>
        <h1>人工智能原理知识森林</h1>
        <p>
          用知识地图串联课程结构，用右侧知识屏拆解概念、公式、图示和应用，让抽象机制沿着清晰路径逐步展开。
        </p>
        <div className="header-tags" aria-label="设计目标">
          <span>课程知识地图</span>
          <span>结构化知识屏</span>
          <span>机制动画演示</span>
        </div>
      </div>

      <div className="hero-metrics" aria-label="项目概览">
        <div className="metric">
          <Network size={22} aria-hidden="true" />
          <strong>{clusterCount}</strong>
          <span>个知识簇</span>
        </div>
        <div className="metric">
          <BookOpen size={22} aria-hidden="true" />
          <strong>{pointCount}</strong>
          <span>个知识点</span>
        </div>
        <div className="metric">
          <Route size={22} aria-hidden="true" />
          <strong>4</strong>
          <span>类动画示例</span>
        </div>
        <div className="metric status-metric">
          <BadgeCheck size={22} aria-hidden="true" />
          <strong>就绪</strong>
          <span>学习工作台</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
