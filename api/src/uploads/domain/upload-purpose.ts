export enum UploadPurpose {
  RESTAURANT_COVER = 'RESTAURANT_COVER',
  DISH_PHOTO = 'DISH_PHOTO',
}

export const UPLOAD_PURPOSE_FOLDERS: Record<UploadPurpose, string> = {
  [UploadPurpose.RESTAURANT_COVER]: 'restaurant-covers',
  [UploadPurpose.DISH_PHOTO]: 'dish-photos',
};
