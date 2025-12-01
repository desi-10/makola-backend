declare namespace Express {
  interface Request {
    userId?: string;
    organizationMembership?: OrganizationMember;
    storeId?: string;
  }
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
