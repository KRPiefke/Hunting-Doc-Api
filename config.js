require('dotenv');
const config = {
  // Cors options
  // view all options at https://expressjs.com/en/resources/middleware/cors.html#configuration-options
  corsOptions: {
    origin: process.env.HOST,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },

  // Define wich files are allowed as RegEx pattern
  allowedFileTypes: /(.png|.jpg|.jpeg|.JPG)$/,

  // Define max size of files in bytes
  shootingFileSize: 10485760, // 10485760 are 10Mb
};
module.exports = config;
