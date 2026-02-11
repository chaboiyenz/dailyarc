/**
 * Tech Tree Graph - Gaming-style node-based progression visualization
 * SVG-based graph with glowing paths and interactive nodes
 */

import { CALISTHENICS_TREE, type ExerciseNode } from '@repo/shared'

interface TechTreeGraphProps {
  completedExerciseIds: string[]
  onNodeClick: (exercise: ExerciseNode) => void
}

export default function TechTreeGraph({ completedExerciseIds, onNodeClick }: TechTreeGraphProps) {
  const width = 800
  const height = 900
  const nodeRadius = 50
  const verticalSpacing = 100

  // Calculate node positions (vertical progression)
  const nodePositions = CALISTHENICS_TREE.map((exercise, index) => ({
    ...exercise,
    x: width / 2,
    y: 100 + index * verticalSpacing,
    isCompleted: completedExerciseIds.includes(exercise.id),
    isUnlocked: isExerciseUnlocked(exercise, completedExerciseIds),
  }))

  // Helper to check if exercise is unlocked
  function isExerciseUnlocked(exercise: ExerciseNode, completed: string[]): boolean {
    if (exercise.prerequisites.length === 0) return true
    return exercise.prerequisites.every((prereqId) => completed.includes(prereqId))
  }

  return (
    <div className="relative w-full overflow-x-auto">
      <svg width={width} height={height} className="mx-auto">
        <defs>
          {/* Glow filters */}
          <filter id="glow-blue">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-green">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connection lines */}
        {nodePositions.map((node, index) => {
          if (index === 0) return null // First node has no parent

          const parent = nodePositions[index - 1]
          const isPathActive = parent.isCompleted

          return (
            <g key={`line-${node.id}`}>
              {/* Line from parent to current node */}
              <line
                x1={parent.x}
                y1={parent.y + nodeRadius}
                x2={node.x}
                y2={node.y - nodeRadius}
                className={isPathActive ? 'tree-line-active' : 'tree-line-locked'}
                strokeWidth={isPathActive ? 3 : 1}
              />

              {/* Animated dots on active paths */}
              {isPathActive && (
                <circle
                  cx={parent.x}
                  cy={parent.y + nodeRadius + 20}
                  r="3"
                  fill="hsl(var(--primary))"
                  opacity="0.8"
                >
                  <animate
                    attributeName="cy"
                    from={parent.y + nodeRadius}
                    to={node.y - nodeRadius}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          )
        })}

        {/* Nodes */}
        {nodePositions.map((node) => (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            className={`cursor-pointer transition-all ${node.isUnlocked ? 'hover:scale-110' : ''}`}
            onClick={() => node.isUnlocked && !node.isCompleted && onNodeClick(node)}
          >
            {/* Node circle background */}
            <circle
              r={nodeRadius}
              fill={
                node.isCompleted
                  ? 'hsl(var(--accent) / 0.2)'
                  : node.isUnlocked
                    ? 'hsl(var(--primary) / 0.15)'
                    : 'hsl(var(--muted) / 0.1)'
              }
              stroke={
                node.isCompleted
                  ? 'hsl(var(--accent))'
                  : node.isUnlocked
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--muted-foreground))'
              }
              strokeWidth="3"
              className={node.isCompleted ? 'glow-success' : node.isUnlocked ? 'glow-active' : 'locked'}
              filter={node.isCompleted ? 'url(#glow-green)' : node.isUnlocked ? 'url(#glow-blue)' : 'none'}
            />

            {/* Level badge */}
            <circle
              cx={-nodeRadius + 15}
              cy={-nodeRadius + 15}
              r="18"
              fill="hsl(var(--background))"
              stroke={node.isUnlocked ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
              strokeWidth="2"
            />
            <text
              x={-nodeRadius + 15}
              y={-nodeRadius + 20}
              textAnchor="middle"
              className="text-xs font-bold fill-foreground"
            >
              L{node.level}
            </text>

            {/* Node icon or status */}
            {node.isCompleted ? (
              // Checkmark for completed
              <g>
                <circle r="20" fill="hsl(var(--accent))" opacity="0.3" />
                <path
                  d="M-8,0 L-2,6 L8,-6"
                  stroke="hsl(var(--accent))"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ) : !node.isUnlocked ? (
              // Padlock for locked
              <g opacity="0.5">
                <rect x="-8" y="-2" width="16" height="12" rx="2" fill="hsl(var(--muted-foreground))" />
                <path
                  d="M-6,-2 L-6,-6 C-6,-9 -3,-9 0,-9 C3,-9 6,-9 6,-6 L6,-2"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="2"
                  fill="none"
                />
              </g>
            ) : (
              // Dumbbell icon for available exercises
              <g>
                <circle r="18" fill="hsl(var(--primary))" opacity="0.2" />
                <path
                  d="M-10,0 L10,0 M-10,-4 L-10,4 M10,-4 L10,4"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* Node label */}
            <text
              y={nodeRadius + 20}
              textAnchor="middle"
              className={`text-sm font-bold ${
                node.isUnlocked ? 'fill-foreground' : 'fill-muted-foreground'
              }`}
            >
              {node.name}
            </text>
            <text
              y={nodeRadius + 35}
              textAnchor="middle"
              className="text-xs fill-muted-foreground"
            >
              {node.sets}×{node.reps}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
