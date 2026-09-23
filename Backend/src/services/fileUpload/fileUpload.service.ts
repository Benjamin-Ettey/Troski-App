import cloudinary from "cloudinary";
import { formatImage } from "../../middleware/multer.middleware";

export const uploadSingleFile = async (
  file: Express.Multer.File,
  folder: string,
): Promise<{ url: string; publicId: string }> => {
  const formattedFile = formatImage(file);

  if (!formattedFile) {
    throw new Error(`Failed to format image file: ${file.originalname}`);
  }

  const response = await cloudinary.v2.uploader.upload(formattedFile, {
    use_filename: true,
    folder,
  });

  return {
    url: response.secure_url,
    publicId: response.public_id,
  };
};

export const uploadMultipleFiles = async (
  files:
    | Express.Multer.File
    | Express.Multer.File[]
    | { [key: string]: Express.Multer.File[] }
    | undefined,
  folder: string,
): Promise<{ url: string; publicId: string }[]> => {
  if (!files) return [];

  let filesArray: Express.Multer.File[] = [];

  if (Array.isArray(files)) {
    filesArray = files;
  } else if (typeof files === "object" && "fieldname" in files) {
    filesArray = [files as Express.Multer.File];
  } else if (typeof files === "object") {
    filesArray = Object.values(files).flat();
  }

  const uploadPromises = filesArray.map((file) =>
    uploadSingleFile(file, folder),
  );
  return Promise.all(uploadPromises);
};

export const deleteCloudinaryImage = async (
  publicId: string,
): Promise<void> => {
  await cloudinary.v2.uploader.destroy(publicId);
};

export const deleteMultipleCloudinaryImages = async (
  publicIds: string[],
): Promise<void> => {
  const deletionPromises = publicIds.map((id) => deleteCloudinaryImage(id));
  await Promise.all(deletionPromises);
};
