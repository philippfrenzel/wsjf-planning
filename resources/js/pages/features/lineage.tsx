import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';
import {
    ReactFlow,
    Node,
    Edge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
    ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

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
            className="cursor-pointer rounded-lg border-2 border-blue-500 bg-white p-4 shadow-md hover:shadow-lg transition-shadow"
            style={{ minWidth: '200px' }}
        >
            <div className="font-bold text-blue-600 text-sm mb-1">{data.jiraKey}</div>
            <div className="text-gray-800 text-xs">{data.label}</div>
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

        // Calculate layout positions using a simple hierarchical layout
        const levelMap = new Map<number, number>();
        const positionMap = new Map<number, { x: number; y: number }>();

        // First pass: determine levels (depth in tree)
        function calculateLevel(feature: LineageFeature, level: number = 0) {
            if (processedIds.has(feature.id)) return;
            processedIds.add(feature.id);

            levelMap.set(feature.id, level);

            feature.dependencies.forEach((dep) => {
                calculateLevel(dep, level + 1);
            });
        }

        features.forEach((feature) => calculateLevel(feature, 0));

        // Second pass: calculate positions
        const levelCounts = new Map<number, number>();
        processedIds.clear();

        function createNodesAndEdges(feature: LineageFeature, parentId?: number) {
            if (processedIds.has(feature.id)) return;
            processedIds.add(feature.id);

            const level = levelMap.get(feature.id) || 0;
            const countAtLevel = levelCounts.get(level) || 0;
            levelCounts.set(level, countAtLevel + 1);

            // Position nodes with spacing
            const x = countAtLevel * 300;
            const y = level * 150;

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

            feature.dependencies.forEach((dep) => {
                createNodesAndEdges(dep, feature.id);
            });
        }

        features.forEach((feature) => createNodesAndEdges(feature));

        return { nodes, edges };
    }, [features]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-5">
                <h1 className="mb-4 text-2xl font-bold">Feature Abhängigkeits-Übersicht</h1>
                <div className="flex-1 border rounded-lg bg-gray-50" style={{ height: '700px' }}>
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
                        <MiniMap
                            nodeColor={(node) => '#3b82f6'}
                            maskColor="rgba(0, 0, 0, 0.1)"
                            position="top-right"
                        />
                    </ReactFlow>
                </div>
            </div>
        </AppLayout>
    );
}
