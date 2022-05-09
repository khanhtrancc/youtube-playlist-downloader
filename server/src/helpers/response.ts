export const ResponseFactory = {
  success: (data?: any, message?: string) => ({
    code: 200,
    data,
    message,
  }),
  badRequest: (message?: string) => ({
    code: 400,
    message,
  }),
  serverError: (message?: string) => ({
    code: 500,
    message,
  }),
};
