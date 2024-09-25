// This function will form the standardize API responses 
export const ResponseHandler = (message, data) => {
  return {
    success: true,
    message,
    data,
  };
};
