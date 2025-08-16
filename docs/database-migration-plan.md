# Database Migration Plan - Task Type Support

## Overview

This document outlines the migration plan for adding `taskType` field support to the tasks collection, enabling distinction between personal and group tasks.

## Migration Requirements

### 1. Schema Changes

#### Tasks Collection
- **New Field**: `taskType: 'personal' | 'group'`
- **Modified Field**: `groupId` becomes optional (null for personal tasks)

#### Type Definitions
- Updated `Task` interface to include `taskType`
- Updated `CreateTaskInput` and `UpdateTaskInput` interfaces
- Added validation for task type consistency

#### Security Rules
- Updated Firestore security rules to handle task type validation
- Personal tasks: Only creator and assignee can access
- Group tasks: Group members can access based on existing rules

### 2. Index Updates

#### New Composite Indexes
1. **Personal Tasks by User**
   ```
   Collection: tasks
   Fields: taskType (ASC), userId (ASC), createdAt (DESC)
   ```

2. **Personal Tasks by Assignee**
   ```
   Collection: tasks
   Fields: taskType (ASC), assigneeId (ASC), status (ASC), createdAt (DESC)
   ```

3. **Group Tasks by Group**
   ```
   Collection: tasks
   Fields: taskType (ASC), groupId (ASC), status (ASC), createdAt (DESC)
   ```

### 3. Data Migration Strategy

#### Phase 1: Schema Preparation
1. Deploy new security rules with task type validation
2. Deploy new indexes
3. Update application code to handle task type

#### Phase 2: Data Migration
1. **Backup existing data**
   ```bash
   # Export current tasks collection
   firebase firestore:export --collection-ids tasks
   ```

2. **Migration script for existing tasks**
   ```javascript
   // Migration script to add taskType to existing tasks
   const migrateTasks = async () => {
     const tasksRef = db.collection('tasks');
     const snapshot = await tasksRef.get();
     
     const batch = db.batch();
     let count = 0;
     
     snapshot.docs.forEach(doc => {
       const task = doc.data();
       
       // Determine task type based on groupId
       const taskType = task.groupId ? 'group' : 'personal';
       
       batch.update(doc.ref, {
         taskType: taskType,
         // Ensure groupId is null for personal tasks
         groupId: taskType === 'personal' ? null : task.groupId
       });
       
       count++;
       
       // Commit batch every 500 operations
       if (count % 500 === 0) {
         await batch.commit();
         console.log(`Migrated ${count} tasks`);
       }
     });
     
     // Commit remaining operations
     if (count % 500 !== 0) {
       await batch.commit();
     }
     
     console.log(`Migration completed. Total tasks migrated: ${count}`);
   };
   ```

3. **Validation script**
   ```javascript
   // Validate migration results
   const validateMigration = async () => {
     const tasksRef = db.collection('tasks');
     const snapshot = await tasksRef.get();
     
     let personalCount = 0;
     let groupCount = 0;
     let errorCount = 0;
     
     snapshot.docs.forEach(doc => {
       const task = doc.data();
       
       if (!task.taskType) {
         console.error(`Task ${doc.id} missing taskType`);
         errorCount++;
         return;
       }
       
       if (task.taskType === 'personal') {
         personalCount++;
         if (task.groupId) {
           console.error(`Personal task ${doc.id} has groupId`);
           errorCount++;
         }
       } else if (task.taskType === 'group') {
         groupCount++;
         if (!task.groupId) {
           console.error(`Group task ${doc.id} missing groupId`);
           errorCount++;
         }
       }
     });
     
     console.log(`Validation Results:`);
     console.log(`- Personal tasks: ${personalCount}`);
     console.log(`- Group tasks: ${groupCount}`);
     console.log(`- Errors: ${errorCount}`);
   };
   ```

### 4. Application Updates

#### Frontend Changes
1. **TaskCreate Component**
   - Added task type selection UI
   - Dynamic form validation based on task type
   - Conditional group selection

2. **Task Display Components**
   - Visual indicators for task type
   - Different permission handling
   - Updated filtering options

3. **Task Management**
   - Separate views for personal vs group tasks
   - Updated task creation flows
   - Enhanced search and filtering

#### Backend Changes
1. **Task Creation**
   - Validate task type consistency
   - Handle group membership validation
   - Set appropriate default values

2. **Task Queries**
   - Support filtering by task type
   - Optimize queries for personal tasks
   - Maintain group task permissions

### 5. Rollback Plan

#### Emergency Rollback
1. **Revert application code** to previous version
2. **Disable new features** using feature flags
3. **Maintain backward compatibility** for existing tasks

#### Data Rollback
```javascript
// Rollback script (if needed)
const rollbackTaskType = async () => {
  const tasksRef = db.collection('tasks');
  const snapshot = await tasksRef.get();
  
  const batch = db.batch();
  let count = 0;
  
  snapshot.docs.forEach(doc => {
    const task = doc.data();
    
    // Remove taskType field
    batch.update(doc.ref, {
      taskType: firebase.firestore.FieldValue.delete()
    });
    
    count++;
    
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Rolled back ${count} tasks`);
    }
  });
  
  if (count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`Rollback completed. Total tasks: ${count}`);
};
```

### 6. Testing Strategy

#### Pre-Migration Testing
1. **Unit Tests**
   - Test task type validation
   - Test permission logic
   - Test query optimization

2. **Integration Tests**
   - Test task creation flows
   - Test task display components
   - Test filtering and search

3. **Performance Tests**
   - Test query performance with new indexes
   - Test migration script performance
   - Test application performance with new fields

#### Post-Migration Testing
1. **Data Validation**
   - Verify all tasks have correct taskType
   - Verify personal tasks have null groupId
   - Verify group tasks have valid groupId

2. **Functionality Testing**
   - Test personal task creation
   - Test group task creation
   - Test task type switching
   - Test permission enforcement

3. **Performance Monitoring**
   - Monitor query performance
   - Monitor application response times
   - Monitor database usage

### 7. Deployment Timeline

#### Week 1: Preparation
- Deploy new security rules
- Deploy new indexes
- Update application code
- Run migration scripts in staging

#### Week 2: Migration
- Execute data migration in production
- Validate migration results
- Monitor application performance
- Address any issues

#### Week 3: Validation
- Complete functionality testing
- Performance optimization
- User acceptance testing
- Documentation updates

### 8. Success Criteria

1. **Data Integrity**
   - All existing tasks have correct taskType
   - No data loss during migration
   - Consistent permission enforcement

2. **Performance**
   - Query performance maintained or improved
   - Application response times within acceptable limits
   - No significant increase in database costs

3. **Functionality**
   - Personal task creation works correctly
   - Group task creation works correctly
   - Task type switching works correctly
   - All existing features continue to work

4. **User Experience**
   - Clear distinction between personal and group tasks
   - Intuitive task creation flow
   - Improved task organization

## Risk Mitigation

### High-Risk Scenarios
1. **Data corruption during migration**
   - Mitigation: Comprehensive backup and rollback plan
   
2. **Performance degradation**
   - Mitigation: Thorough testing and monitoring
   
3. **User confusion with new interface**
   - Mitigation: Clear UI design and user guidance

### Contingency Plans
1. **Feature flag system** for gradual rollout
2. **A/B testing** for UI changes
3. **Rollback procedures** for each component
4. **Monitoring and alerting** for issues

## Post-Migration Tasks

1. **Clean up migration scripts**
2. **Update documentation**
3. **Train support team**
4. **Monitor user feedback**
5. **Plan future enhancements**