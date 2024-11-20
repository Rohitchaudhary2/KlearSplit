// This function will form the standardize API responses
export const responseHandler = (res, statusCode, message, data) => {
  return res.status(statusCode).json({
    "success": true,
    message,
    data
  });
};

// This function will form the standardize API responses with access and refresh tokens
export const authResponseHandler = (res, statusCode, message, userData) => {
  return res
    .status(statusCode)
    .cookie("accessToken", userData.accessToken, {
      "httpOnly": true,
      "sameSite": "strict",
      "maxAge": 10 * 24 * 60 * 60 * 1000
    })
    .cookie("refreshToken", userData.refreshToken, {
      "httpOnly": true,
      "sameSite": "strict",
      "maxAge": 10 * 24 * 60 * 60 * 1000
    })
    .json({
      "success": true,
      message,
      "data": userData.user
    });
};
