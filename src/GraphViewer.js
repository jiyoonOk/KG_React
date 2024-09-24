import React from 'react';
import { Graph } from 'react-d3-graph';

function GraphViewer({ nodes, links }) {
  // 노드 배열에서 중복을 제거하고, 각 노드에 'id' 속성 추가
  const uniqueNodesMap = {};
  nodes.forEach(node => {
    uniqueNodesMap[node.name] = { id: node.name, ...node };
  });
  const uniqueNodes = Object.values(uniqueNodesMap);

  // 링크는 'source'와 'target' 속성을 가지고 있어야 함
  const graphLinks = links.map(link => ({
    source: link.source,
    target: link.target,
  }));

  // react-d3-graph가 요구하는 데이터 형식
  const data = {
    nodes: uniqueNodes,
    links: graphLinks,
  };

  // 그래프의 설정 정의
  const myConfig = {
    nodeHighlightBehavior: true,
    node: {
      color: 'lightgreen',
      size: 200,
      highlightStrokeColor: 'blue',
      labelProperty: 'name', // 노드의 레이블로 표시할 속성
    },
    link: {
      highlightColor: 'lightblue',
    },
    height: 1000,
    width: 1000,
  };

  return (
    <div id="graph">
      <Graph
        id="graph-id" // id는 필수
        data={data}
        config={myConfig}
      />
    </div>
  );
}

export default GraphViewer;
