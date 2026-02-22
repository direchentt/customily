import { app } from './app.js';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
    await connectDB();

    app.listen(ENV.PORT, () => {
        console.log(`🚀 SalesBooster Backend activo en http://localhost:${ENV.PORT}`);
    });
};

startServer();
