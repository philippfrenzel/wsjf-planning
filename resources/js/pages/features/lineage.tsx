import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { Background, ConnectionMode, Controls, Edge, MarkerType, MiniMap, Node, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMemo } from 'react';

interface LineageFeature {
    id: number;
    jira_key: string;
    name: string;
    dependencies: LineageFeature[];
}

interface LineageProps {
    features: LineageFeature[];
}

// Custom node component for features
function FeatureNode({ data }: { data: { label: string; jiraKey: string; featureId: number } }) {
    const handleClick = () => {
        router.visit(route('features.show', { feature: data.featureId }));
    };

    return (
        <div
            onClick={handleClick}
            className="cursor-pointer rounded-lg border-2 border-blue-500 bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
            style={{ minWidth: '200px' }}
        >
            <div className="mb-1 text-sm font-bold text-blue-600">{data.jiraKey}</div>
            <div className="text-xs text-gray-800">{data.label}</div>
        </div>
    );
}

const nodeTypes = {
    feature: FeatureNode,
};

export default function Lineage({ features }: LineageProps) {
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Feature-Lineage', href: '#' },
    ];

    // Transform features into nodes and edges for React Flow
    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        const processedIds = new Set<number>();

        // Improved layout: position independent feature chains vertically
        let currentChainStartY = 0;
        const chainSpacing = 200; // Vertical spacing between independent chains

        function createNodesAndEdges(feature: LineageFeature, parentId?: number, depth: number = 0, chainOffsetY: number = 0) {
            if (processedIds.has(feature.id)) return { height: 0 };
            processedIds.add(feature.id);

            // Position: dependencies flow left to right (x), chains stack top to bottom (y)
            const x = depth * 350; // Horizontal spacing for dependency depth
            const y = chainOffsetY;

            nodes.push({
                id: feature.id.toString(),
                type: 'feature',
                position: { x, y },
                data: {
                    label: feature.name,
                    jiraKey: feature.jira_key,
                    featureId: feature.id,
                },
            });

            if (parentId !== undefined) {
                edges.push({
                    id: `${parentId}-${feature.id}`,
                    source: parentId.toString(),
                    target: feature.id.toString(),
                    type: 'smoothstep',
                    animated: true,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 20,
                        height: 20,
                    },
                    style: { stroke: '#3b82f6', strokeWidth: 2 },
                });
            }

            // Process dependencies and calculate total height needed
            let maxDependencyHeight = 0;
            let currentDependencyY = y;

            feature.dependencies.forEach((dep, index) => {
                const result = createNodesAndEdges(dep, feature.id, depth + 1, currentDependencyY);
                currentDependencyY += result.height + (index < feature.dependencies.length - 1 ? 150 : 0);
                maxDependencyHeight = currentDependencyY - y;
            });

            // Return the height this chain occupies
            const nodeHeight = 100; // Approximate height of a node
            return {
                height: Math.max(nodeHeight, maxDependencyHeight > 0 ? maxDependencyHeight : nodeHeight),
            };
        }

        // Process each root feature as an independent chain
        features.forEach((feature) => {
            const result = createNodesAndEdges(feature, undefined, 0, currentChainStartY);
            currentChainStartY += result.height + chainSpacing;
        });

        return { nodes, edges };
    }, [features]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-5">
                <h1 className="mb-4 text-2xl font-bold">Feature Abhängigkeits-Übersicht</h1>
                <div className="flex-1 rounded-lg border bg-gray-50" style={{ height: '700px' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        connectionMode={ConnectionMode.Loose}
                        fitView
                        attributionPosition="bottom-left"
                    >
                        <Background />
                        <Controls />
                        <MiniMap nodeColor={() => '#3b82f6'} maskColor="rgba(0, 0, 0, 0.1)" position="top-right" />
                    </ReactFlow>
                </div>
            </div>
        </AppLayout>
    );
}
