export interface MenuM {
  id: number;
  companyID: number;
  menuName: string;
  parentMenuID?: number;
  url: string;
  isActive: boolean;
  icon: string;
  permissionsKey: any[];
  postBy: string;
}

export interface MenuItem {
    id: number;
    parentMenuId: number | null;
    menuName: string;
    permissionsKey: PermissionKey[];
    isSelected: boolean;
    children: MenuItem[];
}

export interface PermissionKey {
    permission: string;
    isSelected: boolean;
}