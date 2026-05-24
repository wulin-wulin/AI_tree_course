import { useMemo, useState } from 'react';
import Header from './components/Header';
import KnowledgeForest from './components/KnowledgeForest';
import KnowledgeDetailPanel from './components/KnowledgeDetailPanel';
import SkillStrip from './components/SkillStrip';
import { clusters, knowledgePoints } from './data/courseKnowledge';

function App() {
  const [selectedPointId, setSelectedPointId] = useState(knowledgePoints[0].id);
  const [activeClusterId, setActiveClusterId] = useState('all');

  const selectedPoint = useMemo(
    () => knowledgePoints.find((point) => point.id === selectedPointId) ?? knowledgePoints[0],
    [selectedPointId],
  );

  const selectedCluster = useMemo(
    () => clusters.find((cluster) => cluster.id === selectedPoint.clusterId) ?? clusters[0],
    [selectedPoint.clusterId],
  );

  return (
    <div className="app-shell">
      <Header clusterCount={clusters.length} pointCount={knowledgePoints.length} />

      <main className="workspace">
        <section className="forest-region" aria-label="知识森林主视图区">
          <KnowledgeForest
            clusters={clusters}
            points={knowledgePoints}
            selectedPointId={selectedPoint.id}
            activeClusterId={activeClusterId}
            onPointSelect={setSelectedPointId}
            onClusterChange={setActiveClusterId}
          />
        </section>

        <KnowledgeDetailPanel point={selectedPoint} cluster={selectedCluster} />
      </main>

      <SkillStrip />
    </div>
  );
}

export default App;
