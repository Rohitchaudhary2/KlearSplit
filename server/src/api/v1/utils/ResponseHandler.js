// Function to genrate Response json object for success in API response
export const ResponseHandler = (message, data) => {
  return {
    success: true,
    message,
    data,
  };
};
