// This function will form the standardize API responses
export const responseHandler = (res, statusCode, message, data) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const authResponseHandler = (res, statusCode, message, userData) => {
  return res
    .status(statusCode)
    .cookie("accessToken", userData.accessToken, {
      httpOnly: true,
      sameSite: "strict",
    })
    .cookie("refreshToken", userData.refreshToken, {
      httpOnly: true,
      sameSite: "strict",
    })
    .json({
      success: true,
      message,
      data: userData.user,
    });
};
