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
    companyID: number;
    username: string;
    password: string;
    postBy: string;
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
