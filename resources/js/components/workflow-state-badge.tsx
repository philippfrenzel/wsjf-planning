import { Badge } from '@/components/ui/badge';
import * as React from 'react';

/**
 * Interface for status details returned by StatusMapper
 */
interface StatusDetails {
    value: string;
    name: string;
    color: string;
}

/**
 * Props for the WorkflowStateBadge component
 */
interface WorkflowStateBadgeProps {
    /**
     * Status details object containing value, name, and color
     */
    statusDetails?: StatusDetails | null;
    /**
     * Default label to show when status_details is not available
     * @default "Status nicht gesetzt"
     */
    defaultLabel?: string;
    /**
     * Default color classes to apply when status_details is not available
     * @default "bg-muted text-muted-foreground"
     */
    defaultColor?: string;
    /**
     * Whether to make the badge clickable (adds hover effect)
     * @default false
     */
    clickable?: boolean;
    /**
     * Click handler for when the badge is clicked
     */
    onClick?: () => void;
    /**
     * Additional CSS classes to apply to the badge
     */
    className?: string;
}

/**
 * WorkflowStateBadge Component
 *
 * A reusable component for displaying workflow state/status badges across all entities
 * (Feature, Project, Commitment, Planning) that have a status_details attribute.
 *
 * @example
 * // Basic usage with status_details
 * <WorkflowStateBadge statusDetails={entity.status_details} />
 *
 * @example
 * // With custom default label and color
 * <WorkflowStateBadge
 *   statusDetails={entity.status_details}
 *   defaultLabel="In Planung"
 *   defaultColor="bg-blue-100 text-blue-800"
 * />
 *
 * @example
 * // Clickable badge with handler
 * <WorkflowStateBadge
 *   statusDetails={entity.status_details}
 *   clickable
 *   onClick={() => handleStatusChange()}
 * />
 */
export function WorkflowStateBadge({
    statusDetails,
    defaultLabel = 'Status nicht gesetzt',
    defaultColor = 'bg-muted text-muted-foreground',
    clickable = false,
    onClick,
    className,
}: WorkflowStateBadgeProps) {
    // Determine the label and color to display
    const label = statusDetails?.name || defaultLabel;
    const colorClasses = statusDetails?.color || defaultColor;

    // Build the final className
    const badgeClassName = [
        colorClasses,
        clickable && 'cursor-pointer hover:opacity-80',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <Badge className={badgeClassName} onClick={onClick}>
            {label}
        </Badge>
    );
}
