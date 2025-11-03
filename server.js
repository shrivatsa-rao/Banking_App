import express from "express";
import dotenv from "dotenv";
dotenv.config();
import bodyParser from "body-parser";

import samplereport from "./routes/report.js";
import auth from "./routes/auth.js";
import wallet from "./routes/wallet.js";

const app = express();
app.use(bodyParser.json());

app.use("/api/auth", auth);
app.use("/api/wallet", wallet);
app.use("/api/report", samplereport);

// basic health
app.get("/", (req, res) => res.send("Banking App Is Running"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
