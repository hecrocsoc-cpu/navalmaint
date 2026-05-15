require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const vesselRoutes = require("./routes/vessels");
const equipmentRoutes = require("./routes/equipment");
const taskRoutes = require("./routes/tasks");
const logRoutes = require("./routes/logs");
const stockRoutes = require("./routes/stock");
const errorHandler = require("./middleware/errorHandler");
const userRoutes = require("./routes/users");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/vessels", vesselRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/users", userRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "NavalMaint API funcionando" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;
