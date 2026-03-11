export interface MenusM {
  id: number;
  companyID: number;
  menuName: string;
  parentMenuID?: number;
  url: string;
  isActive: boolean;
  icon: string;
  permissionsKey: string[];
  postBy: string;
}