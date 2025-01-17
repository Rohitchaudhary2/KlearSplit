import { AuditLog } from "../../config/db.connection.js";

class AuditLogDb {
  static createLog = async(log) => await AuditLog.create(log);

  static createBulkLogs = async(logs) => await AuditLog.bulkCreate(logs);
}

export default AuditLogDb;
