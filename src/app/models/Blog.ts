export interface BlogDtl {
    title: string;
    desc: string;
    iUrl: string;
}

export interface BlogM {
    id?: any;
    companyID: any;
    sl: string;
    heading: string;
    imageUrl: string;
    vLink: string;
    dtls: BlogDtl[];
}
