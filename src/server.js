import app from "./app.js";

const PORT = process.env.PORT || 3000;

const start = async () => {
    try{
        await app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        })
    }catch(e) {
        console.log(e);
    }
}

start();