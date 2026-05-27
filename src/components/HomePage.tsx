import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Trees } from 'lucide-react';

type CourseEntry = {
  id: string;
  title: string;
  note: string;
  to?: string;
};

const courses: CourseEntry[] = [
  { id: 'ai', title: '人工智能原理', note: '从搜索、学习到智能体与生成式 AI', to: '/ai' },
  { id: 'discrete-math', title: '离散数学', note: '敬请期待' },
  { id: 'compiler', title: '编译原理', note: '敬请期待' },
  { id: 'rl-math', title: '强化学习的数学原理', note: '敬请期待' },
];

function HomePage() {
  return (
    <main id="main-content" className="page home-page" aria-label="知识森林学习笔记首页">
      <div className="home-inner">
        <p className="home-eyebrow">
          <Trees size={16} aria-hidden="true" />
          知识森林
        </p>
        <h1 className="home-title">知识森林学习笔记</h1>
        <p className="home-sub">每一门课都是一片森林。挑一片走进去，沿着小径，把每个知识点逐页翻开。</p>

        <ul className="course-shelf" aria-label="课程列表">
          {courses.map((course) =>
            course.to ? (
              <li key={course.id}>
                <Link className="course-card is-open" to={course.to}>
                  <span className="course-title">{course.title}</span>
                  <span className="course-note">{course.note}</span>
                  <span className="course-enter">
                    走进森林
                    <ArrowRight size={15} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ) : (
              <li key={course.id}>
                <div className="course-card is-locked" aria-disabled="true">
                  <span className="course-title">{course.title}</span>
                  <span className="course-note">
                    <Lock size={13} aria-hidden="true" />
                    {course.note}
                  </span>
                </div>
              </li>
            ),
          )}
        </ul>
      </div>
    </main>
  );
}

export default HomePage;
