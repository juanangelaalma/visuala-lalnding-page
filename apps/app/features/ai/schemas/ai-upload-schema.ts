export class InvalidImagesError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 8 * 1024 * 1024;

export const parseImageFiles = (formData: FormData) => {
  const files = formData.getAll("images").filter((value): value is File => value instanceof File);

  if (files.length < 1 || files.length > 8) {
    throw new InvalidImagesError("Upload 1 to 8 images");
  }
  if (files.some((file) => !allowedImageTypes.has(file.type) || file.size > maxImageBytes)) {
    throw new InvalidImagesError("Images must be JPG, PNG or WEBP and no larger than 8 MB");
  }

  return files;
};

export const imageFileExtension = (file: File) => ({
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
})[file.type]!;
