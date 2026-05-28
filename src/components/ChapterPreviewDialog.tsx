import { useEffect, useId, useRef, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import type { KnowledgeCluster, KnowledgePoint } from '../data/courseKnowledge';

type ChapterPreviewDialogProps = {
  chapter: KnowledgeCluster;
  chapterIndex: number; // 1-based
  points: KnowledgePoint[];
  onClose: () => void;
  onSelectPoint: (pointId: string) => void;
};

function ChapterPreviewDialog({
  chapter,
  chapterIndex,
  points,
  onClose,
  onSelectPoint,
}: ChapterPreviewDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    // 打开时把焦点移入方框首个可聚焦元素
    const target = dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')
      ?? dialogRef.current?.querySelector<HTMLElement>('button');
    target?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'Tab' && dialogRef.current) {
        // Focus trap：Tab 在方框内循环
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute('disabled'));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      // 点击方框内 → 忽略；点击另一棵树 → 让树自己的 onClick 切换章节；
      // 点击其它任何位置（含 scrim、地图空白）→ 关闭。
      if (target.closest('.chapter-preview') || target.closest('.forest-tree')) return;
      onClose();
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocMouseDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocMouseDown);
    };
  }, [onClose]);

  // 知识点环绕中央章节卡，沿椭圆均匀分布；数量在 4–10 之间时都不挤不裁。
  const n = points.length;
  const RX = 36; // % of dialog width
  const RY = 34; // % of dialog height
  const positions = points.map((_, i) => {
    const theta = -Math.PI / 2 + (i / n) * 2 * Math.PI;
    return {
      xPct: 50 + RX * Math.cos(theta),
      yPct: 50 + RY * Math.sin(theta),
    };
  });

  const firstPointId = points[0]?.id;

  return (
    <div className="chapter-preview-shell">
      <div className="chapter-preview-scrim" aria-hidden="true" />
      <div
        ref={dialogRef}
        className="chapter-preview"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={
          {
            '--chapter-accent': chapter.accent,
            '--chapter-soft': chapter.soft,
            '--chapter-dark': chapter.dark,
          } as CSSProperties
        }
      >
        <button
          type="button"
          className="chapter-preview-close"
          onClick={onClose}
          aria-label="关闭本章预览"
        >
          <X size={16} aria-hidden="true" />
        </button>

        {/* 虚线连接层：从中心辐射到每个知识点小卡 */}
        <svg className="chapter-lines" aria-hidden="true" preserveAspectRatio="none">
          {positions.map((p, i) => (
            <line key={i} x1="50%" y1="50%" x2={`${p.xPct}%`} y2={`${p.yPct}%`} />
          ))}
        </svg>

        {/* 中央：章节卡（点击 = 从本章首点开始读） */}
        <button
          type="button"
          className="chapter-preview-core"
          data-autofocus
          onClick={() => firstPointId && onSelectPoint(firstPointId)}
          aria-label={`从「${chapter.title}」第一个知识点开始读`}
          disabled={!firstPointId}
        >
          <span className="core-eyebrow">第 {chapterIndex} 章</span>
          <span className="core-title" id={titleId}>
            {chapter.title}
          </span>
          <span className="core-subtitle">{chapter.subtitle}</span>
          <span className="core-cta">从头读起 →</span>
        </button>

        {/* 四周：本章知识点小卡，环绕排布 */}
        {points.map((point, i) => {
          const p = positions[i];
          return (
            <button
              key={point.id}
              type="button"
              className="chapter-preview-point"
              style={{ left: `${p.xPct}%`, top: `${p.yPct}%` } as CSSProperties}
              onClick={() => onSelectPoint(point.id)}
              aria-label={`${point.title}，${point.difficulty}，进入阅读`}
            >
              <span className="ppt-index" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="ppt-title">{point.title}</span>
              <span className={`ppt-diff difficulty-${point.difficulty}`}>{point.difficulty}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ChapterPreviewDialog;
