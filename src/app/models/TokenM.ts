export interface TokenM{
    id: number;
    code: string;
    type: string;
    value: number;
    maxUseCount: number;
    usedCount: number;
    expireAt: Date;
    isActive: boolean;
}