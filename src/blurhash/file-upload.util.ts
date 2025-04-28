import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerImageStorage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + extname(file.originalname));
  },
});

export const imageFileFilter = (req: any, file: any, cb: Function) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('只能上传图片文件'), false);
  }
  cb(null, true);
};
