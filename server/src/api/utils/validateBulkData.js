import { Sequelize } from "sequelize";
import * as dataModels from "../../config/db.connection.js";
import { ErrorHandler } from "../middlewares/errorHandler.js";

// --- mapping of models with table names
const modelWithTable = {
  "friends_expenses": "FriendExpense",
  "group_expenses": "GroupExpense"
};
const validateBulkData = async(rows, tableName) => {
  const validRows = [];
  const errorsOccured = [];

  const modelName = modelWithTable[ tableName ];
  const Model = dataModels[ modelName ];
  
  if (!Model) {
    throw new ErrorHandler("Table not found", 404);
  }
  const processRows = async() => {
    const promises = rows.map(async(row, index) => {
      try {
        const instance = Model.build(row);
  
        await instance.validate();
        validRows.push(row);
      } catch (validationError) {
        if (
          validationError instanceof Sequelize.ValidationError || validationError instanceof Sequelize.SequelizeDatabaseError
        ) {
          errorsOccured.push({
            "row": index + 1,
            "errors": validationError.errors.map((e) => e.message)
          });
        } else {
          throw new ErrorHandler(400, validationError.message);
        }
      }
    });
  
    // Wait for all the promises to resolve
    await Promise.all(promises);
  };
  
  // Call the function to process the rows
  await processRows();
  if (errorsOccured.length > 0) {
    throw new ErrorHandler(400, errorsOccured);
  }
  return validRows;
};

export default validateBulkData;
