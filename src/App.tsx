import { useMemo, useState, useTransition } from 'react';
import Header from './components/Header';
import KnowledgeForest from './components/KnowledgeForest';
import KnowledgeDetailPanel from './components/KnowledgeDetailPanel';
import { clusters, knowledgePoints } from './data/courseKnowledge';

function App() {
  const [selectedPointId, setSelectedPointId] = useState(knowledgePoints[0].id);
  const [activeClusterId, setActiveClusterId] = useState('all');
  const [isPending, startTransition] = useTransition();

  const selectedPoint = useMemo(
    () => knowledgePoints.find((point) => point.id === selectedPointId) ?? knowledgePoints[0],
    [selectedPointId],
  );

  const selectedCluster = useMemo(
    () => clusters.find((cluster) => cluster.id === selectedPoint.clusterId) ?? clusters[0],
    [selectedPoint.clusterId],
  );

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

  return (
    <div className="app-shell">
      <a className="skip-link" href="#learning-workspace">
        跳到课程学习区
      </a>
      <Header clusterCount={clusters.length} pointCount={knowledgePoints.length} />

      <main id="learning-workspace" className={`workspace ${isPending ? 'is-pending' : ''}`}>
        <section className="forest-region" aria-label="知识森林主视图区">
          <KnowledgeForest
            clusters={clusters}
            points={knowledgePoints}
            selectedPointId={selectedPoint.id}
            activeClusterId={activeClusterId}
            onPointSelect={handlePointSelect}
            onClusterChange={handleClusterChange}
          />
        </section>

        <KnowledgeDetailPanel key={selectedPoint.id} point={selectedPoint} cluster={selectedCluster} />
      </main>
    </div>
  );
}

export default App;
