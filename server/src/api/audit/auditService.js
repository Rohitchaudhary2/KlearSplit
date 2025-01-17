import AuditLogDb from "./auditDb.js";

class AuditLogService {
  static createLog = async(data, isBulkCreate) => {
    if (!isBulkCreate) {
      return await AuditLogDb.createLog(data);
    }
    
    return await AuditLogDb.createBulkLogs(data);
  };
}

export default AuditLogService;
