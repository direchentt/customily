export const ENV = {
    PORT: process.env.PORT || 3001,
    MONGO_URI: process.env.MONGO_URI || 'mongodb+srv://hugonzalexone_db_user:iG9eBhau7Fa5sks6@customily.ogrptsb.mongodb.net/hache_suite?retryWrites=true&w=majority&appName=customily',
    TN_STORE_ID: process.env.TN_STORE_ID || '6325197',
    TN_TOKEN: process.env.TN_TOKEN || '347f42c35e2dbe8fab033b243a3b43f52fc9d08b',
    get TN_API() { return `https://api.tiendanube.com/v1/${this.TN_STORE_ID}`; },
    get TN_HEADERS() {
        return {
            'Authentication': `bearer ${this.TN_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'SalesBooster/9.0 (direchentt@gmail.com)'
        };
    },
    CORS_ORIGINS: ['http://localhost:5173', 'https://www.hachedhe.com.ar', 'https://hachedhe.com.ar']
};
