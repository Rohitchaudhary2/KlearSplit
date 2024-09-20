import express from "express"
import 'dotenv/config'
import sequelize from './config/db.connection.js'
import userRouter from "./api/v1/routes/userRoutes.js"

const app = express()
app.use(express.json())
sequelize.sync()

const PORT = process.env.PORT || 3000     // eslint-disable-line no-undef

app.use('/api/v1/users', userRouter)

app.get('/', (req, res) => {
    res.send(`hi there`)
})

app.listen(PORT, () => {
    `Server is listening on port ${PORT}`
})