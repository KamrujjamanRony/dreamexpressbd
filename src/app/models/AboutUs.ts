export interface AboutUsInfoM {
    id?: number;
    title: string;
    desc: string;
    imgU: string;
}

export interface AboutUsM {
    id?: number;
    companyID: number;
    heading: string;
    imageUrl: string;
    info: AboutUsInfoM[];
}