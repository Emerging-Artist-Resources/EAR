# Listings Schema Design Documentation

## Overview

This schema design supports all listing types (Audition, Creative Opportunity, Performance, Class/Workshop) with parent-child relationships and admin merge capabilities.

## Schema Structure

### Core Tables

#### 1. `listings` (Base Table)
- Contains common fields shared by all listing types
- Fields: contact info, location, media, status, timestamps
- Supports soft deletes via `deleted_at`
- Status workflow: `pending` → `approved` / `rejected`

#### 2. Type-Specific Detail Tables
- `audition_details` - Audition-specific fields
- `creative_details` - Creative opportunity-specific fields
- `performance_details` - Performance-specific fields (ORGANIZER or PIECE)
- `piece_details` - Additional details for PIECE subtype
- `class_workshop_details` - Class/Workshop-specific fields

#### 3. Supporting Tables
- `listing_photos` - Photos with credits and sort order
- `listing_occurrences` - Date/time occurrences
- `listing_relationships` - Parent-child relationships
- `listing_merges` - Merge tracking for admin operations

## Parent-Child Relationships

### Performance → Pieces
- **Parent**: Performance with `subtype = 'ORGANIZER'`
- **Child**: Performance with `subtype = 'PIECE'`
- **Relationship Type**: `'performance_piece'`
- **Storage**: 
  - `listing_relationships` table tracks the relationship
  - `piece_details` table stores piece-specific information
  - `piece_details.parent_listing_id` references the parent performance

### Workshop → Classes
- **Parent**: Class/Workshop with `class_workshop_type = 'WORKSHOP'`
- **Child**: Class/Workshop with `class_workshop_type = 'CLASS'`
- **Relationship Type**: `'workshop_class'`
- **Storage**: `listing_relationships` table tracks the relationship

## Admin Operations

### 1. Merge Duplicate Listings

When admin identifies duplicate listings:

```sql
-- Step 1: Create merge record
INSERT INTO listing_merges (source_listing_id, target_listing_id, merged_by, merge_reason)
VALUES ('source-uuid', 'target-uuid', 'admin-uuid', 'Duplicate listing');

-- Step 2: Move relationships from source to target
UPDATE listing_relationships
SET parent_listing_id = 'target-uuid'
WHERE parent_listing_id = 'source-uuid';

UPDATE listing_relationships
SET child_listing_id = 'target-uuid'
WHERE child_listing_id = 'source-uuid';

-- Step 3: Move photos from source to target
UPDATE listing_photos
SET listing_id = 'target-uuid'
WHERE listing_id = 'source-uuid';

-- Step 4: Move occurrences from source to target
UPDATE listing_occurrences
SET listing_id = 'target-uuid'
WHERE listing_id = 'source-uuid';

-- Step 5: Soft delete source listing
UPDATE listings
SET deleted_at = NOW()
WHERE id = 'source-uuid';
```

### 2. Add Child to Parent

#### Add Piece to Performance

```sql
-- Step 1: Ensure parent is ORGANIZER type
UPDATE performance_details
SET subtype = 'ORGANIZER'
WHERE listing_id = 'parent-uuid';

-- Step 2: Create child piece listing
INSERT INTO listings (type, status, ...)
VALUES ('performance', 'pending', ...)
RETURNING id;

-- Step 3: Create piece details
INSERT INTO performance_details (listing_id, subtype, ...)
VALUES ('child-uuid', 'PIECE', ...);

INSERT INTO piece_details (listing_id, parent_listing_id, ...)
VALUES ('child-uuid', 'parent-uuid', ...);

-- Step 4: Create relationship
INSERT INTO listing_relationships (parent_listing_id, child_listing_id, relationship_type)
VALUES ('parent-uuid', 'child-uuid', 'performance_piece');
```

#### Add Class to Workshop

