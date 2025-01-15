export const auditLogFormat = (operationType, actorId, tableName, recordId, data) => ({
  "operation_type": operationType,
  "actor_id": actorId,
  "table_name": tableName,
  "record_id": recordId,
  "old_data": data.oldData,
  "new_data": data.newData
});
