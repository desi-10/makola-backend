export const apiResponse = (message: string, data: any = null) => {
  return {
    success: true,
    message,
    data,
  };
};