```sql
-- Step 1: Ensure parent is WORKSHOP type
UPDATE class_workshop_details
SET class_workshop_type = 'WORKSHOP'
WHERE listing_id = 'parent-uuid';

-- Step 2: Create child class listing
INSERT INTO listings (type, status, ...)
VALUES ('class', 'pending', ...)
RETURNING id;

-- Step 3: Create class details
INSERT INTO class_workshop_details (listing_id, class_workshop_type, ...)
VALUES ('child-uuid', 'CLASS', ...);

-- Step 4: Create relationship
INSERT INTO listing_relationships (parent_listing_id, child_listing_id, relationship_type)
VALUES ('parent-uuid', 'child-uuid', 'workshop_class');
```

### 3. Query Parent with Children

```sql
-- Get performance with all its pieces
SELECT 
  p.*,
  pd.*,
  json_agg(
    json_build_object(
      'id', child.id,
      'title', child_pd.title,
      'status', child.status
    )
  ) as pieces
FROM listings p
JOIN performance_details pd ON p.id = pd.listing_id
LEFT JOIN listing_relationships lr ON p.id = lr.parent_listing_id AND lr.relationship_type = 'performance_piece'
LEFT JOIN listings child ON lr.child_listing_id = child.id
LEFT JOIN performance_details child_pd ON child.id = child_pd.listing_id
WHERE p.id = 'parent-uuid' AND p.deleted_at IS NULL
GROUP BY p.id, pd.id;
```

## Data Flow Examples

### Creating an Audition Listing

1. Insert into `listings` (base fields)
2. Insert into `audition_details` (type-specific fields)
3. Insert into `listing_occurrences` (audition dates)
4. Insert into `listing_occurrences` (deadline dates, with different metadata)
5. Insert into `listing_photos` (promotional images)

### Creating a Performance with Pieces

1. **Create Parent Performance (ORGANIZER)**:
   - Insert into `listings`
   - Insert into `performance_details` with `subtype = 'ORGANIZER'`
   - Insert into `listing_occurrences` (performance schedule)

2. **Create Child Piece**:
   - Insert into `listings` (type = 'performance')
   - Insert into `performance_details` with `subtype = 'PIECE'`
   - Insert into `piece_details` with `parent_listing_id`
   - Insert into `listing_relationships` (link to parent)
   - Insert into `listing_occurrences` (piece schedule, if custom)

### Creating a Workshop with Classes

1. **Create Parent Workshop**:
   - Insert into `listings` (type = 'class')
   - Insert into `class_workshop_details` with `class_workshop_type = 'WORKSHOP'`

2. **Create Child Classes**:
   - Insert into `listings` (type = 'class')
   - Insert into `class_workshop_details` with `class_workshop_type = 'CLASS'`
   - Insert into `listing_relationships` (link to parent workshop)

## Key Design Decisions

1. **Separate Detail Tables**: Each listing type has its own detail table to avoid sparse columns and maintain type safety.

2. **Generic Relationship Table**: `listing_relationships` supports multiple relationship types, making it easy to add new relationship types in the future.

3. **Merge Tracking**: `listing_merges` table provides audit trail for admin merge operations.

4. **Soft Deletes**: `deleted_at` column allows recovery and maintains referential integrity.

5. **Status Workflow**: Clear status progression from `pending` → `approved`/`rejected`.

6. **Occurrences**: Separate table allows multiple date/time entries per listing, supporting complex schedules.

## Migration Notes

When migrating from existing schema:

1. Map existing `events` table to `listings` table
2. Migrate type-specific data to detail tables
3. Create relationships for existing parent-child data
4. Preserve merge history if available
5. Update foreign key references

## Indexes

The schema includes indexes on:
- `type` and `status` for filtering
- `created_by` for user queries
- `created_at` for sorting
- Foreign keys for joins
- Composite indexes for common query patterns

## Security

- Row Level Security (RLS) enabled on all tables
- Example policies provided (customize based on requirements)
- Admin policies allow full access
- User policies restrict to own listings

## Views

- `listings_with_details`: Convenient view joining listings with type-specific details
- `listing_hierarchy`: View showing parent-child relationships

## Future Enhancements

Potential additions:
- Listing versioning/history
- Bulk operations support
- Advanced search indexes (full-text search)
- Analytics tables
- Notification preferences
