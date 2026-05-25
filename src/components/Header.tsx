import { BadgeCheck, BookOpen, GraduationCap, Network, Route, Sparkles } from 'lucide-react';

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
          AI Principles Learning Studio
        </div>
        <h1>人工智能原理知识森林</h1>
        <p>
          面向课堂汇报与课程自学的知识展示工作台：用学习路径组织课程结构，用图文知识屏解释关键概念，用轻量动画呈现抽象机制。
        </p>
        <div className="header-tags" aria-label="设计目标">
          <span>课程知识地图</span>
          <span>结构化知识屏</span>
          <span>可迁移 skill 流程</span>
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
          <strong>Demo</strong>
          <span>静态可运行</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
