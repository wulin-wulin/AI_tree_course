import { useMemo, useState, useTransition } from 'react';
import Header from './components/Header';
import KnowledgeForest from './components/KnowledgeForest';
import KnowledgeDetailPanel from './components/KnowledgeDetailPanel';
import { clusters, knowledgePoints } from './data/courseKnowledge';

function App() {
  const [selectedPointId, setSelectedPointId] = useState(knowledgePoints[0].id);
  const [activeClusterId, setActiveClusterId] = useState('all');
  const [isReading, setIsReading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 以「章节顺序 + 章节内顺序」拉直成一条连续的阅读序列，作为上一点/下一点推进的基准。
  const orderedPoints = useMemo(
    () => clusters.flatMap((cluster) => knowledgePoints.filter((point) => point.clusterId === cluster.id)),
    [],
  );

  const selectedPoint = useMemo(
    () => knowledgePoints.find((point) => point.id === selectedPointId) ?? knowledgePoints[0],
    [selectedPointId],
  );

  const selectedCluster = useMemo(
    () => clusters.find((cluster) => cluster.id === selectedPoint.clusterId) ?? clusters[0],
    [selectedPoint.clusterId],
  );

  const clusterPoints = useMemo(
    () => orderedPoints.filter((point) => point.clusterId === selectedPoint.clusterId),
    [orderedPoints, selectedPoint.clusterId],
  );

  const reading = useMemo(() => {
    const orderIndex = orderedPoints.findIndex((point) => point.id === selectedPoint.id);
    const prevPoint = orderIndex > 0 ? orderedPoints[orderIndex - 1] : null;
    const nextPoint = orderIndex < orderedPoints.length - 1 ? orderedPoints[orderIndex + 1] : null;
    const positionInCluster = clusterPoints.findIndex((point) => point.id === selectedPoint.id) + 1;
    return {
      prev: prevPoint ? { id: prevPoint.id, title: prevPoint.title } : null,
      next: nextPoint ? { id: nextPoint.id, title: nextPoint.title } : null,
      positionInCluster,
      clusterTotal: clusterPoints.length,
    };
  }, [orderedPoints, clusterPoints, selectedPoint.id]);

  const handlePointSelect = (id: string) => {
    startTransition(() => {
      setSelectedPointId(id);
    });
  };

  const handleClusterChange = (id: string) => {
    startTransition(() => {
      setActiveClusterId(id);
    });
  };

  const handleToggleReading = () => {
    setIsReading((value) => !value);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#learning-workspace">
        跳到课程学习区
      </a>
      <Header clusterCount={clusters.length} pointCount={knowledgePoints.length} />

      <main
        id="learning-workspace"
        className={`workspace ${isPending ? 'is-pending' : ''} ${isReading ? 'is-reading' : ''}`}
      >
        <section className="forest-region" aria-label="知识森林主视图区" hidden={isReading}>
          <KnowledgeForest
            clusters={clusters}
            points={knowledgePoints}
            selectedPointId={selectedPoint.id}
            activeClusterId={activeClusterId}
            onPointSelect={handlePointSelect}
            onClusterChange={handleClusterChange}
          />
        </section>

        <KnowledgeDetailPanel
          key={selectedPoint.id}
          point={selectedPoint}
          cluster={selectedCluster}
          prev={reading.prev}
          next={reading.next}
          positionInCluster={reading.positionInCluster}
          clusterTotal={reading.clusterTotal}
          isReading={isReading}
          onSelect={handlePointSelect}
          onToggleReading={handleToggleReading}
        />
      </main>
    </div>
  );
}

export default App;
