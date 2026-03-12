import { MenuItem } from "./Menu";

export interface UsersM {
    id: number;
    userName: string;
    password: string;
    companyID: number;
    isActive: boolean;
    postBy: number | null;
}

export interface UserM {
    user: UsersM;
    treeData: MenuItem[];
}

export interface UserFormM {
    userId: number;
    userName: string;
    password: string;
    isActive: boolean;
    menuPermissions: MenuItem[];
}

export interface UserFormResponseM {
    response: {
        user: UsersM;
        treeData: MenuItem[];
    }
}

export interface UserDeleteResponseM {
    user: UsersM | null;
    treeData: MenuItem[];
}

export interface PermissionOptionM {
  key: string;
  value: string;
}