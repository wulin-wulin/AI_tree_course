import { Boxes, Clapperboard, Compass, Layers3, Palette, ShieldCheck } from 'lucide-react';

const skills = [
  {
    title: 'Course Planning Skill',
    text: '输入课程名称，输出主题簇、章节结构和核心知识点清单。',
    Icon: Compass,
  },
  {
    title: 'Knowledge Content Skill',
    text: '为每个知识点生成核心思想、原理、公式、应用和思政元素。',
    Icon: Layers3,
  },
  {
    title: 'Visual Design Skill',
    text: '判断知识点适合的图示类型，并规划图文知识屏布局。',
    Icon: Palette,
  },
  {
    title: 'Animation Planning Skill',
    text: '筛选适合动态展示的机制，产出动画目标和步骤。',
    Icon: Clapperboard,
  },
  {
    title: 'Demo Integration Skill',
    text: '把课程数据、图示、动画和前端组件整合为可运行 demo。',
    Icon: Boxes,
  },
  {
    title: 'Quality Review Skill',
    text: '检查内容完整性、展示一致性、可运行性和汇报风险。',
    Icon: ShieldCheck,
  },
];

function SkillStrip() {
  return (
    <section className="skill-band" aria-label="后续 skill 抽象方向">
      <div className="skill-heading">
        <span className="section-kicker">可复用生成流程</span>
        <h2>后续迁移到其他课程的 skill 抽象</h2>
      </div>

      <div className="skill-grid">
        {skills.map(({ title, text, Icon }) => (
          <article className="skill-item" key={title}>
            <Icon size={18} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default SkillStrip;
