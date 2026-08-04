const getFilePath = (file, folder) => {
  if (!file) return null;
  return `/uploads/${folder}/${file.filename}`;
};

export default getFilePath;