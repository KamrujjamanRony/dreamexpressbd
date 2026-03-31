export interface BlogDtl {
    title: string;
    desc: string;
    iUrl: string;
    imageUrl?: string;
}

export interface BlogM {
    id?: any;
    companyID: any;
    sl: string;
    heading: string;
    galleryId: string;
    imageUrl: string;
    vLink: string;
    dtls: BlogDtl[];
}
