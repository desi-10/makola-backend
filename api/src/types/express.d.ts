declare namespace Express {
  interface Request {
    userId?: string;
    organizationId?: string;
    storeId?: string;
  }
}
