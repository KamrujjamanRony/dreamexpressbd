export interface GalleryM {
    id?: string;
    companyID: number;
    type: string;
    description: string;
    imageFile?: File;
    imageUrl: string;
    postBy: string;
}
