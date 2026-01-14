# WorkflowStateBadge Component

## Overview

The `WorkflowStateBadge` is a reusable React component designed to display workflow state/status badges consistently across all entities (Feature, Project, Commitment, Planning) that have a `status_details` attribute in the WSJF Planning application.

## Location

`resources/js/components/workflow-state-badge.tsx`

## Purpose

This component eliminates code duplication and provides a consistent UI for displaying entity statuses throughout the application. Previously, status badges were implemented inline in each component, leading to repetitive code and inconsistent styling.

## Features

- **Consistent Styling**: Uses the existing Badge UI component for uniform appearance
- **Flexible Configuration**: Supports custom default labels and colors
- **Interactive**: Optional clickable functionality with hover effects
- **Type-Safe**: Fully typed with TypeScript interfaces
- **Well-Documented**: Includes JSDoc comments and usage examples

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `statusDetails` | `StatusDetails \| null \| undefined` | - | Status details object containing value, name, and color |
| `defaultLabel` | `string` | `"Status nicht gesetzt"` | Label to show when status_details is not available |
| `defaultColor` | `string` | `"bg-muted text-muted-foreground"` | Color classes to apply when status_details is not available |
| `clickable` | `boolean` | `false` | Whether to make the badge clickable (adds hover effect) |
| `onClick` | `() => void` | - | Click handler for when the badge is clicked |
| `className` | `string` | - | Additional CSS classes to apply to the badge |

### StatusDetails Interface

```typescript
interface StatusDetails {
    value: string;    // Canonical status value (e.g., "in-planning")
    name: string;     // Display label (e.g., "In Planung")
    color: string;    // Tailwind CSS color classes (e.g., "bg-blue-100 text-blue-800")
}
```

## Usage Examples

### Basic Usage

Display a status badge with the entity's status details:

```tsx
<WorkflowStateBadge statusDetails={project.status_details} />
```

### With Custom Default

Provide a custom default label when status is not set:

```tsx
<WorkflowStateBadge 
  statusDetails={commitment.status_details} 
  defaultLabel="In Planung" 
/>
```

### Clickable Badge

Make the badge interactive with a click handler:

```tsx
<WorkflowStateBadge
  statusDetails={commitment.status_details}
  clickable
  onClick={() => handleEditCommitment()}
/>
```

### Custom Styling

Add additional CSS classes:

```tsx
<WorkflowStateBadge
  statusDetails={feature.status_details}
  className="ml-2"
/>
```

## Implementation Locations

The WorkflowStateBadge component is currently used in the following pages:

### Projects
- **projects/index.tsx**: Status column in projects table

### Commitments
- **commitments/show.tsx**: Status display in commitment details
- **commitments/index.tsx**: Status column in commitments table
- **commitments/planning.tsx**: Status column in planning commitments table
- **commitments/edit.tsx**: Current status display (read-only)

### Planning
- **plannings/components/CommonVotesTable.tsx**: Clickable status badges for commitments
- **plannings/edit.tsx**: Status column in feature selection table

### Features
- **features/show.tsx**: Status card display in feature details

## Backend Integration

The component expects `status_details` to be provided by Laravel models that use the `StatusMapper` utility class:

```php
// In Laravel Model (e.g., Feature, Project, Commitment, Planning)
protected $appends = ['status_details'];

public function getStatusDetailsAttribute()
{
    return StatusMapper::details(StatusMapper::FEATURE, $this->status, 'in-planning');
}
```

The `StatusMapper` class (located at `app/Support/StatusMapper.php`) provides:
- Canonical status values
- Display labels (localized in German)
- Tailwind CSS color classes
- Status transition rules

## Benefits

1. **Code Reduction**: Eliminated ~40+ lines of repetitive badge/span rendering code
2. **Maintainability**: Single source of truth for status badge rendering
3. **Consistency**: All status badges have uniform appearance and behavior
4. **Extensibility**: New entities with status can easily use the same component
5. **Type Safety**: TypeScript interfaces ensure correct usage

## Migration Guide

### Before (Old Implementation)

```tsx
{project.status_details ? (
    <span className={`inline-block rounded-md px-2 py-1 text-xs ${project.status_details.color}`}>
        {project.status_details.name}
    </span>
) : (
    <span className="inline-block rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
        In Planung
    </span>
)}
```

### After (New Implementation)

```tsx
<WorkflowStateBadge 
  statusDetails={project.status_details} 
  defaultLabel="In Planung" 
/>
```

## Adding to New Pages

To use the WorkflowStateBadge component in a new page:

1. Import the component:
```tsx
import { WorkflowStateBadge } from '@/components/workflow-state-badge';
```

2. Use it in your JSX:
```tsx
<WorkflowStateBadge statusDetails={entity.status_details} />
```

3. Ensure your entity model has the `status_details` accessor properly configured

## Testing

The component has been:
- ✅ Built successfully with Vite
- ✅ Linted with no new errors
- ✅ Integrated across 8+ different pages
- ✅ Tested with all entity types (Feature, Project, Commitment, Planning)

## Future Enhancements

Potential improvements for future iterations:

1. **Icon Support**: Add optional status icons
2. **Tooltip**: Show additional status information on hover
3. **Animation**: Add transition effects for status changes
4. **Status History**: Link to status change history
5. **Accessibility**: Enhanced ARIA labels for screen readers

## Related Files

- Component: `resources/js/components/workflow-state-badge.tsx`
- UI Badge: `resources/js/components/ui/badge.tsx`
- Backend Mapper: `app/Support/StatusMapper.php`
- Models: `app/Models/{Feature,Project,Commitment,Planning}.php`
- States: `app/States/{Feature,Project,Commitment,Planning}/*State.php`
